from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app, verify_jwt
from services.pyg_service import (
    DEFAULT_CHANNELS,
    calculate_pyg_by_channel,
    parse_pyg_csv,
)

client = TestClient(app)


def override_verify_jwt():
    return MagicMock(id="cfo_1")


app.dependency_overrides[verify_jwt] = override_verify_jwt


def test_pyg_math_proportional_allocation_and_loss_detection():
    # Dataset validado:
    # B2B: net_rev = 60,000 (60% de ventas)
    # E-commerce: net_rev = 20,000 (20% de ventas), COGS=15,000, direct_opex=8,000 -> en pérdida
    # Distribuidores: net_rev = 20,000 (20% de ventas)
    # Retail: net_rev = 0
    # Total ventas netas = 100,000. Gastos indirectos = 10,000.
    channels = [
        {"id": "c_b2b", "code": "B2B", "name": "B2B"},
        {"id": "c_eco", "code": "ECOMMERCE", "name": "E-commerce"},
        {"id": "c_dis", "code": "DISTRIBUIDORES", "name": "Distribuidores"},
        {"id": "c_ret", "code": "RETAIL", "name": "Retail"},
    ]
    entries = [
        {
            "channel_id": "c_b2b",
            "gross_revenue": 65000,
            "returns_discounts": 5000,
            "cogs": 25000,
            "direct_opex": 5000,
            "depreciation_amort": 1000,
            "taxes_financial": 2000,
        },
        {
            "channel_id": "c_eco",
            "gross_revenue": 22000,
            "returns_discounts": 2000,
            "cogs": 15000,
            "direct_opex": 8000,
            "depreciation_amort": 500,
            "taxes_financial": 500,
        },
        {
            "channel_id": "c_dis",
            "gross_revenue": 20000,
            "returns_discounts": 0,
            "cogs": 10000,
            "direct_opex": 2000,
            "depreciation_amort": 0,
            "taxes_financial": 1000,
        },
    ]
    indirects = [
        {"amount": 6000, "category": "Nómina Admin"},
        {"amount": 4000, "category": "Arriendo"},
    ]

    result = calculate_pyg_by_channel(channels, entries, indirects)
    by_code = {r["code"]: r for r in result["channels"]}

    # B2B: 60% de 10,000 = 6,000 indirectos; GP=35,000; EBITDA=35,000-5,000-6,000=24,000; Net=21,000 (35%)
    assert by_code["B2B"]["net_revenue"] == 60000.0
    assert by_code["B2B"]["revenue_share_pct"] == 60.0
    assert by_code["B2B"]["allocated_indirect_opex"] == 6000.0
    assert by_code["B2B"]["ebitda"] == 24000.0
    assert by_code["B2B"]["net_income"] == 21000.0
    assert by_code["B2B"]["net_margin_pct"] == 35.0
    assert by_code["B2B"]["is_loss"] is False

    # E-commerce: 20% de 10,000 = 2,000 indirectos; GP=5,000; EBITDA=5,000-8,000-2,000=-5,000; Net=-6,000 (-30%)
    assert by_code["ECOMMERCE"]["net_revenue"] == 20000.0
    assert by_code["ECOMMERCE"]["allocated_indirect_opex"] == 2000.0
    assert by_code["ECOMMERCE"]["ebitda"] == -5000.0
    assert by_code["ECOMMERCE"]["net_income"] == -6000.0
    assert by_code["ECOMMERCE"]["net_margin_pct"] == -30.0
    assert by_code["ECOMMERCE"]["is_loss"] is True

    # Consolidado: NetRev=100,000; GP=50,000; Direct=15,000; Indirect=10,000; EBITDA=25,000; Net=20,000
    assert result["consolidated"]["net_revenue"] == 100000.0
    assert result["consolidated"]["ebitda"] == 25000.0
    assert result["consolidated"]["net_income"] == 20000.0
    assert len(result["loss_channels"]) == 1
    assert result["loss_channels"][0]["code"] == "ECOMMERCE"


def test_parse_pyg_csv():
    csv_data = (
        "channel,period_month,gross_revenue,returns_discounts,cogs,direct_opex,depreciation_amort,taxes_financial,indirect_expense_category,indirect_expense_amount,notes\n"
        "B2B,2026-11,50000,0,20000,5000,0,0,,,Venta B2B\n"
        "INDIRECT,2026-11,0,0,0,0,0,0,Arriendo,3000,Sede central\n"
    )
    parsed = parse_pyg_csv(csv_data, DEFAULT_CHANNELS)
    assert parsed["errors"] == []
    assert len(parsed["entries"]) == 1
    assert parsed["entries"][0]["channel_id"] == "B2B"
    assert parsed["entries"][0]["gross_revenue"] == 50000.0
    assert len(parsed["indirects"]) == 1
    assert parsed["indirects"][0]["amount"] == 3000.0


def test_pyg_endpoint_triggers_loss_alerts_and_ai_analysis():
    mock_supa = MagicMock()

    channels_data = [
        {"id": "c_b2b", "code": "B2B", "name": "B2B", "active": True},
        {"id": "c_eco", "code": "ECOMMERCE", "name": "E-commerce", "active": True},
    ]
    entries_data = [
        {
            "channel_id": "c_b2b",
            "period_month": "2026-11",
            "gross_revenue": 50000,
            "returns_discounts": 0,
            "cogs": 20000,
            "direct_opex": 5000,
            "depreciation_amort": 0,
            "taxes_financial": 0,
        },
        {
            "channel_id": "c_eco",
            "period_month": "2026-11",
            "gross_revenue": 10000,
            "returns_discounts": 1000,
            "cogs": 8000,
            "direct_opex": 4000,
            "depreciation_amort": 0,
            "taxes_financial": 500,
        },
    ]
    indirects_data = [{"period_month": "2026-11", "amount": 2000, "category": "Admin"}]
    profiles_data = [
        {"id": "cfo_1", "is_master_admin": False, "roles": {"name": "Dirección Financiera", "access_level": 2}},
        {"id": "ceo_1", "is_master_admin": False, "roles": {"name": "Gerencia General", "access_level": 1}},
        {"id": "emp_99", "is_master_admin": False, "roles": {"name": "Auxiliar Bodega", "access_level": 3}},
    ]

    notif_tbl = MagicMock()
    notif_tbl.insert.return_value.execute.return_value = MagicMock(data=[{"id": "n1"}])

    def router(name):
        tbl = MagicMock()
        if name == "sales_channels":
            c = MagicMock()
            c.eq.return_value = c
            c.order.return_value = c
            c.execute.return_value = MagicMock(data=channels_data)
            tbl.select.return_value = c
        elif name == "channel_financial_entries":
            c = MagicMock()
            c.gte.return_value = c
            c.lte.return_value = c
            c.execute.return_value = MagicMock(data=entries_data)
            tbl.select.return_value = c
        elif name == "indirect_expenses":
            c = MagicMock()
            c.gte.return_value = c
            c.lte.return_value = c
            c.execute.return_value = MagicMock(data=indirects_data)
            tbl.select.return_value = c
        elif name == "profiles":
            c = MagicMock()
            c.execute.return_value = MagicMock(data=profiles_data)
            tbl.select.return_value = c
        elif name == "notifications":
            return notif_tbl
        return tbl

    mock_supa.table.side_effect = router

    with patch("main.supabase", mock_supa), patch("main.require_admin_or_manager"):
        resp = client.get("/api/v1/pyg/report?period_month=2026-11&trigger_alerts=true")
        assert resp.status_code == 200
        report = resp.json()

        assert report["alerts_triggered"] == 2
        notified_users = {call.args[0]["profile_id"] for call in notif_tbl.insert.call_args_list}
        assert notified_users == {"cfo_1", "ceo_1"}
        assert all(call.args[0]["type"] == "pyg_loss_alert" for call in notif_tbl.insert.call_args_list)

        # Verificar diagnóstico IA sobre el PyG
        ai_resp = client.post("/api/v1/pyg/ai-analysis", json={"report": report, "trigger_alerts": False})
        assert ai_resp.status_code == 200
        analysis = ai_resp.json()["analysis"]
        assert "E-commerce" in analysis["loss_channels_detected"]
        assert any("E-commerce" in d for d in analysis["cost_deviations"])


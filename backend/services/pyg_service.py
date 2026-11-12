"""
Servicio financiero de Pérdidas y Ganancias (PyG) por Canal de Venta (Req. 2.7 / Financiero).
- Canales activos: B2B, E-commerce, Distribuidores, Retail (extensible).
- Prorrateo de gastos indirectos: proporcional a las ventas netas por canal.
- Corte: Mensual (YYYY-MM) con acumulado anual YTD (Enero -> mes de corte).
- Alertas automáticas cuando Margen Neto < 0% o EBITDA < 0 hacia Dirección Financiera y Gerencia General.
"""

import csv
import io
import json
from typing import Any, Dict, List, Optional


DEFAULT_CHANNELS = [
    {"id": "B2B", "code": "B2B", "name": "B2B"},
    {"id": "ECOMMERCE", "code": "ECOMMERCE", "name": "E-commerce"},
    {"id": "DISTRIBUIDORES", "code": "DISTRIBUIDORES", "name": "Distribuidores"},
    {"id": "RETAIL", "code": "RETAIL", "name": "Retail"},
]


def _round2(val: float) -> float:
    return round(float(val), 2)


def calculate_pyg_by_channel(
    channels: List[Dict[str, Any]],
    direct_entries: List[Dict[str, Any]],
    indirect_expenses: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Calcula el PyG completo por canal y el consolidado total.
    Fórmulas:
      net_revenue = gross_revenue - returns_discounts
      gross_profit = net_revenue - cogs
      revenue_share = net_revenue / total_net_revenue (si total_net_revenue > 0)
      allocated_indirect = total_indirect * revenue_share
      ebitda = gross_profit - direct_opex - allocated_indirect
      net_income = ebitda - depreciation_amort - taxes_financial
      is_loss = (net_margin_pct < 0) or (ebitda < 0)
    """
    active_channels = channels or DEFAULT_CHANNELS
    agg: Dict[str, Dict[str, Any]] = {}
    for ch in active_channels:
        cid = ch["id"]
        agg[cid] = {
            "channel_id": cid,
            "code": ch.get("code", cid),
            "name": ch.get("name", cid),
            "gross_revenue": 0.0,
            "returns_discounts": 0.0,
            "cogs": 0.0,
            "direct_opex": 0.0,
            "depreciation_amort": 0.0,
            "taxes_financial": 0.0,
        }

    for entry in direct_entries:
        cid = entry.get("channel_id")
        if cid not in agg:
            continue
        agg[cid]["gross_revenue"] += float(entry.get("gross_revenue") or 0)
        agg[cid]["returns_discounts"] += float(entry.get("returns_discounts") or 0)
        agg[cid]["cogs"] += float(entry.get("cogs") or 0)
        agg[cid]["direct_opex"] += float(entry.get("direct_opex") or 0)
        agg[cid]["depreciation_amort"] += float(entry.get("depreciation_amort") or 0)
        agg[cid]["taxes_financial"] += float(entry.get("taxes_financial") or 0)

    total_net_revenue = sum(
        max(0.0, v["gross_revenue"] - v["returns_discounts"]) for v in agg.values()
    )
    total_indirect = sum(float(exp.get("amount") or 0) for exp in indirect_expenses)
    num_channels = len(agg)

    channel_rows: List[Dict[str, Any]] = []
    loss_channels: List[Dict[str, Any]] = []

    for cid, v in agg.items():
        gross_rev = _round2(v["gross_revenue"])
        returns_disc = _round2(v["returns_discounts"])
        net_rev = _round2(gross_rev - returns_disc)
        cogs = _round2(v["cogs"])
        gross_profit = _round2(net_rev - cogs)
        gross_margin_pct = _round2((gross_profit / net_rev) * 100) if net_rev > 0 else 0.0

        if total_net_revenue > 0:
            revenue_share = max(0.0, net_rev) / total_net_revenue
        else:
            revenue_share = (1.0 / num_channels) if num_channels > 0 else 0.0

        allocated_indirect = _round2(total_indirect * revenue_share)
        direct_opex = _round2(v["direct_opex"])
        ebitda = _round2(gross_profit - direct_opex - allocated_indirect)
        ebitda_margin_pct = (
            _round2((ebitda / net_rev) * 100)
            if net_rev > 0
            else (-100.0 if ebitda < 0 else 0.0)
        )

        depr = _round2(v["depreciation_amort"])
        taxes = _round2(v["taxes_financial"])
        net_income = _round2(ebitda - depr - taxes)
        net_margin_pct = (
            _round2((net_income / net_rev) * 100)
            if net_rev > 0
            else (-100.0 if net_income < 0 else 0.0)
        )

        is_loss = (net_margin_pct < 0) or (ebitda < 0)

        row = {
            "channel_id": cid,
            "code": v["code"],
            "name": v["name"],
            "gross_revenue": gross_rev,
            "returns_discounts": returns_disc,
            "net_revenue": net_rev,
            "revenue_share_pct": _round2(revenue_share * 100),
            "cogs": cogs,
            "gross_profit": gross_profit,
            "gross_margin_pct": gross_margin_pct,
            "direct_opex": direct_opex,
            "allocated_indirect_opex": allocated_indirect,
            "ebitda": ebitda,
            "ebitda_margin_pct": ebitda_margin_pct,
            "depreciation_amort": depr,
            "taxes_financial": taxes,
            "net_income": net_income,
            "net_margin_pct": net_margin_pct,
            "is_loss": is_loss,
        }
        channel_rows.append(row)
        if is_loss:
            loss_channels.append(row)

    cons_gross_rev = _round2(sum(r["gross_revenue"] for r in channel_rows))
    cons_returns = _round2(sum(r["returns_discounts"] for r in channel_rows))
    cons_net_rev = _round2(sum(r["net_revenue"] for r in channel_rows))
    cons_cogs = _round2(sum(r["cogs"] for r in channel_rows))
    cons_gross_profit = _round2(cons_net_rev - cons_cogs)
    cons_direct_opex = _round2(sum(r["direct_opex"] for r in channel_rows))
    cons_indirect = _round2(sum(r["allocated_indirect_opex"] for r in channel_rows))
    cons_ebitda = _round2(cons_gross_profit - cons_direct_opex - cons_indirect)
    cons_depr = _round2(sum(r["depreciation_amort"] for r in channel_rows))
    cons_taxes = _round2(sum(r["taxes_financial"] for r in channel_rows))
    cons_net_income = _round2(cons_ebitda - cons_depr - cons_taxes)

    consolidated = {
        "gross_revenue": cons_gross_rev,
        "returns_discounts": cons_returns,
        "net_revenue": cons_net_rev,
        "cogs": cons_cogs,
        "gross_profit": cons_gross_profit,
        "gross_margin_pct": _round2((cons_gross_profit / cons_net_rev) * 100) if cons_net_rev > 0 else 0.0,
        "direct_opex": cons_direct_opex,
        "allocated_indirect_opex": cons_indirect,
        "ebitda": cons_ebitda,
        "ebitda_margin_pct": _round2((cons_ebitda / cons_net_rev) * 100) if cons_net_rev > 0 else 0.0,
        "depreciation_amort": cons_depr,
        "taxes_financial": cons_taxes,
        "net_income": cons_net_income,
        "net_margin_pct": _round2((cons_net_income / cons_net_rev) * 100) if cons_net_rev > 0 else 0.0,
        "is_loss": (cons_net_income < 0) or (cons_ebitda < 0),
    }

    return {
        "channels": channel_rows,
        "consolidated": consolidated,
        "loss_channels": loss_channels,
        "total_indirect_expenses": _round2(total_indirect),
    }


def parse_pyg_csv(csv_text: str, channels: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Parsea un archivo CSV con columnas:
      channel, period_month, gross_revenue, returns_discounts, cogs, direct_opex,
      depreciation_amort, taxes_financial, indirect_expense_category, indirect_expense_amount, notes
    Soporta filas de canal directo o filas de gasto indirecto (cuando channel == 'INDIRECT' o indirect_expense_amount > 0).
    """
    channel_lookup: Dict[str, str] = {}
    for c in channels:
        channel_lookup[c["code"].strip().upper()] = c["id"]
        channel_lookup[c["name"].strip().upper()] = c["id"]

    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    entries: List[Dict[str, Any]] = []
    indirects: List[Dict[str, Any]] = []
    errors: List[str] = []

    for idx, row in enumerate(reader, start=2):
        period_month = (row.get("period_month") or "").strip()[:7]
        if len(period_month) != 7 or "-" not in period_month:
            errors.append(f"Fila {idx}: period_month inválido '{period_month}'")
            continue

        ch_key = (row.get("channel") or "").strip().upper()
        ind_amt = float(row.get("indirect_expense_amount") or 0)

        if ch_key in ("INDIRECT", "INDIRECTO", "GASTO_INDIRECTO", "") and ind_amt > 0:
            indirects.append({
                "period_month": period_month,
                "category": (row.get("indirect_expense_category") or "Gastos Administrativos").strip(),
                "description": (row.get("notes") or "").strip() or None,
                "amount": ind_amt,
                "source": "csv",
            })
            continue

        channel_id = channel_lookup.get(ch_key)
        if not channel_id:
            errors.append(f"Fila {idx}: canal desconocido '{row.get('channel')}'")
            continue

        entries.append({
            "channel_id": channel_id,
            "period_month": period_month,
            "gross_revenue": float(row.get("gross_revenue") or 0),
            "returns_discounts": float(row.get("returns_discounts") or 0),
            "cogs": float(row.get("cogs") or 0),
            "direct_opex": float(row.get("direct_opex") or 0),
            "depreciation_amort": float(row.get("depreciation_amort") or 0),
            "taxes_financial": float(row.get("taxes_financial") or 0),
            "notes": (row.get("notes") or "").strip() or None,
            "source": "csv",
        })

        if ind_amt > 0:
            indirects.append({
                "period_month": period_month,
                "category": (row.get("indirect_expense_category") or "Gastos Indirectos").strip(),
                "description": (row.get("notes") or "").strip() or None,
                "amount": ind_amt,
                "source": "csv",
            })

    return {"entries": entries, "indirects": indirects, "errors": errors}


class PygService:
    """Orquesta cálculo de PyG mensual/YTD, alertas de pérdida y diagnóstico IA."""

    def __init__(self, supabase_client=None, notifier=None, anthropic_client=None, claude_model: str = "claude-sonnet-5"):
        self.supabase = supabase_client
        self.notifier = notifier
        self.anthropic = anthropic_client
        self.claude_model = claude_model

    def initialize_clients(self, supabase_client, notifier=None, anthropic_client=None, claude_model: str = "claude-sonnet-5"):
        self.supabase = supabase_client
        if notifier is not None:
            self.notifier = notifier
        if anthropic_client is not None:
            self.anthropic = anthropic_client
        if claude_model:
            self.claude_model = claude_model

    def _get_finance_and_exec_recipients(self) -> List[str]:
        """Obtiene IDs de Dirección Financiera, Gerencia General (access_level=1) y Master Admin."""
        if not self.supabase:
            return []
        ids: List[str] = []
        try:
            res = (
                self.supabase.table("profiles")
                .select("id, is_master_admin, roles(name, access_level)")
                .execute()
            )
            for row in (res.data or []):
                is_master = bool(row.get("is_master_admin"))
                role_obj = row.get("roles") or {}
                role_name = (role_obj.get("name") or "").lower()
                is_exec = role_obj.get("access_level") == 1
                is_finance = any(
                    kw in role_name
                    for kw in ("financier", "finanzas", "contab", "cfo", "tesorer", "gerencia general")
                )
                if is_master or is_exec or is_finance:
                    ids.append(row["id"])
        except Exception as exc:
            print(f"[PygService] Error buscando destinatarios financieros: {exc}")
        return list(dict.fromkeys(ids))

    def trigger_loss_alerts(self, loss_channels: List[Dict[str, Any]], period_month: str) -> List[Dict[str, Any]]:
        """Dispara notificación automática cuando un canal presenta Margen Neto < 0% o EBITDA < 0."""
        if not loss_channels or not self.notifier:
            return []

        recipients = self._get_finance_and_exec_recipients()
        if not recipients:
            return []

        sent: List[Dict[str, Any]] = []
        for ch in loss_channels:
            msg = (
                f"ALERTA FINANCIERA PyG ({period_month}): El canal {ch['name']} entró en pérdida. "
                f"Margen Neto: {ch['net_margin_pct']}% | EBITDA: ${ch['ebitda']:,.2f} | "
                f"Utilidad Neta: ${ch['net_income']:,.2f}."
            )
            for uid in recipients:
                res = self.notifier.notify_user(
                    profile_id=uid,
                    notif_type="pyg_loss_alert",
                    message=msg,
                    action_url="/pyg",
                    metadata={
                        "period_month": period_month,
                        "channel": ch["name"],
                        "net_margin_pct": ch["net_margin_pct"],
                        "ebitda": ch["ebitda"],
                        "net_income": ch["net_income"],
                    },
                    email_subject=f"Alerta de Pérdida PyG - Canal {ch['name']} ({period_month})",
                )
                if res:
                    sent.append(res)
        return sent

    def compute_report(self, period_month: str, trigger_alerts: bool = False) -> Dict[str, Any]:
        if not self.supabase:
            raise RuntimeError("Supabase client not initialized")

        year = period_month[:4]
        ytd_start = f"{year}-01"

        ch_res = self.supabase.table("sales_channels").select("*").eq("active", True).order("name").execute()
        channels = ch_res.data or DEFAULT_CHANNELS

        entries_res = (
            self.supabase.table("channel_financial_entries")
            .select("*")
            .gte("period_month", ytd_start)
            .lte("period_month", period_month)
            .execute()
        )
        all_entries = entries_res.data or []

        ind_res = (
            self.supabase.table("indirect_expenses")
            .select("*")
            .gte("period_month", ytd_start)
            .lte("period_month", period_month)
            .execute()
        )
        all_indirect = ind_res.data or []

        month_entries = [e for e in all_entries if e.get("period_month") == period_month]
        month_indirect = [i for i in all_indirect if i.get("period_month") == period_month]

        monthly = calculate_pyg_by_channel(channels, month_entries, month_indirect)
        ytd = calculate_pyg_by_channel(channels, all_entries, all_indirect)

        alerts_sent = []
        if trigger_alerts and monthly["loss_channels"]:
            alerts_sent = self.trigger_loss_alerts(monthly["loss_channels"], period_month)

        return {
            "period_month": period_month,
            "ytd_range": f"{ytd_start} a {period_month}",
            "monthly": monthly,
            "ytd": ytd,
            "alerts_triggered": len(alerts_sent),
        }

    def _build_grounded_financial_analysis(self, report: Dict[str, Any]) -> Dict[str, Any]:
        period = report.get("period_month") or "Período actual"
        monthly = report.get("monthly") or {}
        cons = monthly.get("consolidated") or {}
        channels = monthly.get("channels") or []
        loss_channels = monthly.get("loss_channels") or []

        net_rev = cons.get("net_revenue", 0)
        ebitda = cons.get("ebitda", 0)
        net_inc = cons.get("net_income", 0)
        net_margin = cons.get("net_margin_pct", 0)

        exec_summary = (
            f"En el corte {period}, la operación consolidada generó ventas netas de ${net_rev:,.2f}, "
            f"con un EBITDA de ${ebitda:,.2f} (Margen EBITDA: {cons.get('ebitda_margin_pct', 0)}%) "
            f"y una Utilidad Neta de ${net_inc:,.2f} (Margen Neto: {net_margin}%)."
        )

        deviations: List[str] = []
        for ch in channels:
            rev = ch.get("net_revenue", 0)
            cogs_pct = round((ch.get("cogs", 0) / rev) * 100, 1) if rev > 0 else 0
            if ch.get("is_loss"):
                deviations.append(
                    f"ALERTA CRÍTICA — Canal {ch['name']} en pérdida: Margen Neto {ch['net_margin_pct']}% "
                    f"y EBITDA ${ch['ebitda']:,.2f} (Costo de ventas: {cogs_pct}% de las ventas netas, "
                    f"Gastos directos: ${ch['direct_opex']:,.2f}, Prorrateo indirecto: ${ch['allocated_indirect_opex']:,.2f})."
                )
            elif cogs_pct > 65:
                deviations.append(
                    f"Desviación de costo en {ch['name']}: COGS representa {cogs_pct}% de sus ventas netas (Margen Bruto: {ch['gross_margin_pct']}%)."
                )

        if not deviations:
            deviations.append("Todos los canales operan con margen neto y EBITDA positivos en este corte.")

        recommendations: List[str] = []
        for ch in loss_channels:
            recommendations.append(
                f"Revisar estructura de precios, descuentos (${ch['returns_discounts']:,.2f}) y gastos directos "
                f"(${ch['direct_opex']:,.2f}) en {ch['name']} para revertir el margen negativo ({ch['net_margin_pct']}%)."
            )
        if monthly.get("total_indirect_expenses", 0) > 0:
            recommendations.append(
                f"Auditar los gastos indirectos prorrateados (${monthly['total_indirect_expenses']:,.2f} en el período) para optimizar carga fija."
            )
        if not recommendations:
            recommendations.append("Potenciar inversión comercial en el canal con mayor margen neto del período.")

        return {
            "executive_summary": exec_summary,
            "cost_deviations": deviations,
            "recommendations": recommendations,
            "loss_channels_detected": [c["name"] for c in loss_channels],
            "generated_by": "deterministic-financial-analyzer",
        }

    def analyze_costs_with_ai(self, report: Dict[str, Any]) -> Dict[str, Any]:
        if self.anthropic:
            prompt = (
                "Eres Director Financiero (CFO) analizando un PyG por canal de venta en Nova Work. "
                "Analiza EXCLUSIVAMENTE el JSON adjunto y responde en JSON válido con las claves: "
                "executive_summary (string), cost_deviations (array de strings), "
                "recommendations (array de strings), loss_channels_detected (array de strings). "
                "Cita las cifras exactas de ingresos, costos, EBITDA y margen neto.\n\n"
                f"PYG REPORT:\n{json.dumps(report, ensure_ascii=False)}"
            )
            try:
                response = self.anthropic.messages.create(
                    model=self.claude_model,
                    max_tokens=900,
                    system="Responde únicamente con JSON válido sin bloques markdown.",
                    messages=[{"role": "user", "content": prompt}],
                )
                raw = response.content[0].text.strip()
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                parsed = json.loads(raw.strip())
                if isinstance(parsed, dict) and "executive_summary" in parsed:
                    parsed["generated_by"] = f"claude:{self.claude_model}"
                    return parsed
            except Exception as exc:
                print(f"[PygService] Fallback financiero determinista: {exc}")

        return self._build_grounded_financial_analysis(report)


pyg_service = PygService()


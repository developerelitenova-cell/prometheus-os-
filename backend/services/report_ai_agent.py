"""
Agente de IA para Informes de Rendimiento (Req. 2.5):
Recibe el payload JSON estructurado de KPIs y cumplimiento del informe consultado
y genera un resumen ejecutivo, hallazgos, cuellos de botella y recomendaciones accionables
estrictamente basadas en los datos reales del reporte.
"""

import json
from typing import Any, Dict, List, Optional


class ReportAIAgent:
    """Agente analítico para reportes de KPI con respaldo determinista basado en datos."""

    def __init__(self, anthropic_client=None, claude_model: str = "claude-sonnet-5"):
        self.anthropic = anthropic_client
        self.claude_model = claude_model

    def initialize_clients(self, anthropic_client, claude_model: str = "claude-sonnet-5"):
        self.anthropic = anthropic_client
        self.claude_model = claude_model

    def _build_grounded_analysis(self, report: Dict[str, Any]) -> Dict[str, Any]:
        period = report.get("period") or {}
        summary = report.get("summary") or {}
        kpis = report.get("kpis") or []
        by_user = report.get("by_user") or []
        bottlenecks_raw = report.get("bottlenecks") or []

        total = summary.get("total_scheduled", 0)
        completed = summary.get("completed", 0)
        overdue = summary.get("overdue", 0)
        na_excluded = summary.get("na_excluded", 0)

        kpi_by_key = {k.get("key"): k for k in kpis if k.get("key")}
        comp_kpi = kpi_by_key.get("compliance_rate") or {}
        ontime_kpi = kpi_by_key.get("on_time_rate") or {}
        overdue_kpi = kpi_by_key.get("overdue_rate") or {}

        comp_val = comp_kpi.get("value")
        ontime_val = ontime_kpi.get("value")
        overdue_val = overdue_kpi.get("value")

        period_label = period.get("label") or "Período actual"

        if total == 0 or comp_val is None:
            return {
                "executive_summary": (
                    f"En {period_label} no se registraron actividades aplicables para evaluar "
                    f"(actividades excluidas N/A: {na_excluded}). Los KPIs figuran como N/A sin penalización."
                ),
                "key_findings": [
                    f"Total programadas aplicables: 0 (excluidas N/A: {na_excluded}).",
                    "Todos los indicadores del catálogo permanecen en estado N/A.",
                ],
                "bottlenecks": [],
                "recommendations": [
                    "Verificar la asignación de actividades operativas en el período para habilitar medición."
                ],
                "generated_by": "deterministic-grounded-analyzer",
            }

        exec_summary = (
            f"Durante {period_label}, el equipo registró {completed} actividades completadas de "
            f"{total} programadas aplicables (Tasa de Cumplimiento: {comp_val}% frente a meta >= "
            f"{comp_kpi.get('target', 85)}%). La puntualidad alcanzó {ontime_val}% (meta >= "
            f"{ontime_kpi.get('target', 80)}%) y la tasa de vencidas se ubicó en {overdue_val}% "
            f"({overdue} pendientes vencidas; meta <= {overdue_kpi.get('target', 10)}%)."
        )

        findings: List[str] = [
            f"Tasa de Cumplimiento: {comp_val}% ({'Cumple meta' if comp_kpi.get('status') == 'pass' else 'Por debajo de meta'} >= {comp_kpi.get('target', 85)}%).",
            f"Puntualidad: {ontime_val}% ({'Cumple meta' if ontime_kpi.get('status') == 'pass' else 'Por debajo de meta'} >= {ontime_kpi.get('target', 80)}%).",
            f"Tasa de Vencidas: {overdue_val}% con {overdue} actividades vencidas ({'Dentro de meta' if overdue_kpi.get('status') == 'pass' else 'Supera límite'} <= {overdue_kpi.get('target', 10)}%).",
        ]
        if na_excluded > 0:
            findings.append(f"Se excluyeron {na_excluded} actividades N/A del denominador sin penalizar el resultado.")

        bottleneck_notes: List[str] = []
        for b in bottlenecks_raw[:5]:
            bottleneck_notes.append(
                f"Actividad vencida: \"{b.get('title')}\" (Responsable: {b.get('assignee_name')}, vencimiento: {b.get('due_date')})."
            )
        low_performers = [
            u for u in by_user
            if u.get("compliance_rate") is not None and u["compliance_rate"] < (comp_kpi.get("target") or 85)
        ]
        for u in low_performers[:3]:
            bottleneck_notes.append(
                f"{u.get('full_name')} presenta cumplimiento de {u.get('compliance_rate')}% ({u.get('summary', {}).get('overdue', 0)} vencidas)."
            )

        recommendations: List[str] = []
        if comp_kpi.get("status") == "fail":
            recommendations.append(
                f"Priorizar el cierre de las {total - completed} actividades pendientes para elevar el cumplimiento de {comp_val}% hacia la meta de {comp_kpi.get('target', 85)}%."
            )
        if ontime_kpi.get("status") == "fail":
            recommendations.append(
                f"Revisar carga y ventanas de entrega: la puntualidad actual ({ontime_val}%) está por debajo del {ontime_kpi.get('target', 80)}%."
            )
        if overdue > 0:
            recommendations.append(
                f"Realizar seguimiento inmediato sobre las {overdue} actividades vencidas detectadas en los cuellos de botella."
            )
        if not recommendations:
            recommendations.append(
                "Mantener el ritmo operativo actual y documentar buenas prácticas del período."
            )

        return {
            "executive_summary": exec_summary,
            "key_findings": findings,
            "bottlenecks": bottleneck_notes,
            "recommendations": recommendations,
            "generated_by": "deterministic-grounded-analyzer",
        }

    def analyze_report(self, report_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Genera análisis estructurado usando Claude si está disponible; si no, usa el analizador
        determinista basado estrictamente en los datos del reporte.
        """
        if self.anthropic:
            prompt = (
                "Eres un Agente Analista de Rendimiento Corporativo para Nova Work. "
                "Analiza EXCLUSIVAMENTE el siguiente JSON de KPIs y cumplimiento. "
                "Responde únicamente en JSON válido con las claves exactas: "
                "executive_summary (string), key_findings (array de strings), "
                "bottlenecks (array de strings), recommendations (array de strings). "
                "Cita explícitamente las cifras, porcentajes, metas y nombres reales presentes en el JSON.\n\n"
                f"DATOS DEL REPORTE:\n{json.dumps(report_payload, ensure_ascii=False)}"
            )
            try:
                response = self.anthropic.messages.create(
                    model=self.claude_model,
                    max_tokens=900,
                    system="Responde únicamente con JSON válido sin bloques markdown.",
                    messages=[{"role": "user", "content": prompt}],
                )
                raw_text = response.content[0].text.strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                parsed = json.loads(raw_text.strip())
                if isinstance(parsed, dict) and "executive_summary" in parsed:
                    parsed["generated_by"] = f"claude:{self.claude_model}"
                    return parsed
            except Exception as exc:
                print(f"[ReportAIAgent] Fallback determinista por error de LLM: {exc}")

        return self._build_grounded_analysis(report_payload)


report_ai_agent = ReportAIAgent()


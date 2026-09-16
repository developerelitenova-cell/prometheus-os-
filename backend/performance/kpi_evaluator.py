from typing import Dict, List
import datetime

class KPIEvaluator:
    def __init__(self):
        self.evaluations = []
        self.supabase = None
        self.anthropic = None
        self.claude_model = None

    def initialize_clients(self, supabase_client, anthropic_client, claude_model):
        self.supabase = supabase_client
        self.anthropic = anthropic_client
        self.claude_model = claude_model

    def evaluate_role(self, role_id: str, completed_tasks: List[Dict], kpis_esperados: List[Dict], user_id: str = None) -> Dict:
        """
        Computa el rendimiento del rol y usa a Claude para generar una alerta proactiva
        si el rendimiento es bajo o crítico.
        """
        total_tasks = len(completed_tasks)
        if total_tasks == 0:
            score = 0
        else:
            score = min(100, total_tasks * 10) # Sistema dummy actual
            
        evaluation = {
            "role_id": role_id,
            "user_id": user_id,
            "score_global": score,
            "kpi_details": [
                {"name": kpi["name"], "achieved": score, "target": kpi["target"], "status": "pass" if score >= kpi["target"] else "fail"}
                for kpi in kpis_esperados
            ]
        }
        self.evaluations.append(evaluation)
        
        # --- Lógica de Alertas Proactivas con Claude (Hermes Agent flow) ---
        if self.anthropic and self.supabase and score < 70:
            self._trigger_proactive_alert(evaluation)
            
        return evaluation

    def _trigger_proactive_alert(self, evaluation: Dict):
        """
        Claude evalúa la situación y genera un reporte en la tabla system_alerts.
        """
        prompt = f"""
        Eres un agente auditor proactivo. Se ha detectado un bajo rendimiento en un empleado.
        Datos:
        - Score Global: {evaluation['score_global']}/100
        - Detalles: {evaluation['kpi_details']}
        
        Redacta una alerta gerencial breve (1-2 párrafos) indicando el problema y recomendando una acción. 
        No uses saludos ni despedidas, ve al grano.
        """
        
        try:
            response = self.anthropic.messages.create(
                model=self.claude_model,
                max_tokens=300,
                system="Eres un auditor de métricas. Responde únicamente con el mensaje de alerta.",
                messages=[{"role": "user", "content": prompt}]
            )
            alert_message = response.content[0].text
            
            # Guardar en system_alerts (para que lo vea el CEO/Líder)
            alert_payload = {
                "title": f"Alerta de Rendimiento: Score {evaluation['score_global']}",
                "message": alert_message,
                "severity": "critical" if evaluation['score_global'] < 50 else "warning",
                # target_user_id = None significa alerta global para liderazgo
            }
            if "user_id" in evaluation and evaluation["user_id"]:
                alert_payload["message"] += f"\nEmpleado ID: {evaluation['user_id']}"
                
            self.supabase.table("system_alerts").insert(alert_payload).execute()
            print(f"[Agente Auditor] Alerta generada y guardada en base de datos.")
            
        except Exception as e:
            print(f"Error generando alerta proactiva: {e}")

kpi_evaluator = KPIEvaluator()

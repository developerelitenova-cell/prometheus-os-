from typing import Dict, List

class KPIEvaluator:
    def __init__(self):
        # Base de evaluaciones
        self.evaluations = []

    def evaluate_role(self, role_id: str, completed_tasks: List[Dict], kpis_esperados: List[Dict]) -> Dict:
        """
        Computa el rendimiento del rol basado en las tareas completadas y los OKRs definidos en el manual de cargo.
        """
        # Placeholder de lógica avanzada: En producción esto cruzará la metadata semántica de la tarea
        # con los objetivos del cargo mediante IA.
        
        total_tasks = len(completed_tasks)
        if total_tasks == 0:
            score = 0
        else:
            score = min(100, total_tasks * 10) # Sistema dummy: cada tarea completada suma 10%
            
        evaluation = {
            "role_id": role_id,
            "score_global": score,
            "kpi_details": [
                {"name": kpi["name"], "achieved": score, "target": kpi["target"], "status": "pass" if score >= kpi["target"] else "fail"}
                for kpi in kpis_esperados
            ]
        }
        self.evaluations.append(evaluation)
        return evaluation

kpi_evaluator = KPIEvaluator()

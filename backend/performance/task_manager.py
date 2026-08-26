from typing import List, Dict
from datetime import datetime

class TaskManager:
    def __init__(self):
        self.tasks_db = []

    def create_task(self, role_id: str, title: str, description: str, estimated_hours: float) -> Dict:
        task = {
            "id": f"task_{len(self.tasks_db) + 1}",
            "role_id": role_id,
            "title": title,
            "description": description,
            "estimated_hours": estimated_hours,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        self.tasks_db.append(task)
        return task

    def update_task_status(self, task_id: str, status: str) -> Dict:
        for task in self.tasks_db:
            if task["id"] == task_id:
                task["status"] = status
                return task
        return {"error": "Task not found"}

    def get_tasks_by_role(self, role_id: str) -> List[Dict]:
        return [task for task in self.tasks_db if task["role_id"] == role_id]

task_manager = TaskManager()

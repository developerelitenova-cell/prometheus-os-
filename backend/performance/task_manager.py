from typing import List, Dict, Optional
from datetime import datetime

class TaskManager:
    def __init__(self):
        self.supabase = None

    def initialize_clients(self, supabase_client):
        self.supabase = supabase_client

    def create_task(
        self,
        role_id: Optional[str],
        title: str,
        description: Optional[str],
        estimated_hours: Optional[float] = None,
        assigned_to: Optional[str] = None,
        due_date: Optional[str] = None,
        due_time: Optional[str] = None,
        priority: str = "medium",
        task_type: str = "once",
    ) -> Dict:
        if not self.supabase:
            raise Exception("Supabase client not initialized")

        task: Dict = {
            "title": title,
            "description": description,
            "status": "pending",
        }
        if role_id is not None:
            task["role_id"] = role_id
        if estimated_hours is not None:
            task["estimated_hours"] = estimated_hours
        if assigned_to is not None:
            task["assigned_to"] = assigned_to
        if due_date is not None:
            task["due_date"] = due_date
        if due_time is not None:
            task["due_time"] = due_time
        if assigned_to or due_date:
            task["priority"] = priority
            task["task_type"] = task_type

        res = self.supabase.table("tasks").insert(task).execute()
        if not res.data:
            raise Exception("Failed to insert task")
        return res.data[0]

    def update_task_status(self, task_id: str, status: str) -> Dict:
        if not self.supabase:
            raise Exception("Supabase client not initialized")
            
        res = self.supabase.table("tasks").update({"status": status}).eq("id", task_id).execute()
        if not res.data:
            return {"error": "Task not found or update failed"}
        return res.data[0]

    def get_tasks_by_role(self, role_id: str) -> List[Dict]:
        if not self.supabase:
            raise Exception("Supabase client not initialized")
            
        res = self.supabase.table("tasks").select("*").eq("role_id", role_id).execute()
        return res.data if res.data else []

task_manager = TaskManager()

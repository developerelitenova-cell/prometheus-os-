from typing import List, Dict, Optional
from datetime import datetime

class TaskManager:
    def __init__(self):
        self.supabase = None

    def initialize_clients(self, supabase_client):
        self.supabase = supabase_client

    def create_task(self, role_id: str, title: str, description: str, estimated_hours: float) -> Dict:
        if not self.supabase:
            raise Exception("Supabase client not initialized")
        
        task = {
            "role_id": role_id,
            "title": title,
            "description": description,
            "estimated_hours": estimated_hours,
            "status": "pending"
        }
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

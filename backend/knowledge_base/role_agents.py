from typing import Dict, Any, List
import json

class RoleAgent:
    def __init__(self, agent_config: Dict, supabase_client=None, anthropic_client=None, claude_model="claude-3-5-sonnet-20240620"):
        self.role_id = agent_config.get("role")
        self.access_level = agent_config.get("access_level")
        self.area = agent_config.get("area")
        self.name = agent_config.get("name")
        self.user_id = agent_config.get("user_id") # Empleado específico
        self.supabase = supabase_client
        self.anthropic = anthropic_client
        self.claude_model = claude_model
        
        self.system_prompt = "Eres el Oráculo, un asistente de IA para NOVA WORK."
        self.context = []

    def load_context(self):
        """
        Carga la personalidad (System Prompt) y la memoria del usuario desde Supabase.
        """
        if not self.supabase:
            return

        try:
            # 1. Cargar Personalidad del Rol
            # Obtenemos el nombre del rol usando el role_id
            role_res = self.supabase.table("roles").select("name").eq("id", self.role_id).single().execute()
            if role_res.data:
                role_name = role_res.data["name"]
                
                # Buscar el system prompt para este rol
                prompt_res = self.supabase.table("ai_system_prompts").select("prompt_text").eq("role_name", role_name).execute()
                if prompt_res.data and len(prompt_res.data) > 0:
                    self.system_prompt = prompt_res.data[0]["prompt_text"]
                else:
                    self.system_prompt = f"Eres un asistente de IA experto en {role_name}. Tu objetivo es ayudar al usuario en sus funciones."

            # 2. Cargar Memoria del Usuario
            if self.user_id:
                mem_res = self.supabase.table("ai_user_memory").select("memory_key, memory_value").eq("employee_id", self.user_id).execute()
                if mem_res.data:
                    memory_strings = [f"- {m['memory_key']}: {m['memory_value']}" for m in mem_res.data]
                    self.context.extend(memory_strings)
                    
        except Exception as e:
            print(f"Error cargando contexto del agente: {e}")

    def chat(self, query: str, conversation_history: List[Dict] = None) -> str:
        """
        Responde a la consulta usando Claude API, inyectando el system prompt y la memoria.
        """
        if not self.anthropic:
            return f"[Simulación Chatbot {self.name}]: {query} (API de Claude no configurada)"

        if conversation_history is None:
            conversation_history = []

        # Construir el prompt de sistema final
        final_system_prompt = self.system_prompt
        if self.context:
            final_system_prompt += "\n\nMemoria del usuario:\n" + "\n".join(self.context)

        messages = conversation_history + [{"role": "user", "content": query}]

        try:
            response = self.anthropic.messages.create(
                model=self.claude_model,
                max_tokens=1024,
                system=final_system_prompt,
                messages=messages
            )
            return response.content[0].text
        except Exception as e:
            return f"Error al comunicar con Claude: {str(e)}"

class AgentOrchestrator:
    def __init__(self):
        self.active_agents = {}
        self.supabase = None
        self.anthropic = None
        self.claude_model = None

    def initialize_clients(self, supabase_client, anthropic_client, claude_model):
        self.supabase = supabase_client
        self.anthropic = anthropic_client
        self.claude_model = claude_model

    def spawn_agent(self, agent_config: Dict) -> RoleAgent:
        # Usamos user_id como clave única para el agente, para que cada usuario tenga su contexto
        user_id = agent_config.get("user_id")
        role_id = agent_config.get("role")
        agent_key = f"{user_id}_{role_id}"

        if agent_key not in self.active_agents:
            agent = RoleAgent(agent_config, self.supabase, self.anthropic, self.claude_model)
            agent.load_context()
            self.active_agents[agent_key] = agent
            
        return self.active_agents[agent_key]

orchestrator = AgentOrchestrator()

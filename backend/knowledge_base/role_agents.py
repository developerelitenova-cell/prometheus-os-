from typing import Dict

class RoleAgent:
    def __init__(self, agent_config: Dict):
        self.role_id = agent_config.get("role")
        self.access_level = agent_config.get("access_level")
        self.area = agent_config.get("area")
        self.name = agent_config.get("name")
        self.context = [] # Documentos de Google Drive ingestados

    def load_context(self, knowledge_graph):
        """
        Filtra el GraphRAG para cargar ÚNICAMENTE los documentos y procesos
        permitidos por el Nivel de Acceso (1, 2 o 3) y el Área.
        """
        # Placeholder de lógica RBAC
        print(f"Cargando contexto para {self.name} ({self.role_id}) - Área: {self.area} - Nivel: {self.access_level}")
        self.context = ["doc_manual_cargo_base", "plantilla_operativa"]

    def chat(self, query: str) -> str:
        """
        Responde a la consulta en lenguaje natural utilizando exclusivamente
        la información cargada en self.context.
        """
        return f"[Chatbot de {self.role_id}]: Basado en mi contexto, esta es la respuesta para: {query}"

class AgentOrchestrator:
    def __init__(self):
        self.active_agents = {}

    def spawn_agent(self, agent_config: Dict) -> RoleAgent:
        role = agent_config["role"]
        agent = RoleAgent(agent_config)
        self.active_agents[role] = agent
        return agent

orchestrator = AgentOrchestrator()

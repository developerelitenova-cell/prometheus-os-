import csv
import json

def parse_roles(tsv_file: str, output_file: str):
    """
    Parsea la matriz de roles, asigna el RBAC (Niveles 1,2,3) y 
    prepara el esquema de KPIs y procesos compartidos.
    """
    agents = []
    try:
        with open(tsv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            for row in reader:
                if len(row) >= 5:
                    company, name, role, area, level = row[:5]
                    
                    # Generación de KPIs base (Placeholder)
                    kpis = [
                        {"name": "Cumplimiento de Tareas Diarias", "target": 95, "unit": "%"},
                        {"name": "Eficiencia Operativa", "target": 90, "unit": "%"}
                    ]
                    
                    agent = {
                        "company": company.strip(),
                        "name": name.strip() if name.strip() != 'NA' else f"Vacante ({role})",
                        "role": role.strip(),
                        "area": area.strip(),
                        "access_level": int(level.strip()),
                        "kpis_esperados": kpis,
                        "procesos_asignados": []
                    }
                    agents.append(agent)
                    
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(agents, f, indent=4, ensure_ascii=False)
            
        print(f"[{len(agents)} cargos parseados] Estructura guardada en {output_file}")
    except Exception as e:
        print(f"Error parseando {tsv_file}: {e}")

if __name__ == "__main__":
    source = "../data/roles_raw.tsv"
    output = "../backend/agents_config.json"
    parse_roles(source, output)

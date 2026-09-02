import os
import subprocess
import sys

def main():
    print("Iniciando proceso de Actualización de Despliegue...")
    
    # 1. Rutas
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(base_dir, 'frontend')
    
    if not os.path.exists(frontend_dir):
        print(f"Error: No se encontró el directorio {frontend_dir}")
        sys.exit(1)
        
    os.chdir(frontend_dir)
    print(f"Directorio de trabajo: {frontend_dir}")
    
    # 2. Despliegue a Vercel
    print("Ejecutando 'vercel --prod'...")
    try:
        # En Windows a menudo es necesario shell=True para invocar comandos de npm/pnpm/vercel globales
        result = subprocess.run(
            ['vercel', '--prod'],
            check=True,
            capture_output=True,
            text=True,
            shell=True
        )
        print("=== Despliegue exitoso ===")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("=== Error en el Despliegue ===")
        print(f"Código de error: {e.returncode}")
        print("Salida de error:")
        print(e.stderr)
        # Si stderr está vacío, a veces Vercel imprime los errores en stdout
        if e.stdout:
            print("Salida estándar:")
            print(e.stdout)
        sys.exit(1)

if __name__ == "__main__":
    main()

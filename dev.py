import subprocess
import os
import signal
import sys

def kill_port(port):
    """Kills processes listening on the given port (macOS/Linux compatible)."""
    try:
        subprocess.run(f"lsof -t -i:{port} | xargs kill -9 2>/dev/null", shell=True)
    except Exception:
        pass

def main():
    print("Starting AutoAgent Development Environment...")
    
    # Terminate existing processes on standard ports
    print("Cleaning up old processes on ports 5173 and 8000...")
    kill_port(5173)
    kill_port(8000)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.join(base_dir, "server")
    app_dir = os.path.join(base_dir, "app")
    
    # Start Backend
    print("Starting Backend Server...")
    backend_cmd = "source venv/bin/activate && uvicorn main:app --reload"
    backend_process = subprocess.Popen(
        backend_cmd,
        cwd=server_dir,
        shell=True,
        executable="/bin/bash",
        preexec_fn=os.setsid  # Create a new process group
    )
    
    # Start Frontend
    print("Starting Frontend Server...")
    frontend_cmd = "source ~/.zshrc && npm run dev"
    frontend_process = subprocess.Popen(
        frontend_cmd,
        cwd=app_dir,
        shell=True,
        executable="/bin/bash",
        preexec_fn=os.setsid  # Create a new process group
    )
    
    print("\n" + "="*50)
    print("🚀 AutoAgent is running!")
    print("-> Frontend is available at: http://localhost:5173")
    print("-> Backend API is running at: http://127.0.0.1:8000")
    print("="*50 + "\n")
    print("Press Ctrl+C to stop both servers.\n")
    
    def cleanup(signum, frame):
        print("\nShutting down development servers...")
        try:
            os.killpg(os.getpgid(frontend_process.pid), signal.SIGTERM)
        except Exception:
            pass
        try:
            os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)
        except Exception:
            pass
        sys.exit(0)
        
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    try:
        backend_process.wait()
        frontend_process.wait()
    except Exception as e:
        cleanup(None, None)

if __name__ == "__main__":
    main()

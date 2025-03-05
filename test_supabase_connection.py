import socket
import sys
import os
import subprocess
import time

def check_port_open(host, port):
    """Check if a port is open on a given host."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)  # 2 second timeout
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

def check_process_running(process_name):
    """Check if a process is running by name."""
    try:
        if os.name == 'nt':  # Windows
            output = subprocess.check_output(['tasklist', '/FI', f'IMAGENAME eq {process_name}'], 
                                            stderr=subprocess.STDOUT, 
                                            universal_newlines=True)
            return process_name.lower() in output.lower()
        else:  # Unix/Linux/Mac
            output = subprocess.check_output(['ps', '-A'], 
                                            stderr=subprocess.STDOUT, 
                                            universal_newlines=True)
            return process_name.lower() in output.lower()
    except subprocess.CalledProcessError:
        return False

def main():
    """Main function to check Supabase connection."""
    host = "127.0.0.1"
    db_port = 54322  # Default PostgreSQL port for Supabase
    api_port = 54321  # Default API port for Supabase
    
    print(f"Checking Supabase connection at {host}:{db_port}...")
    
    # Check if Python processes are running
    python_running = check_process_running("python.exe") or check_process_running("python")
    if python_running:
        print("✅ Python processes are running")
    else:
        print("❌ No Python processes detected")
    
    # Check if the MCP server might be running
    mcp_running = False
    try:
        with open(os.path.expandvars("%APPDATA%\\supabase-mcp\\.env"), "r") as f:
            mcp_running = True
            print("✅ MCP server configuration found")
            print("\nMCP Configuration:")
            for line in f:
                if "PASSWORD" not in line.upper():  # Don't print passwords
                    print(f"  {line.strip()}")
    except FileNotFoundError:
        print("❌ MCP server configuration not found")
    
    # Check if the database port is open
    db_open = check_port_open(host, db_port)
    if db_open:
        print(f"✅ Successfully connected to Supabase database at {host}:{db_port}")
    else:
        print(f"❌ Could not connect to Supabase database at {host}:{db_port}")
    
    # Check if the API port is open
    api_open = check_port_open(host, api_port)
    if api_open:
        print(f"✅ Successfully connected to Supabase API at {host}:{api_port}")
    else:
        print(f"❌ Could not connect to Supabase API at {host}:{api_port}")
    
    # Overall status
    if not (db_open or api_open):
        print("\n❌ Supabase does not appear to be running locally")
        print("\nPossible reasons:")
        print("1. Supabase is not running locally")
        print("2. Supabase is running on different ports")
        print("3. There's a firewall blocking the connection")
        
        print("\nTroubleshooting steps:")
        print("1. Make sure Supabase is installed and running")
        print("2. Try starting the MCP server using: start_supabase_mcp.bat")
        print("3. Check if the MCP server window is still open")
        print("4. If using Supabase CLI, try: supabase start")
    else:
        print("\n✅ Supabase appears to be running")

if __name__ == "__main__":
    main() 
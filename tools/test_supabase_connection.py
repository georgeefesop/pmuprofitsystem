import os
import socket
import subprocess
import sys
import time

def check_port_open(host, port):
    """Check if a port is open on a host."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

def check_process_running(process_name):
    """Check if a process is running."""
    try:
        # Windows
        if sys.platform == 'win32':
            output = subprocess.check_output(['tasklist', '/fi', f'imagename eq {process_name}'], text=True)
            return process_name.lower() in output.lower()
        # Linux/Mac
        else:
            output = subprocess.check_output(['ps', 'aux'], text=True)
            return process_name.lower() in output.lower()
    except subprocess.SubprocessError:
        return False

def main():
    """Main function to test Supabase connection."""
    print("\n===== Supabase Connection Test =====\n")
    
    # Check if the database port is open
    db_host = "localhost"
    db_port = 54322  # Default Supabase PostgreSQL port
    
    print(f"Checking if PostgreSQL is running on {db_host}:{db_port}...")
    if check_port_open(db_host, db_port):
        print(f"✅ PostgreSQL port {db_port} is open")
    else:
        print(f"❌ PostgreSQL port {db_port} is not open")
    
    # Check if the API port is open
    api_host = "localhost"
    api_port = 54321  # Default Supabase API port
    
    print(f"\nChecking if Supabase API is running on {api_host}:{api_port}...")
    if check_port_open(api_host, api_port):
        print(f"✅ Supabase API port {api_port} is open")
    else:
        print(f"❌ Supabase API port {api_port} is not open")
    
    # Check if the Supabase process is running
    print("\nChecking if Supabase processes are running...")
    if check_process_running("supabase"):
        print("✅ Supabase process is running")
    else:
        print("❌ Supabase process is not running")
    
    # Print summary
    print("\n===== Connection Test Summary =====")
    if check_port_open(db_host, db_port) and check_port_open(api_host, api_port):
        print("✅ Supabase connection test passed!")
    else:
        print("❌ Supabase connection test failed!")
        print("\nTroubleshooting tips:")
        print("1. Make sure Supabase is running locally with 'supabase start'")
        print("2. Check your Supabase project configuration")
        print("3. Verify your environment variables are set correctly")
    
    print("\n===================================")

if __name__ == "__main__":
    main() 
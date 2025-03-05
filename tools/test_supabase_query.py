import requests
import json
import sys
import socket
import time
import traceback
from dotenv import load_dotenv
import os

# Load environment variables from .env.local file
load_dotenv('.env.local')

# HTTP Server configuration
SERVER_HOST = "localhost"
SERVER_PORT = 8000

def check_port_open(host, port):
    """Check if a port is open on the given host"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

def execute_sql_query(query, read_only=True):
    """
    Execute a SQL query on Supabase through the HTTP server
    """
    try:
        # Endpoint for executing SQL queries
        endpoint = f"http://{SERVER_HOST}:{SERVER_PORT}/execute_sql_query"
        
        # Prepare the payload
        payload = {
            "query": query,
            "read_only": read_only  # Set to False if you need to modify data
        }
        
        print(f"Sending query to {endpoint}...")
        print(f"Query: {query}")
        
        # Send the request
        response = requests.post(endpoint, json=payload, timeout=10)
        
        # Check if the request was successful
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        traceback.print_exc()
        return None

def get_connection_info():
    """Get connection information from the HTTP server"""
    try:
        endpoint = f"http://{SERVER_HOST}:{SERVER_PORT}/connection_info"
        print(f"Getting connection info from {endpoint}...")
        
        response = requests.get(endpoint, timeout=5)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error getting connection info: {str(e)}")
        traceback.print_exc()
        return None

def check_server_health():
    """Check if the server is healthy"""
    try:
        endpoint = f"http://{SERVER_HOST}:{SERVER_PORT}/health"
        print(f"Checking server health at {endpoint}...")
        
        response = requests.get(endpoint, timeout=5)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error checking server health: {str(e)}")
        traceback.print_exc()
        return None

def main():
    # Check if the HTTP server is running
    print(f"Checking if HTTP server is running on {SERVER_HOST}:{SERVER_PORT}...")
    
    if not check_port_open(SERVER_HOST, SERVER_PORT):
        print(f"HTTP server is not running on {SERVER_HOST}:{SERVER_PORT}")
        print("Please start the HTTP server using start_supabase_http_server.bat")
        return
    
    print(f"HTTP server is running on {SERVER_HOST}:{SERVER_PORT}")
    
    # Check server health
    print("\nChecking server health...")
    health = check_server_health()
    
    if health:
        print(f"Server health: {health}")
    
    # Get connection info
    print("\nGetting connection info...")
    connection_info = get_connection_info()
    
    if connection_info:
        print("\nConnection Information:")
        print("======================")
        for key, value in connection_info.items():
            print(f"{key}: {value}")
    
    # Simple query to list all tables in the public schema
    query = """
    SELECT 
        table_name, 
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
    FROM 
        information_schema.tables
    WHERE 
        table_schema = 'public'
    ORDER BY 
        pg_total_relation_size(quote_ident(table_name)) DESC;
    """
    
    print("\nExecuting query to list all tables in the public schema...")
    result = execute_sql_query(query)
    
    if result:
        # Check if we have an error
        if "error" in result:
            print(f"\nError: {result['error']}")
            return
        
        print("\nQuery Results:")
        print("==============")
        
        # Check if we have rows in the result
        if "rows" in result and result["rows"]:
            # Print column headers
            if "columns" in result:
                headers = result["columns"]
                header_str = " | ".join(headers)
                print(header_str)
                print("-" * len(header_str))
            
            # Print rows
            for row in result["rows"]:
                row_values = [str(row.get(col, "")) for col in result["columns"]]
                print(" | ".join(row_values))
        else:
            print("No tables found in the public schema.")
    else:
        print("Failed to execute query.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error in main: {str(e)}")
        traceback.print_exc() 
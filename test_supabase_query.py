import sys
import os
import requests
import json

def execute_sql_query(query):
    """Execute a SQL query using the MCP server."""
    try:
        # MCP server is typically running on localhost:8000
        url = "http://localhost:8000/execute_sql_query"
        
        # Prepare the request payload
        payload = {
            "query": query,
            "read_only": True  # Set to False if you need to modify data
        }
        
        # Send the request to the MCP server
        response = requests.post(url, json=payload)
        
        # Check if the request was successful
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return None

def main():
    # Simple query to list all tables in the public schema
    query = """
    SELECT 
        table_name, 
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
    FROM 
        information_schema.tables t
    WHERE 
        table_schema = 'public'
    ORDER BY 
        table_name;
    """
    
    print("Executing query to list tables in the public schema...")
    result = execute_sql_query(query)
    
    if result and 'data' in result:
        print("\nTables in the public schema:")
        print("============================")
        
        if len(result['data']) == 0:
            print("No tables found in the public schema.")
        else:
            # Print table headers
            print(f"{'Table Name':<30} {'Column Count':<15}")
            print(f"{'-' * 30} {'-' * 15}")
            
            # Print each table
            for table in result['data']:
                print(f"{table['table_name']:<30} {table['column_count']:<15}")
    else:
        print("Failed to execute query or no results returned.")
        print("Make sure the MCP server is running.")

if __name__ == "__main__":
    main() 
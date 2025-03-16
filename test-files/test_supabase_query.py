import sys
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

def execute_sql_query(query):
    """Execute a SQL query using direct PostgreSQL connection."""
    try:
        # Default Supabase PostgreSQL connection parameters
        conn_params = {
            "host": "localhost",
            "port": 54322,
            "database": "postgres",
            "user": "postgres",
            "password": "postgres"
        }
        
        # Connect to the database
        conn = psycopg2.connect(**conn_params)
        
        # Create a cursor with dictionary-like results
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Execute the query
            cursor.execute(query)
            
            # Fetch all results
            results = cursor.fetchall()
            
            # Convert to list of dictionaries
            data = [dict(row) for row in results]
            
            # Close the connection
            conn.close()
            
            return {"data": data, "success": True}
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return {"data": [], "success": False, "error": str(e)}

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
    
    if result and result["success"] and 'data' in result:
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
        print("Make sure Supabase is running locally.")

if __name__ == "__main__":
    main() 
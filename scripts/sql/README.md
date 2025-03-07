# SQL Scripts

This directory contains SQL scripts for setting up and managing the database schema for the PMU Profit System.

## SQL Files

- `setup-database-schema.sql` - The main SQL script for setting up the database schema. This script creates all necessary tables, relationships, and initial data for the application.
- `sql-commands.sql` - SQL commands for database setup, extracted from the setup-database-schema.sql file.
- `sql-commands-for-manual-execution.sql` - SQL commands formatted for manual execution in the Supabase SQL editor.
- `sql-commands-with-if-not-exists.sql` - SQL commands with IF NOT EXISTS conditions to avoid errors when objects already exist.

## Usage

### Setting Up the Database Schema

The SQL scripts in this directory are used by the database setup scripts in the `../database` directory. You can also execute them manually in the Supabase SQL editor.

To set up the database schema using the setup script, run:

```bash
node scripts/database/setup-database.js
```

or use the npm script:

```bash
npm run setup-db
```

### Manual Execution

If you prefer to execute the SQL commands manually in the Supabase SQL editor, you can use the `sql-commands-for-manual-execution.sql` file. This file contains the SQL commands formatted for manual execution.

### Avoiding Errors with IF NOT EXISTS

If you're running the SQL commands on a database that might already have some of the objects created, you can use the `sql-commands-with-if-not-exists.sql` file. This file contains the SQL commands with IF NOT EXISTS conditions to avoid errors when objects already exist.

To execute the SQL commands with IF NOT EXISTS conditions, run:

```bash
node scripts/database/execute-sql-with-if-not-exists.js
```

or use the npm script:

```bash
npm run execute-sql-with-if-not-exists
``` 
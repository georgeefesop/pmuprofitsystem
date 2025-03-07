# Database Scripts

This directory contains scripts for managing the database schema and data for the PMU Profit System.

## Setup Scripts

- `setup-database.js` - Sets up the database schema using the SQL commands in `../sql/setup-database-schema.sql`.
- `setup-database-new.js` - An updated version of the setup script with improved error handling and logging.

## Verification Scripts

- `verify-database.js` - Verifies that the database is properly set up by checking for the existence of required tables.
- `verify-database-schema.js` - Verifies the database schema by checking for the existence of required tables, columns, and relationships.

## SQL Execution Scripts

- `execute-sql.js` - Executes SQL commands from a file or string.
- `execute-sql-direct.js` - Executes SQL commands directly without parsing or splitting.
- `execute-sql-one-by-one.js` - Executes SQL commands one by one, allowing for better error handling.
- `execute-sql-with-if-not-exists.js` - Executes SQL commands with IF NOT EXISTS conditions to avoid errors when objects already exist.
- `output-sql-commands.js` - Outputs SQL commands to a file for manual execution.

## Utility Scripts

- `delete-test-users.js` - Deletes test users from the database while preserving admin accounts.
- `fix-database-schema.js` - Fixes database schema issues by adding missing tables, columns, or relationships.

## Usage

### Setting Up the Database

To set up the database schema for the PMU Profit System, run:

```bash
node scripts/database/setup-database.js
```

or use the npm script:

```bash
npm run setup-db
```

This will create all necessary tables, relationships, and initial data for the application.

**Note:** This script requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment variables.

### Verifying the Database

To verify that the database is properly set up, run:

```bash
node scripts/database/verify-database.js
```

or use the npm script:

```bash
npm run verify-db
```

### Executing SQL Commands

To execute SQL commands from a file, run:

```bash
node scripts/database/execute-sql.js --file=path/to/file.sql
```

or use the npm script:

```bash
npm run execute-sql -- --file=path/to/file.sql
```

To execute SQL commands with IF NOT EXISTS conditions, run:

```bash
node scripts/database/execute-sql-with-if-not-exists.js
```

or use the npm script:

```bash
npm run execute-sql-with-if-not-exists
```

### Fixing Database Schema Issues

To fix database schema issues, run:

```bash
node scripts/database/fix-database-schema.js
```

### Deleting Test Users

To delete test users from the database while preserving admin accounts, run:

```bash
node scripts/database/delete-test-users.js
```

or use the npm script:

```bash
npm run delete-users
``` 
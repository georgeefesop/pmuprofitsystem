# Supabase Local Development Setup

This guide explains how to set up Supabase for local development with the PMU Profit System.

## Prerequisites

Before setting up Supabase locally, ensure you have the following installed:

1. **Docker Desktop** - Required to run Supabase locally
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Make sure Docker is running before proceeding

2. **Node.js** - Required to run the setup scripts
   - Recommended version: 16.x or higher

## Automated Setup

The PMU Profit System includes automated scripts to set up Supabase locally:

### Option 1: Complete Setup (Recommended)

Run the complete setup script, which will guide you through setting up Supabase and the development environment:

```bash
npm run setup
```

This script will:
1. Check if Docker is installed and running
2. Set up Supabase locally
3. Configure your environment variables
4. Set up and verify the database
5. Start the development server (optional)

### Option 2: Supabase Setup Only

If you only want to set up Supabase without the complete environment setup:

```bash
npm run setup:supabase
```

This script will:
1. Check if Docker is installed and running
2. Install Supabase CLI if not already installed
3. Initialize a Supabase project
4. Start Supabase local development
5. Guide you through setting up environment variables

## Manual Setup

If you prefer to set up Supabase manually, follow these steps:

1. **Install Supabase CLI**:
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Windows/Linux
   npm install -g supabase
   ```

2. **Initialize Supabase project**:
   ```bash
   supabase init
   ```

3. **Start Supabase local development**:
   ```bash
   supabase start
   ```

4. **Configure environment variables**:
   Create or update your `.env.local` file with the Supabase credentials provided in the output of the `supabase start` command:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Database Setup

After setting up Supabase, you need to set up the database schema:

```bash
npm run setup-db
```

This script will create the necessary tables and seed data in your local Supabase instance.

## Verify Setup

To verify that Supabase and the database are set up correctly:

```bash
npm run verify-db
```

## Troubleshooting

### Docker Issues

- **Docker not running**: Ensure Docker Desktop is running before executing the setup scripts
- **Port conflicts**: If Supabase fails to start due to port conflicts, check if any services are using ports 54321 or 54322

### Supabase CLI Issues

- **CLI not found**: If the Supabase CLI is not found, install it manually using the commands in the Manual Setup section
- **Permission errors**: On Unix-based systems, you might need to use `sudo` for installation

### Database Issues

- **Connection errors**: Ensure Supabase is running and the environment variables are correctly set
- **Schema errors**: If the database schema setup fails, check the error messages and run `npm run setup-db` again

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase CLI Documentation](https://supabase.io/docs/reference/cli)
- [Docker Documentation](https://docs.docker.com/) 
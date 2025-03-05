# PMU Profit System Documentation

Welcome to the PMU Profit System documentation. This directory contains comprehensive documentation for the PMU Profit System, a modern SaaS application for Permanent Makeup professionals.

## Available Documentation

### System Overview
- [Database Schema](DATABASE-SCHEMA.md) - Comprehensive overview of the database structure
- [Supabase Authentication](SUPABASE-AUTHENTICATION.md) - Guide to the authentication system

### Troubleshooting
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solutions for common issues

### Development Guides
- [Supabase Setup](supabase-setup-instructions.md) - Instructions for setting up Supabase
- [Deployment Guide](DEPLOYMENT.md) - Guide for deploying the application
- [Testing Guide](TESTING.md) - Instructions for testing the application
- [Error Handling](ERROR_HANDLING.md) - Overview of the error handling system

### API Documentation
- [API Routes](API-ROUTES.md) - Documentation for the API routes
- [Stripe Integration](STRIPE-INTEGRATION.md) - Guide to the Stripe payment integration

### Development Workflow
- [Development Workflow](DEVELOPMENT-WORKFLOW.md) - Guide to the development workflow
- [Code Structure](CODE-STRUCTURE.md) - Overview of the codebase structure

## Using This Documentation

The documentation is organized to help you find information quickly:

1. **For new developers**: Start with the Code Structure and System Overview documents
2. **For deployment**: Refer to the Deployment Guide
3. **For troubleshooting**: Check the Troubleshooting Guide for common issues and solutions
4. **For development**: Follow the Development Workflow guide

## Contributing to Documentation

When adding or updating documentation, please follow these guidelines:

1. Use Markdown format for all documentation
2. Include a table of contents for longer documents
3. Use code blocks with syntax highlighting for code examples
4. Keep the documentation up to date with code changes
5. Add links to related documentation where appropriate

## Documentation Structure

```
docs/
├── README.md                    # This file
├── DATABASE-SCHEMA.md           # Database schema documentation
├── SUPABASE-AUTHENTICATION.md   # Authentication system documentation
├── TROUBLESHOOTING.md           # Troubleshooting guide
├── API-ROUTES.md                # API routes documentation
├── STRIPE-INTEGRATION.md        # Stripe integration documentation
├── DEVELOPMENT-WORKFLOW.md      # Development workflow guide
├── CODE-STRUCTURE.md            # Codebase structure overview
├── supabase-setup-instructions.md # Supabase setup instructions
├── DEPLOYMENT.md                # Deployment guide
├── TESTING.md                   # Testing guide
└── ERROR_HANDLING.md            # Error handling documentation

../                              # Root directory
├── database/                    # Database setup files
│   └── supabase-setup.sql       # SQL setup script
├── ReferenceAssets/             # Reference assets
├── scripts/                     # Development and build scripts
└── src/                         # Source code
```

## Project Structure

The PMU Profit System follows a modern Next.js App Router structure:

```
src/
├── app/                         # Next.js App Router pages
│   ├── api/                     # API routes
│   ├── dashboard/               # Dashboard pages
│   ├── auth/                    # Authentication pages
│   ├── checkout/                # Checkout pages
│   └── ...                      # Other pages
├── components/                  # React components
│   ├── ui/                      # UI components
│   └── sections/                # Page sections
├── contexts/                    # React contexts
├── lib/                         # Utility libraries
├── utils/                       # Utility functions
│   └── supabase/                # Supabase utilities
└── middleware.ts                # Next.js middleware
``` 
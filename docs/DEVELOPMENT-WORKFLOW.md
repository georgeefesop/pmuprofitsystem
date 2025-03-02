# PMU Profit System Development Workflow

This document outlines the development workflow for the PMU Profit System, including setup, development, testing, and deployment processes.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Development Workflow](#development-workflow)
3. [Git Workflow](#git-workflow)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Changelog Management](#changelog-management)
7. [Troubleshooting](#troubleshooting)

## Development Environment Setup

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Git

### Initial Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pmuprofitsystem
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables:
     ```
     # Supabase Configuration
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     
     # Site Configuration
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     
     # Stripe Configuration (Test Mode)
     STRIPE_SECRET_KEY=your_stripe_secret_key
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
     STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
     ```

4. Set up the database:
   ```bash
   npm run setup-db
   ```

5. Verify the database setup:
   ```bash
   npm run verify-db
   ```

### Running the Development Server

There are several ways to run the development server:

1. Standard development server:
   ```bash
   npm run dev
   ```

2. Direct development server (bypasses the launcher):
   ```bash
   npm run dev:direct
   ```

3. Alternative port development server:
   ```bash
   npm run dev:alt
   ```

4. HTTPS development server (required for Stripe):
   ```bash
   npm run dev:https
   ```

### Setting Up HTTPS for Local Development

Stripe requires HTTPS for payment forms to work properly. To set up HTTPS locally:

1. Install mkcert:
   ```bash
   # On Windows (with chocolatey)
   choco install mkcert

   # On macOS (with homebrew)
   brew install mkcert
   ```

2. Set up mkcert:
   ```bash
   mkcert -install
   ```

3. Generate certificates for localhost:
   ```bash
   npm run setup:https
   ```

4. Run the HTTPS server:
   ```bash
   npm run dev:https
   ```

## Development Workflow

### Code Structure

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

### Coding Standards

1. **TypeScript**: Use TypeScript for all code.
   - Prefer interfaces over types.
   - Use proper type annotations for all functions and variables.
   - Avoid using `any` type.

2. **React Components**:
   - Use functional components with TypeScript interfaces.
   - Use the `function` keyword for pure functions.
   - Add the `'use client'` directive at the top of client components.
   - Minimize the use of `useEffect` and `useState`.
   - Favor React Server Components (RSC) where possible.

3. **Styling**:
   - Use Tailwind CSS for styling.
   - Follow a mobile-first approach.
   - Use Shadcn UI and Radix UI components where appropriate.

4. **Error Handling**:
   - Use the error handling utilities in `src/lib/error-handler.ts`.
   - Wrap critical components in `ErrorBoundary` components.
   - Use try-catch blocks for async operations.

### Development Process

1. **Feature Development**:
   - Create a new branch for each feature or bug fix.
   - Implement the feature or fix the bug.
   - Write tests for the feature or bug fix.
   - Update documentation as needed.
   - Update the changelog.
   - Submit a pull request.

2. **Code Review**:
   - All code changes should be reviewed by at least one other developer.
   - Use the pull request template to provide context for the changes.
   - Address all review comments before merging.

3. **Testing**:
   - Run tests locally before submitting a pull request.
   - Ensure all tests pass in the CI/CD pipeline.
   - Manually test the feature or bug fix in the development environment.

## Git Workflow

### Branch Naming Convention

- Feature branches: `feature/feature-name`
- Bug fix branches: `fix/bug-name`
- Documentation branches: `docs/doc-name`
- Refactoring branches: `refactor/refactor-name`

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): add email verification

Add email verification flow using Supabase Auth.
```

### Pull Request Process

1. Create a pull request from your feature branch to the main branch.
2. Fill out the pull request template.
3. Request a review from at least one other developer.
4. Address all review comments.
5. Merge the pull request once it has been approved.

## Testing

### Running Tests

Run tests using the following command:

```bash
npm run test
```

### Testing Stripe Payments

For testing Stripe payments, use the following test card numbers:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

Use any future expiration date, any 3-digit CVC, and any postal code.

### Testing Email Verification

To test email verification locally:

1. Use the test email verification API:
   ```bash
   curl -X POST http://localhost:3000/api/test-email-verification -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
   ```

2. Check the response for a preview URL to view the verification email.

## Deployment

### Building for Production

Build the application for production:

```bash
npm run build
```

### Deployment Options

See the [Deployment Guide](../DEPLOYMENT.md) for detailed deployment instructions.

## Changelog Management

The PMU Profit System uses a changelog to track all significant changes. The changelog is located at `ReferenceAssets/.changelog`.

### Updating the Changelog

When making significant changes, update the changelog with the following format:

```
## YYYY-MM-DD: Brief Description of Changes

### Fixed Issues
- Description of fixed issue 1
- Description of fixed issue 2

### New Features
- Description of new feature 1
- Description of new feature 2

### Security Enhancements
- Description of security enhancement 1
- Description of security enhancement 2

### Code Improvements
- Description of code improvement 1
- Description of code improvement 2
```

## Troubleshooting

### Common Development Issues

1. **Next.js Build Errors**:
   - Run `npm run check-errors` to check for common build errors.
   - Check the error message for specific issues.

2. **Image Domain Errors**:
   - Run `npm run prebuild` to check for image domains.
   - Add missing domains to `next.config.js`.

3. **Supabase Connection Issues**:
   - Check that your Supabase URL and API keys are correct.
   - Run `npm run test-supabase` to test the Supabase connection.

4. **Stripe Payment Issues**:
   - Ensure you're using HTTPS for local development.
   - Check that your Stripe API keys are correct.
   - Run `npm run debug-stripe` to debug Stripe configuration.

### Getting Help

If you encounter issues that are not covered in this document or the [Troubleshooting Guide](TROUBLESHOOTING.md), please:

1. Check the existing issues in the repository.
2. Create a new issue if your problem is not already reported.
3. Provide as much detail as possible, including:
   - Steps to reproduce the issue
   - Expected behavior
   - Actual behavior
   - Error messages
   - Environment information (OS, Node.js version, etc.) 
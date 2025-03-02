# HTTPS Setup for Local Development

This document provides detailed instructions for setting up HTTPS for local development in the PMU Profit System application.

## Why Use HTTPS Locally?

Using HTTPS in local development offers several benefits:

1. **Consistent Environment**: Matches production environment, reducing deployment surprises
2. **Security Testing**: Test security features that require HTTPS (cookies with secure flag, etc.)
3. **Third-party Integration**: Some APIs and services require HTTPS, even for development
4. **Service Worker Testing**: Service workers require HTTPS
5. **Supabase Authentication**: Ensures consistent behavior with authentication flows

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Administrative access to your machine (for certificate installation)

## Automatic Setup

We've created scripts to automate the HTTPS setup process:

1. **Run the setup script**:

   ```bash
   npm run setup:https
   ```

   This script will:
   - Check if mkcert is installed and install it if needed
   - Generate locally-trusted certificates
   - Update your environment variables to use HTTPS

2. **Start the development server with HTTPS**:

   ```bash
   npm run dev:https
   ```

   Your application will now be available at `https://localhost:3000`

## Manual Setup

If the automatic setup doesn't work for your environment, you can follow these manual steps:

### 1. Install mkcert

**Windows (with Chocolatey)**:
```bash
choco install mkcert
```

**macOS (with Homebrew)**:
```bash
brew install mkcert
brew install nss  # For Firefox support
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt install libnss3-tools
# Then download and install mkcert from: https://github.com/FiloSottile/mkcert
```

### 2. Create certificates

```bash
# Create certificates directory
mkdir -p certificates

# Install the local CA
mkcert -install

# Generate certificates
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
```

### 3. Update environment variables

Edit your `.env.local` file and update:

```
NEXT_PUBLIC_SITE_URL=https://localhost:3000
```

### 4. Start the server with HTTPS

```bash
node scripts/start-https.js
```

## Troubleshooting

### Certificate Not Trusted

If your browser shows a certificate warning:

1. Try running `mkcert -install` again with administrator privileges
2. For Chrome, visit `chrome://flags/#allow-insecure-localhost` and enable "Allow invalid certificates for resources loaded from localhost"

### Connection Refused

If you get "Connection Refused" errors:

1. Check if another process is using port 3000
2. Try changing the port in `scripts/start-https.js`

### Supabase Connection Issues

If you experience Supabase connection issues:

1. Ensure your Supabase project has `https://localhost:3000` in the allowed domains list
2. Check that your environment variables are correctly set
3. Clear browser cookies and local storage

## Additional Configuration

### Supabase Configuration

Update your Supabase project settings:

1. Go to your Supabase dashboard
2. Navigate to Authentication > URL Configuration
3. Add `https://localhost:3000` to the Site URL
4. Add `https://localhost:3000/auth/callback` to the Redirect URLs

### Next.js Configuration

The `next.config.js` file doesn't need specific changes for HTTPS as our custom server handles this.

## References

- [mkcert GitHub Repository](https://github.com/FiloSottile/mkcert)
- [Next.js Custom Server Documentation](https://nextjs.org/docs/advanced-features/custom-server)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth) 
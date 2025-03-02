const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Path to certificates directory
const certDir = path.join(__dirname, '..', 'certificates');

// Check if certificates exist
if (!fs.existsSync(path.join(certDir, 'localhost-key.pem')) || 
    !fs.existsSync(path.join(certDir, 'localhost.pem'))) {
  console.error('Error: SSL certificates not found in the certificates directory.');
  console.error('Please run "npm run setup:https" first to generate the certificates.');
  process.exit(1);
}

// Self-signed certificate options
const httpsOptions = {
  key: fs.readFileSync(path.join(certDir, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(certDir, 'localhost.pem')),
};

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${port}`);
    console.log('> Note: You may need to accept the self-signed certificate in your browser');
    
    // Log additional information
    console.log('\nEnvironment:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`- NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
    console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  });
});

/*
To use this script:

1. First, install mkcert to create a local certificate:
   npm install -g mkcert

2. Generate local certificates:
   mkcert -install
   mkcert localhost

3. Make sure the certificate files (localhost-key.pem and localhost.pem) are in the root directory

4. Run this script:
   node start-https.js

This will start your Next.js app with HTTPS enabled locally.
*/ 
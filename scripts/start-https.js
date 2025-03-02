const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Self-signed certificate options
// Note: In production, you should use a proper SSL certificate
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost.pem')),
};

const port = 3000;

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${port}`);
    console.log('> Note: You may need to accept the self-signed certificate in your browser');
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
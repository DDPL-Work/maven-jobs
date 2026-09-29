require('dotenv').config();
const cloudinary = require('../src/config/cloudinary');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const ICONS = {
  'google-play': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <path fill="#4285F4" d="M48.7 15.3c-4.4 4.7-6.9 12-6.9 21.6v438.2c0 9.6 2.5 16.9 6.9 21.6l1.2 1.2 245.4-245.4v-5.8L49.9 14.1l-1.2 1.2z"/>
    <path fill="#FBBC04" d="M375.4 332.9l-80.1-80.1v-5.8l80.1-80.1 1.8 1 94.8 53.9c27.1 15.4 27.1 40.6 0 56l-94.8 53.9-1.8 1.2z"/>
    <path fill="#EA4335" d="M295.3 252.8L49.9 498.2c8.9 9.4 23.5 10.6 39.9 1.3l287.4-163.3-81.9-83.4z"/>
    <path fill="#34A853" d="M295.3 259.2l81.9-83.4L89.8 12.5C73.4 3.2 58.8 4.4 49.9 13.8l245.4 245.4z"/>
  </svg>`,
  'apple-store': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 170" width="170" height="170">
    <path fill="#1e293b" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-6.3-9.77-11.33-20.9-15.08-33.39-3.75-12.49-5.63-24.31-5.63-35.47 0-14.23 3.6-26.04 10.8-35.42 7.2-9.38 16.4-14.18 27.6-14.4 5.23 0 11.05 1.54 17.46 4.62 6.42 3.08 10.43 4.68 12.04 4.8 1.41-.12 5.54-1.74 12.39-4.86 6.86-3.12 12.54-4.56 17.04-4.32 12.82.72 23.01 5.37 30.56 13.94-11.3 6.85-16.83 16.33-16.59 28.43.24 9.61 3.96 17.65 11.16 24.12 7.2 6.47 15.7 10.09 25.5 10.85-2.22 6.74-4.84 13.34-7.87 19.8zm-33.65-104.7c0-6.74 2.5-13.06 7.5-17.96 5-4.9 11.12-7.85 18.36-8.85.24 1.1.36 2.1.36 3 0 6.62-2.52 13-7.56 18.14-5.04 5.14-11.28 8.04-18.72 8.7-.12-.35-.2-.7-.24-1.03z"/>
  </svg>`,
  'facebook': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="24" fill="#1877F2"/>
    <path fill="#ffffff" d="M29.5 24h-4v14h-6V24h-3v-5h3v-3.5C19.5 12.5 21.8 10 26 10h4v5h-2.5c-1.1 0-1.5.5-1.5 1.5V19h4.2l-.7 5z"/>
  </svg>`,
  'twitter': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="24" fill="#0f172a"/>
    <path fill="#ffffff" d="M28.8 14h3.3l-7.2 8.2L33.4 34h-6.6l-5.2-6.8L15.7 34h-3.3l7.7-8.8L12 14h6.8l4.7 6.2L28.8 14zm-1.2 18h1.8L17.7 15.9h-2L27.6 32z"/>
  </svg>`,
  'instagram': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <defs>
      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fdf497"/>
        <stop offset="5%" stop-color="#fdf497"/>
        <stop offset="45%" stop-color="#fd5949"/>
        <stop offset="60%" stop-color="#d6249f"/>
        <stop offset="90%" stop-color="#285AEB"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="24" fill="url(#ig)"/>
    <path fill="#ffffff" d="M24 16c2.6 0 2.9 0 3.9.1 1 .1 1.6.2 2 .4.5.2.9.4 1.3.8.4.4.6.8.8 1.3.2.4.3 1 .4 2 .1 1 .1 1.3.1 3.9s0 2.9-.1 3.9c-.1 1-.2 1.6-.4 2-.2.5-.4.9-.8 1.3-.4.4-.8.6-1.3.8-.4.2-1 .3-2 .4-1 .1-1.3.1-3.9.1s-2.9 0-3.9-.1c-1-.1-1.6-.2-2-.4-.5-.2-.9-.4-1.3-.8-.4-.4-.6-.8-.8-1.3-.2-.4-.3-1-.4-2-.1-1-.1-1.3-.1-3.9s0-2.9.1-3.9c.1-1 .2-1.6.4-2 .2-.5.4-.9.8-1.3.4-.4.8-.6 1.3-.8.4-.2 1-.3 2-.4 1-.1 1.3-.1 3.9-.1m0-2c-2.7 0-3 .01-4.1.06-1 .05-1.8.2-2.4.45a5 5 0 00-1.8 1.18 5 5 0 00-1.18 1.8c-.24.63-.4 1.37-.45 2.44C14 20.98 14 21.32 14 24s.01 3.02.06 4.07c.05 1.07.2 1.81.45 2.44.25.66.6 1.25 1.18 1.8a5 5 0 001.8 1.18c.63.24 1.37.4 2.44.45 1.05.05 1.39.06 4.07.06s3.02-.01 4.07-.06c1.07-.05 1.81-.2 2.44-.45a5 5 0 001.8-1.18 5 5 0 001.18-1.8c.24-.63.4-1.37.45-2.44.05-1.05.06-1.39.06-4.07s-.01-3.02-.06-4.07c-.05-1.07-.2-1.81-.45-2.44a5 5 0 00-1.18-1.8 5 5 0 00-1.8-1.18c-.63-.24-1.37-.4-2.44-.45C27.02 14.01 26.68 14 24 14z"/>
    <circle cx="24" cy="24" r="4.9" fill="none" stroke="#ffffff" stroke-width="2"/>
    <circle cx="29.2" cy="18.8" r="1.1" fill="#ffffff"/>
  </svg>`,
  'linkedin': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="24" fill="#0A66C2"/>
    <path fill="#ffffff" d="M16 20h4v14h-4zM18 14a2.3 2.3 0 100 4.6A2.3 2.3 0 0018 14zm6 6h3.8v1.9h.1c.5-1 1.9-2.1 3.9-2.1 4.2 0 5 2.7 5 6.3V34h-4v-7.1c0-1.7 0-3.9-2.4-3.9s-2.8 1.9-2.8 3.8V34h-4V20z"/>
  </svg>`
};

const uploadSvgBuffer = (svgStr, publicId) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'email-assets', public_id: publicId, format: 'png', overwrite: true },
    (err, res) => err ? reject(err) : resolve(res)
  );
  stream.end(Buffer.from(svgStr));
});

const uploadPngBuffer = (buf, publicId) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'email-assets', public_id: publicId, format: 'png', overwrite: true },
    (err, res) => err ? reject(err) : resolve(res)
  );
  stream.end(buf);
});

async function main() {
  const urls = {};

  // 1. Upload Maven brand logo
  const logoSvg = fs.readFileSync(path.join(__dirname, '../public/maven-logo.svg'));
  const logoRes = await uploadSvgBuffer(logoSvg, 'maven-jobs-brand-logo');
  urls.logo = logoRes.secure_url;
  console.log(`Uploaded Logo: ${logoRes.secure_url}`);

  // 2. Upload icons
  for (const [name, svg] of Object.entries(ICONS)) {
    const res = await uploadSvgBuffer(svg, `icon-${name}`);
    urls[name] = res.secure_url;
    console.log(`Uploaded ${name}: ${res.secure_url}`);
  }

  // 3. Generate and upload real QR Code containing Play Store & App Store download link
  const downloadTargetUrl = 'https://naukri-3.vercel.app/download';
  const qrBuf = await QRCode.toBuffer(downloadTargetUrl, {
    errorCorrectionLevel: 'H',
    width: 480,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' }
  });
  const qrRes = await uploadPngBuffer(qrBuf, 'maven-app-download-qr');
  urls.qr = qrRes.secure_url;
  console.log(`Uploaded QR code: ${qrRes.secure_url}`);

  console.log('\n====================================');
  console.log('ALL CLOUDINARY EMAIL ASSETS:');
  console.log(JSON.stringify(urls, null, 2));
  console.log('====================================\n');
}

main().catch(console.error);

const http = require('http');
const fs = require('fs');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const body = `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nRohan Kundliya\r\n--${boundary}\r\nContent-Disposition: form-data; name="designation"\r\n\r\nMERN\r\n--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n+911234567890\r\n--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\nrohank@gmail.com\r\n--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\nRoohan003!\r\n--${boundary}\r\nContent-Disposition: form-data; name="qrToken"\r\n\r\n\r\n--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="dummy.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4...\r\n--${boundary}--\r\n`;

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/candidate/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body),
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
});

req.on('error', e => console.error(e));
req.write(body);
req.end();

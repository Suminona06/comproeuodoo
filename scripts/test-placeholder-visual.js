import http from 'node:http';
import fs from 'node:fs';

function get(pathUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: pathUrl,
      method: 'GET',
      headers: {
        Host: '127.0.0.1:3000',
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('Testing news listing & placeholder endpoints...');
  try {
    const resListing = await get('/news');
    console.log('/news HTTP Status:', resListing.statusCode);
    if (resListing.statusCode !== 200) {
      console.error('Error: /news returned', resListing.statusCode);
      process.exit(1);
    }
    const hasWhiteLogo = resListing.body.includes('media-1792035656935-732682512.webp');
    console.log('Includes white logo placeholder:', hasWhiteLogo);

    const resDetail = await get('/news/penerapan-injeksi-presisi-mikro-komponen-medis');
    console.log('/news/:slug (null cover) HTTP Status:', resDetail.statusCode);
    const hasDetailPlaceholder = resDetail.body.includes('nwd-hero-media-placeholder');
    console.log('Includes detail placeholder class:', hasDetailPlaceholder);

    console.log('ALL TESTS PASSED! No 500 error.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
})();

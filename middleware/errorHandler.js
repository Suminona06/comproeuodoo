import logger from '../utils/logger.js';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const isJson = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');

  if (isJson) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      path: req.originalUrl
    });
  }

  res.status(404);
  try {
    return res.render('public/404', {
      title: 'Halaman Tidak Ditemukan - PT Euodoo',
      path: req.originalUrl
    });
  } catch (err) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>404 - Halaman Tidak Ditemukan | PT Euodoo</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf8ff; color: #131b2e; }
          .container { text-align: center; padding: 2rem; }
          h1 { font-size: 3rem; color: #0055b8; margin-bottom: 0.5rem; }
          p { font-size: 1.1rem; color: #424753; margin-bottom: 1.5rem; }
          a { display: inline-block; padding: 0.75rem 1.5rem; background: #0055b8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>404</h1>
          <p>Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.</p>
          <a href="/">Kembali ke Beranda</a>
        </div>
      </body>
      </html>
    `);
  }
};

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  logger.error(err.message, {
    status: statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: isDev ? err.stack : undefined
  });

  const isJson = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');

  if (isJson) {
    return res.status(statusCode).json({
      success: false,
      error: isDev ? err.message : 'Terjadi kesalahan internal pada server.',
      ...(isDev && { stack: err.stack })
    });
  }

  res.status(statusCode);
  return res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${statusCode} - Terjadi Kesalahan | PT Euodoo</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf8ff; color: #131b2e; }
        .container { text-align: center; padding: 2rem; max-width: 600px; }
        h1 { font-size: 3rem; color: #ba1a1a; margin-bottom: 0.5rem; }
        p { font-size: 1.1rem; color: #424753; margin-bottom: 1.5rem; }
        a { display: inline-block; padding: 0.75rem 1.5rem; background: #0055b8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
        pre { text-align: left; background: #eaedff; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; color: #131b2e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${statusCode}</h1>
        <p>${isDev ? err.message : 'Terjadi kendala pada sistem kami. Tim teknis sedang menanganinya.'}</p>
        ${isDev && err.stack ? `<pre>${err.stack}</pre>` : ''}
        <br>
        <a href="/">Kembali ke Beranda</a>
      </div>
    </body>
    </html>
  `);
};

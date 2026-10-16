import os from 'os';
import app from './app.js';
import logger from './utils/logger.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

if (typeof PhusionPassenger !== 'undefined') {
  // CloudLinux cPanel Passenger runtime
  server = app.listen('passenger', async () => {
    logger.info('PT Euodoo Web Server running under Phusion Passenger on cPanel');
    await testConnection();
  });
} else {
  // Standard standalone / local development runtime
  server = app.listen(PORT, HOST, async () => {
    logger.info(`PT Euodoo Web Server running on ${HOST}:${PORT} [Mode: ${NODE_ENV}]`);
    if (NODE_ENV !== 'production') {
      logger.info(`> Local URL:   http://localhost:${PORT}`);
      try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
              logger.info(`> WSL Network: http://${net.address}:${PORT} (${name})`);
            }
          }
        }
      } catch (err) {
        logger.debug('Could not inspect network interfaces', { error: err.message });
      }
    }
    await testConnection();
  });
}

// Graceful Shutdown Handlers for Phusion Passenger / Process Managers
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down HTTP server gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force close after 10 seconds timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise:', { reason });
});

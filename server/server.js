const http = require('http');
const app = require('./app');
const { port, env } = require('./config/env');
const { connectDatabase } = require('./config/db');
const logger = require('./utils/logger');
const socketService = require('./services/socketService');

let server;

async function start() {
  await connectDatabase();
  const httpServer = http.createServer(app);
  socketService.init(httpServer);
  server = httpServer.listen(port, () => logger.info(`API listening on :${port} (${env})`));
}

start().catch((err) => {
  logger.error('Failed to start server:', err.message);
  process.exit(1);
});

/* Shut down cleanly so in-flight requests finish and Mongo closes its sockets. */
const shutdown = (signal) => () => {
  logger.info(`${signal} received, shutting down`);
  server?.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  server?.close(() => process.exit(1));
});

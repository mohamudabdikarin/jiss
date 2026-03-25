// filepath: server/src/server.js
const { validateEnv, env } = require('./config/env');

// Validate environment variables first
validateEnv();

const app = require('./app');
const connectDB = require('./config/db');
const { startScheduledPublishCron } = require('./services/scheduledPublishService');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Scheduled publishing (publish draft content when scheduledPublishDate passes)
    startScheduledPublishCron();

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`\n🚀 IJCDS CMS Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`   Health: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`   API:    http://localhost:${env.PORT}/api/v1\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed');
        const mongoose = require('mongoose');
        mongoose.connection.close(false).then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });

      // Force shutdown after 10s
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

startServer();

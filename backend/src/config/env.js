/**
 * Environment variable validation
 * Validates required environment variables on startup
 */

require('dotenv').config();

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'PG_HOST',
  'PG_PORT',
  'PG_DATABASE',
  'PG_USER',
  'PG_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_SECRET',
];

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required variable is missing
 */
const validateEnvironment = () => {
  const missing = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate JWT_SECRET has minimum length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET should be at least 32 characters for security'
    );
  }

  console.log('✅ Environment variables validated successfully');
};

/**
 * Gets environment-specific configuration
 */
const getConfig = () => {
  return {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    database: {
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT),
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    finePerDay: parseFloat(process.env.FINE_PER_DAY || '0.5'),
  };
};

module.exports = {
  validateEnvironment,
  getConfig,
};

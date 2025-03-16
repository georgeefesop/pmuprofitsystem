/**
 * Middleware Logger Module
 * Provides a configurable logging system for the middleware
 */

// Configurable logging system for middleware
const MIDDLEWARE_LOG_LEVEL = process.env.MIDDLEWARE_LOG_LEVEL || 'info'; // 'debug', 'info', 'warn', 'error', 'none'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

const LogLevels: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const currentLogLevel = LogLevels[(MIDDLEWARE_LOG_LEVEL.toUpperCase() as LogLevel)] || LogLevels.INFO;

/**
 * Logger utility for middleware
 * Provides methods for logging at different levels with consistent formatting
 */
export const logger = {
  debug: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevels.DEBUG) {
      console.log(`Middleware [DEBUG]: ${message}`, data !== undefined ? data : '');
    }
  },
  info: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevels.INFO) {
      console.log(`Middleware [INFO]: ${message}`, data !== undefined ? data : '');
    }
  },
  warn: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevels.WARN) {
      console.warn(`Middleware [WARN]: ${message}`, data !== undefined ? data : '');
    }
  },
  error: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevels.ERROR) {
      console.error(`Middleware [ERROR]: ${message}`, data !== undefined ? data : '');
    }
  }
};

export default logger; 
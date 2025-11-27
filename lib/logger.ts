/**
 * Simple logger utility for Expo
 * In development, logs to console
 * In production, you can extend this to send to a logging service
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }
    // In production, you could send to Sentry, LogRocket, etc.
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};


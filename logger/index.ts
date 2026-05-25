/**
 * Module can be used to log errors, warnings and other type of log messages
 */
import * as Sentry from '@sentry/react-native';
import { logger, sentryTransport, consoleTransport } from 'react-native-logs';

enum LEVEL {
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warn',
}

interface LogConfig {
  message: string;
  category: string;
  type?: string;
}
/**
 * Get severity level for Sentry
 */
const getSentryLevel = (level: LEVEL) => {
  switch (level) {
    case LEVEL.INFO:
      return 'info';
    case LEVEL.WARNING:
      return 'warning';
    case LEVEL.ERROR:
      return 'error';
    default:
      throw new Error(`Unknown level: ${level}`);
  }
};

const config = {
  severity: 'debug',
  transport: __DEV__ ? consoleTransport : sentryTransport,
  transportOptions: {
    SENTRY: Sentry,
    color: 'ansi',
  },
  async: true,
  printLevel: true,
  printDate: true,
  enabled: true,
};

const RNlogger = logger.createLogger(config);

/**
 * Generic private logger method. Logs to Winston in developer env and to Sentry in all others
 */
const log = (config: LogConfig & { level: LEVEL }) => {
  if (__DEV__) {
    RNlogger[config.level](config.category, { message: config.message });
  } else {
    Sentry.addBreadcrumb({
      ...config,
      level: getSentryLevel(config.level),
      timestamp: new Date().getTime(),
    });
  }
};

/**
 * More specific loggers exposed to module clients
 */
const error = (config: LogConfig) => log({ ...config, level: LEVEL.ERROR });
const info = (config: LogConfig) => log({ ...config, level: LEVEL.INFO });
const warn = (config: LogConfig) => log({ ...config, level: LEVEL.WARNING });

const captureException = (error: Error | string | unknown) => Sentry.captureException(error);

export default {
  error,
  info,
  warn,
  captureException,
};

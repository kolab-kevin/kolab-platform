import pino from 'pino';

export type LoggerOptions = {
  level?: string;
  serviceName?: string;
  pretty?: boolean;
};

export function createLogger(options: LoggerOptions = {}) {
  const {
    level = process.env.LOG_LEVEL ?? 'info',
    serviceName = 'kolab-platform',
    pretty = process.env.NODE_ENV !== 'production',
  } = options;

  return pino({
    level,
    base: { service: serviceName },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel;
  private transports: Array<(entry: LogEntry) => void> = [];

  constructor() {
    this.minLevel = process.env.NODE_ENV === "production" ? "info" : "debug";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  addTransport(transport: (entry: LogEntry) => void): void {
    this.transports.push(transport);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private createEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        env: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      },
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const entryString = JSON.stringify(entry);

    switch (entry.level) {
      case "error":
        console.error(entryString);
        break;
      case "warn":
        console.warn(entryString);
        break;
      case "info":
        console.info(entryString);
        break;
      case "debug":
        console.debug(entryString);
        break;
    }

    this.transports.forEach((transport) => {
      try {
        transport(entry);
      } catch (err) {
        console.error("Transport error:", err);
      }
    });
  }

  debug(message: string, context?: LogContext): void {
    this.log(this.createEntry("debug", message, context));
  }

  info(message: string, context?: LogContext): void {
    this.log(this.createEntry("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.log(this.createEntry("warn", message, context));
  }

  error(message: string | Error, context?: LogContext): void {
    const errorObj = message instanceof Error ? message : undefined;
    const msg = errorObj ? errorObj.message : (message as string);
    this.log(this.createEntry("error", msg, context, errorObj));
  }

  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...context });
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.context, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...context });
  }

  error(message: string | Error, context?: LogContext): void {
    const errorObj = message instanceof Error ? message : undefined;
    const msg = errorObj ? errorObj.message : (message as string);
    this.parent.error(msg, { ...this.context, ...context });
  }
}

export const logger = Logger.getInstance();

export function createLogger(context: LogContext): ChildLogger {
  return logger.child(context);
}

export const apiLogger = createLogger({ component: "api" });
export const eventLogger = createLogger({ component: "events" });
export const authLogger = createLogger({ component: "auth" });
export const syncLogger = createLogger({ component: "sync" });

export type { LogLevel, LogContext, LogEntry };
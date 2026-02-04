// ===========================================
// Structured Logger - KonvertaCRM
// ===========================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  dealId?: string;
  companyId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      return `[${entry.level.toUpperCase()}] ${entry.message}`;
    }
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Skip debug logs in production
    if (this.isProduction && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
    };

    const formattedMessage = this.formatLogEntry(logEntry);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context || '');
        break;
      case 'info':
        console.info(formattedMessage, context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'error':
        console.error(formattedMessage, context || '');
        break;
    }

    // In production, could send to external service (Sentry, etc.)
    if (this.isProduction && level === 'error') {
      this.sendToErrorService(logEntry);
    }
  }

  private sendToErrorService(entry: LogEntry): void {
    // TODO: Integrate with Sentry or similar service
    // For now, just log that we would send to external service
    // Sentry.captureMessage(entry.message, { extra: entry.context });
  }

  /**
   * Debug level - only shown in development
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning level - something unexpected but not critical
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level - something went wrong
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    };

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level: 'error',
      message,
      context: errorContext,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      console.error(JSON.stringify(logEntry));
    }

    if (this.isProduction) {
      this.sendToErrorService(logEntry);
    }
  }

  /**
   * Track performance of an operation
   */
  trackPerformance(operation: string, startTime: number, context?: LogContext): void {
    const duration = Date.now() - startTime;
    this.info(`${operation} completed`, { ...context, duration });
  }

  /**
   * Create a child logger with preset context
   */
  child(baseContext: LogContext): ChildLogger {
    return new ChildLogger(this, baseContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.baseContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

// Export singleton instance
export const logger = new Logger();

// Usage examples:
// import { logger } from '@/lib/logger';
// 
// logger.info('Deal created', { dealId: deal.id, userId: user.id });
// logger.error('Failed to create deal', error, { dealId: deal.id });
// 
// const dealLogger = logger.child({ dealId: '123' });
// dealLogger.info('Processing stage change');

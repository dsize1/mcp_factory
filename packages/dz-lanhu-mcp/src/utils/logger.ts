/**
 * 日志工具
 * 
 * 提供统一的日志输出功能
 */

import { config } from '../config.js';

/** 日志级别 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

/** 日志颜色 */
const COLORS: Record<string, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m',
};

/** 日志前缀 */
const PREFIXES: Record<string, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

/**
 * 输出日志
 */
function log(level: LogLevel, message: string, ...args: unknown[]): void {
  if (!config.debug && level < LogLevel.Info) {
    return;
  }

  const levelKey = LogLevel[level] || 'info';
  const prefix = PREFIXES[levelKey.toLowerCase()] || 'INFO';
  const color = COLORS[levelKey.toLowerCase()] || '\x1b[0m';
  const timestamp = new Date().toISOString();

  // eslint-disable-next-line no-console
  console.log(`${color}[${timestamp}] [${prefix}] dz-lanhu-mcp${COLORS.reset} ${message}`, ...args);
}

/** 调试日志 */
export function debug(message: string, ...args: unknown[]): void {
  log(LogLevel.Debug, message, ...args);
}

/** 信息日志 */
export function info(message: string, ...args: unknown[]): void {
  log(LogLevel.Info, message, ...args);
}

/** 警告日志 */
export function warn(message: string, ...args: unknown[]): void {
  log(LogLevel.Warn, message, ...args);
}

/** 错误日志 */
export function error(message: string, ...args: unknown[]): void {
  log(LogLevel.Error, message, ...args);
}

export { COLORS, PREFIXES };
/**
 * 缓存模块
 * 
 * 提供本地文件缓存功能，用于存储蓝湖数据
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import { config } from '../config.js';

/**
 * 缓存管理器
 */
class CacheManager {
  private dataDir: string;

  constructor() {
    this.dataDir = config.dataDir || './data';
  }

  /**
   * 确保缓存目录存在
   */
  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = resolve(this.dataDir, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  /**
   * 获取缓存文件路径
   */
  getCachePath(key: string, extension: string = 'json'): string {
    const sanitizedKey = key.replace(/[/:]/g, '_');
    return resolve(this.dataDir, `${sanitizedKey}.${extension}`);
  }

  /**
   * 读取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachePath = this.getCachePath(key);
      const content = await fs.readFile(cachePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * 写入缓存
   */
  async set(key: string, data: unknown, expiresIn?: number): Promise<void> {
    await this.ensureDir('');
    const cachePath = this.getCachePath(key);
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    };
    await fs.writeFile(cachePath, JSON.stringify(cacheItem, null, 2));
  }

  /**
   * 检查缓存是否有效
   */
  async isValid(key: string): Promise<boolean> {
    const item = await this.get<{ timestamp: number; expiresAt?: number }>(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      const cachePath = this.getCachePath(key);
      await fs.unlink(cachePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    try {
      await fs.rm(this.dataDir, { recursive: true, force: true });
      await this.ensureDir('');
    } catch {
      // Ignore errors
    }
  }
}

// 导出单例
export const cacheManager = new CacheManager();

// 导出类以便测试
export { CacheManager };
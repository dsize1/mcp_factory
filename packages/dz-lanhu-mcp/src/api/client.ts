/**
 * 蓝湖 HTTP 客户端
 * 
 * 封装与蓝湖 API 的所有 HTTP 通信
 */

import { config, BASE_URL, DDS_BASE_URL, CDN_URL } from '../config.js';
import type { RequestOptions } from 'http';
import type { IncomingHttpHeaders } from 'http';

/**
 * HTTP 响应
 */
export interface HttpResponse<T = unknown> {
  /** 响应数据 */
  data: T;
  /** HTTP 状态码 */
  status: number;
  /** 响应头 */
  headers: Record<string, string>;
  /** 响应时间（毫秒） */
  duration: number;
}

/**
 * 请求头类型
 */
interface RequestHeaders {
  [key: string]: string;
}

/**
 * 蓝湖 API 客户端
 */
class LanhuAPIClient {
  private cookie: string;
  private ddsCookie: string;
  private timeout: number;

  constructor() {
    this.cookie = config.lanhuCookie;
    this.ddsCookie = config.ddsCookie;
    this.timeout = (config.httpTimeout || 30) * 1000;
  }

  /**
   * 发送 GET 请求
   */
  async get<T>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  /**
   * 发送 POST 请求
   */
  async post<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * 发送 DELETE 请求
   */
  async delete<T>(path: string): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  /**
   * 将任何请求头对象转换为 Record<string, string>
   */
  private normalizeHeaders(headers: unknown): RequestHeaders {
    if (!headers) return {};
    if (typeof headers !== 'object') return {};
    
    const result: RequestHeaders = {};
    const hdrs = headers as Record<string, string | string[] | undefined>;
    
    for (const [key, value] of Object.entries(hdrs)) {
      if (typeof value === 'string') {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = value.join(', ');
      }
    }
    
    return result;
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    
    // 解析 URL
    let url: string;
    if (path.startsWith('http')) {
      url = path;
    } else if (path.startsWith('/')) {
      url = BASE_URL + path;
    } else {
      url = BASE_URL + '/' + path;
    }

    const parsedUrl = new URL(url);
    
    // 构建请求头
    const rawHeaders: RequestHeaders = {
      'User-Agent': 'dz-lanhu-mcp/1.0.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    // 合并选项中的请求头
    if (options?.headers) {
      const normalized = this.normalizeHeaders(options.headers);
      Object.assign(rawHeaders, normalized);
    }
    
    const headers: RequestHeaders = { ...rawHeaders };

    // 添加 Cookie
    if (this.cookie && this.cookie !== 'your_lanhu_cookie_here') {
      headers['Cookie'] = this.cookie;
    }

    // 构建请求选项
    const requestOptions: RequestOptions = {
      method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      headers,
      timeout: this.timeout,
    };

    try {
      return await this.sendRequest(requestOptions, body, startTime);
    } catch (error: unknown) {
      const err = error as { message: string; code?: string };
      const duration = Date.now() - startTime;
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new Error(`请求超时: ${method} ${url} (${this.timeout}ms)`);
      }
      
      if (err.code === 'ECONNRESET') {
        throw new Error('连接被重置，请检查 Cookie 是否有效');
      }
      
      throw new Error(`请求失败: ${err.message}`);
    }
  }

  /**
   * 发送 HTTP 请求
   */
  private sendRequest<T>(
    options: RequestOptions,
    body: unknown,
    startTime: number
  ): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      const isHttps = options.port === 443 || options.hostname?.includes('https');
      const httpModule = isHttps ? require('https') : require('http');
      
      const req = httpModule.request(options, (res: import('http').IncomingMessage) => {
        const chunks: Buffer[] = [];
        
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const bodyBuffer = Buffer.concat(chunks);
          const headers = res.headers as IncomingHttpHeaders;
          const normalizedHeaders: Record<string, string> = {};
          
          for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string') {
              normalizedHeaders[key] = value;
            } else if (Array.isArray(value)) {
              normalizedHeaders[key] = value.join(', ');
            }
          }
          
          // 尝试解析 JSON
          let data: T;
          const contentType = normalizedHeaders['content-type'] || '';
          
          if (contentType.includes('application/json')) {
            try {
              data = JSON.parse(bodyBuffer.toString('utf-8')) as T;
            } catch {
              data = bodyBuffer.toString('utf-8') as unknown as T;
            }
          } else {
            data = bodyBuffer.toString('utf-8') as unknown as T;
          }
          
          resolve({
            data,
            status: res.statusCode || 0,
            headers: normalizedHeaders,
            duration: Date.now() - startTime,
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  /**
   * 下载文件（用于截图、资源等）
   */
  async downloadFile(url: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const parsedUrl = new URL(url);
    
    const headers: RequestHeaders = {
      'User-Agent': 'dz-lanhu-mcp/1.0.0',
    };
    
    if (url.includes('dds.lanhuapp.com') && this.ddsCookie) {
      headers['Cookie'] = this.ddsCookie;
    } else if (this.cookie && this.cookie !== 'your_lanhu_cookie_here') {
      headers['Cookie'] = this.cookie;
    }
    
    return new Promise((resolve, reject) => {
      const isHttps = parsedUrl.protocol === 'https:';
      const mod = isHttps ? require('https') : require('http');
      
      const req = mod.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers,
        timeout: this.timeout,
      }, (res: import('http').IncomingMessage) => {
        // 处理重定向
        if ([301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
          const redirectUrl = res.headers.location;
          if (redirectUrl && typeof redirectUrl === 'string') {
            this.downloadFile(redirectUrl).then(resolve).catch(reject);
          } else {
            reject(new Error(`重定向无 location: ${res.statusCode}`));
          }
          return;
        }
        
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Download timeout'));
      });
      req.end();
    });
  }

  /**
   * 获取蓝湖基础 URL
   */
  getBaseUrl(): string {
    return BASE_URL;
  }

  /**
   * 获取 DDS 基础 URL
   */
  getDdsBaseUrl(): string {
    return DDS_BASE_URL;
  }

  /**
   * 获取 CDN 基础 URL
   */
  getCdnUrl(): string {
    return CDN_URL;
  }
}

// 导出单例
export const lanhuApi = new LanhuAPIClient();

// 导出类以便测试
export { LanhuAPIClient };
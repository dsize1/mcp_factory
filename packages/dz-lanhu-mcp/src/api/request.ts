/**
 * 蓝湖 HTTP 请求客户端
 * 
 * 封装通用的 HTTP 请求逻辑，提供 get/post/delete 等方法
 * 作为所有蓝湖 API 调用的底层基础设施
 */

import type { RequestOptions } from 'http';
import type { IncomingHttpHeaders } from 'http';
import type { HttpResponse } from '../types.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 请求头类型
 */
export interface RequestHeaders {
  [key: string]: string;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  /** 蓝湖 Cookie */
  cookie: string;
  /** DDS Cookie */
  ddsCookie?: string;
  /** 基础 URL */
  baseUrl: string;
  /** DDS 基础 URL */
  ddsBaseUrl: string;
  /** CDN URL */
  cdnUrl: string;
  /** 请求超时时间（毫秒） */
  timeout: number;
}

// ============================================================
// LanhuRequest 类
// ============================================================

/**
 * 蓝湖 HTTP 请求客户端
 * 
 * 封装通用的 HTTP 请求逻辑
 * 提供 get/post/delete 等标准 HTTP 方法
 */
class LanhuRequest {
  private cookie: string;
  private ddsCookie: string;
  private baseUrl: string;
  private ddsBaseUrl: string;
  private cdnUrl: string;
  private timeout: number;

  /**
   * 创建请求客户端实例
   * @param config 请求配置
   */
  constructor(config: RequestConfig) {
    this.cookie = config.cookie;
    this.ddsCookie = config.ddsCookie || config.cookie;
    this.baseUrl = config.baseUrl;
    this.ddsBaseUrl = config.ddsBaseUrl;
    this.cdnUrl = config.cdnUrl;
    this.timeout = config.timeout;
  }

  // ============================================================
  // 核心 HTTP 方法
  // ============================================================

  /**
   * 发送 GET 请求
   * @param path 请求路径（可以是完整 URL 或相对路径）
   * @param params 查询参数
   * @returns HTTP 响应
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  /**
   * 发送 POST 请求
   * @param path 请求路径
   * @param body 请求体
   * @returns HTTP 响应
   */
  async post<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * 发送 DELETE 请求
   * @param path 请求路径
   * @param params 查询参数
   * @returns HTTP 响应
   */
  async delete<T>(path: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, undefined, params);
  }

  /**
   * 发送 PUT 请求
   * @param path 请求路径
   * @param body 请求体
   * @returns HTTP 响应
   */
  async put<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * 发送 PATCH 请求
   * @param path 请求路径
   * @param body 请求体
   * @returns HTTP 响应
   */
  async patch<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 将请求头对象转换为 Record<string, string>
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
   * 判断是否需要使用 DDS Cookie
   */
  private useDdsCookie(path: string): boolean {
    return path.includes('dds.lanhuapp.com') || path.startsWith(this.ddsBaseUrl);
  }

  /**
   * 获取当前请求应使用的 Cookie
   */
  private getCookieForRequest(path: string): string {
    if (this.useDdsCookie(path)) {
      return this.ddsCookie || this.cookie;
    }
    return this.cookie;
  }

  /**
   * 构建完整 URL
   * @param path 请求路径
   * @param queryParams 查询参数
   * @returns 完整 URL 字符串
   */
  private buildUrl(path: string, queryParams?: Record<string, string>): string {
    let url: string;
    
    // 解析 URL
    if (path.startsWith('http')) {
      url = path;
    } else if (path.startsWith('/')) {
      url = this.baseUrl + path;
    } else if (path.startsWith(this.ddsBaseUrl) || path.startsWith(this.cdnUrl)) {
      url = path;
    } else {
      url = this.baseUrl + '/' + path;
    }

    // 添加查询参数
    if (queryParams && Object.keys(queryParams).length > 0) {
      const separator = url.includes('?') ? '&' : '?';
      const queryStr = Object.entries(queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      url = url + separator + queryStr;
    }

    return url;
  }

  /**
   * 构建请求头
   * @param url 请求 URL
   * @param method HTTP 方法
   * @returns 请求头对象
   */
  private buildHeaders(url: string, method: string, hasBody: boolean): RequestHeaders {
    const headers: RequestHeaders = {
      'User-Agent': 'dz-lanhu-mcp/1.0.0',
      'Accept': 'application/json',
    };
    
    if (hasBody) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    
    // 添加 Cookie
    const cookieValue = this.getCookieForRequest(url);
    if (cookieValue && cookieValue !== 'your_lanhu_cookie_here') {
      headers['Cookie'] = cookieValue;
    }
    
    return headers;
  }

  /**
   * 构建 HTTP 请求选项
   * @param url 完整 URL
   * @param method HTTP 方法
   * @param headers 请求头
   * @returns 请求选项
   */
  private buildRequestOptions(url: string, method: string, headers: RequestHeaders): RequestOptions {
    const parsedUrl = new URL(url);
    
    return {
      method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      headers,
      timeout: this.timeout,
    };
  }

  /**
   * 解析 HTTP 响应
   * @param res Node.js HTTP 响应对象
   * @param bodyBuffer 响应体 Buffer
   * @param startTime 请求开始时间
   * @returns 解析后的响应对象
   */
  private parseResponse<T>(
    res: import('http').IncomingMessage,
    bodyBuffer: Buffer,
    startTime: number,
  ): HttpResponse<T> {
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
    const bodyStr = bodyBuffer.toString('utf-8');
    const contentType = normalizedHeaders['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(bodyStr) as T;
      } catch {
        data = bodyStr as unknown as T;
      }
    } else {
      data = bodyStr as unknown as T;
    }
    
    return {
      data,
      status: res.statusCode || 0,
      headers: normalizedHeaders,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 发送 HTTP 请求
   * @param options 请求选项
   * @param body 请求体
   * @param startTime 请求开始时间
   * @returns 响应对象 Promise
   */
  private async sendRequest<T>(
    options: RequestOptions,
    body: unknown,
    startTime: number,
  ): Promise<HttpResponse<T>> {
    const isHttps = options.port === 443 || options.hostname?.includes('https');
    const httpModule: any = isHttps ? await import('https') : await import('http');
    const httpMod = httpModule.default || httpModule;
    
    return new Promise((resolve, reject) => {
      const req = httpMod.request(options, (res: import('http').IncomingMessage) => {
        const chunks: Buffer[] = [];
        
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const bodyBuffer = Buffer.concat(chunks);
          resolve(this.parseResponse<T>(res, bodyBuffer, startTime));
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
   * 通用请求方法
   * @param method HTTP 方法
   * @param path 请求路径
   * @param body 请求体
   * @param queryParams 查询参数
   * @returns HTTP 响应
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    queryParams?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    
    // 构建 URL
    const url = this.buildUrl(path, queryParams);
    
    // 构建请求头
    const headers = this.buildHeaders(url, method, body !== undefined);
    
    // 构建请求选项
    const requestOptions = this.buildRequestOptions(url, method, headers);
    
    try {
      return await this.sendRequest<T>(requestOptions, body, startTime);
    } catch (error: unknown) {
      const err = error as { message: string; code?: string };
      const duration = Date.now() - startTime;
      
      // 记录超时错误
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new Error(`请求超时: ${method} ${url} (${this.timeout}ms)`);
      }
      
      // 记录连接重置错误
      if (err.code === 'ECONNRESET') {
        throw new Error('连接被重置，请检查 Cookie 是否有效');
      }
      
      throw new Error(`请求失败: ${err.message}`);
    }
  }

  // ============================================================
  // 文件下载方法
  // ============================================================

  /**
   * 下载单个文件为 Buffer
   * @param url 文件 URL
   * @returns 文件 Buffer
   */
  async downloadFile(url: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const parsedUrl = new URL(url);
    
    const headers: RequestHeaders = {
      'User-Agent': 'dz-lanhu-mcp/1.0.0',
    };
    
    // 添加 Cookie
    const cookieValue = this.getCookieForRequest(url);
    if (cookieValue && cookieValue !== 'your_lanhu_cookie_here') {
      headers['Cookie'] = cookieValue;
    }
    
    const isHttps = parsedUrl.protocol === 'https:';
    const mod: any = isHttps ? await import('https') : await import('http');
    const modActual = mod.default || mod;
    
    return new Promise((resolve, reject) => {
      const req = modActual.request({
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
   * 批量下载资源文件
   * @param fileList 文件列表 [{ path, md5 }]
   * @returns 文件内容映射表
   */
  async downloadResourceFiles(fileList: Array<{ path: string; md5: string }>): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();
    
    for (const file of fileList) {
      try {
        const url = `${this.cdnUrl}/${file.md5}`;
        const buffer = await this.downloadFile(url);
        results.set(file.path, buffer);
      } catch (error) {
        console.warn(`下载资源失败: ${file.path}`, error);
      }
    }
    
    return results;
  }

  // ============================================================
  // 访问器方法
  // ============================================================

  /**
   * 获取基础 URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 获取 DDS 基础 URL
   */
  getDdsBaseUrl(): string {
    return this.ddsBaseUrl;
  }

  /**
   * 获取 CDN URL
   */
  getCdnUrl(): string {
    return this.cdnUrl;
  }

  /**
   * 获取超时时间
   */
  getTimeout(): number {
    return this.timeout;
  }

  /**
   * 更新 Cookie
   * @param cookie 新的蓝湖 Cookie
   */
  updateCookie(cookie: string): void {
    this.cookie = cookie;
  }

  /**
   * 更新 DDS Cookie
   * @param cookie 新的 DDS Cookie
   */
  updateDdsCookie(cookie: string): void {
    this.ddsCookie = cookie;
  }
}

// ============================================================
// 导出
// ============================================================

export { LanhuRequest };

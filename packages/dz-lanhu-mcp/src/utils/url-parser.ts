/**
 * URL 解析工具
 * 
 * 提供蓝湖 URL 的解析和验证功能
 */

import type { ParsedLanhuUrl, LanhuUrlType } from '../types.js';
import { createMcpError, ErrorCode } from '../types.js';

/**
 * 验证是否是蓝湖 URL
 */
export function isLanhuUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('lanhuapp.com');
  } catch {
    return false;
  }
}

/**
 * 从蓝湖 URL 中提取查询参数
 */
export function getQueryParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * 从 URL 路径中提取 ID
 */
export function extractIdFromPath(url: string, pathSegment: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const index = pathParts.indexOf(pathSegment);
    if (index !== -1 && pathParts.length > index + 1) {
      return pathParts[index + 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 规范化蓝湖 URL
 */
export function normalizeLanhuUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * 将 RFC 2822 时间格式转换为中国时区 (UTC+8)
 */
export function formatLanhuTime(rfc2822String?: string): string | undefined {
  if (!rfc2822String || rfc2822String === 'your_lanhu_cookie_here') {
    return undefined;
  }
  
  try {
    const date = new Date(rfc2822String);
    if (isNaN(date.getTime())) {
      return rfc2822String;
    }
    const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.getFullYear().toString() +
      '-' +
      String(chinaTime.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(chinaTime.getDate()).padStart(2, '0') +
      ' ' +
      String(chinaTime.getHours()).padStart(2, '0') +
      ':' +
      String(chinaTime.getMinutes()).padStart(2, '0') +
      ':' +
      String(chinaTime.getSeconds()).padStart(2, '0');
  } catch {
    return rfc2822String;
  }
}

/**
 * 解析蓝湖 URL
 * 
 * 从 URL 中提取项目 ID、文档 ID、页面 ID 等信息
 * 支持多种 URL 格式：
 * - https://lanhuapp.com/web/#/item/project/product?tid=xxx&pid=xxx&docId=xxx&pageId=xxx
 * - https://lanhuapp.com/invite/xxx
 * - https://lanhuapp.com/product/<productId>
 * - https://lanhuapp.com/doc/<docId>/<productId>
 * - https://lanhuapp.com/design/<designId>
 * - https://lanhuapp.com/stage?pid=xxx
 * 
 * @param url - 蓝湖 URL 字符串
 * @returns 解析后的 URL 信息
 * @throws McpError 当 URL 无效或无法解析时
 */
export function parseLanhuUrl(url: string): ParsedLanhuUrl {
  // 基础验证
  if (!url || typeof url !== 'string') {
    throw createMcpError(ErrorCode.INVALID_URL, 'URL 不能为空');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw createMcpError(ErrorCode.URL_PARSE_FAILED, `URL 格式无效: ${url}`);
  }

  // 验证是否为蓝湖域名
  if (!parsed.hostname.includes('lanhuapp.com')) {
    throw createMcpError(ErrorCode.UNSUPPORTED_URL_TYPE, `不支持的域名: ${parsed.hostname}`);
  }

  const result: ParsedLanhuUrl = {
    url,
    type: 'product' as LanhuUrlType,
  };

  // 蓝湖 URL 查询参数可能在 hash 中，如: /web/#/item/project/product?tid=xxx&pid=xxx
  // 需要从 hash 中提取查询参数
  let hashParams: Record<string, string> = {};
  if (parsed.hash) {
    const hashQueryMatch = parsed.hash.match(/\?(.+)/);
    if (hashQueryMatch) {
      const hashQueryStr = hashQueryMatch[1];
      const params = new URLSearchParams(hashQueryStr);
      params.forEach((value, key) => {
        hashParams[key] = value;
      });
    }
  }

  // 优先从 URL 查询参数或 hash 参数中提取 tid, pid, docId, pageId, image_id
  const queryParams = parsed.searchParams;
  const getParam = (key: string) => queryParams.get(key) || hashParams[key] || undefined;

  const tid = getParam('tid');
  const pid = getParam('pid') || getParam('project_id');
  const docId = getParam('docId') || getParam('doc_id') || getParam('image_id');
  const pageId = getParam('pageId') || getParam('page_id');
  const stageId = getParam('stage_id');

  // 如果查询参数中有有效信息，优先使用这些参数
  if (tid || pid || docId || pageId) {
    result.teamId = tid || undefined;
    result.projectId = pid || undefined;
    result.docId = docId || undefined;
    result.pageId = pageId || undefined;

    // 如果只有 tid 和 pid，没有 docId，尝试从 API 获取文档信息
    if (tid && pid && !docId) {
      return result;
    }

    // 如果有 docId，确定这是产品文档类型
    if (docId) {
      result.type = 'product';
      return result;
    }
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);

  // 根据路径判断 URL 类型
  if (parsed.hostname.includes('lanhuapp.com')) {
    // 邀请链接: lanhuapp.com/invite/xxx
    if (pathParts.includes('invite')) {
      const inviteIndex = pathParts.indexOf('invite');
      if (inviteIndex !== -1 && pathParts.length > inviteIndex + 1) {
        result.type = 'invite';
        result.inviteCode = pathParts[inviteIndex + 1];
        return result;
      }
    }

    // 产品文档: lanhuapp.com/doc/xxx/xxx
    if (pathParts.includes('doc')) {
      const docIndex = pathParts.indexOf('doc');
      if (docIndex !== -1 && pathParts.length > docIndex + 2) {
        result.type = 'product';
        result.docId = pathParts[docIndex + 1];
        result.productId = pathParts[docIndex + 2];
        return result;
      }
    }

    // 阶段/设计稿: lanhuapp.com/stage?pid=xxx
    if (pathParts.includes('stage')) {
      result.type = 'stage';
      const pid = parsed.searchParams.get('pid');
      if (pid) {
        result.projectId = pid;
      }
      return result;
    }

    // 设计图: lanhuapp.com/design/xxx
    if (pathParts.includes('design')) {
      const designIndex = pathParts.indexOf('design');
      if (designIndex !== -1 && pathParts.length > designIndex + 1) {
        result.type = 'design';
        result.designId = pathParts[designIndex + 1];
        return result;
      }
    }
  }

  // 默认返回产品文档类型
  return result;
}

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
 * 解析蓝湖 URL
 * 
 * 从 URL 中提取项目 ID、文档 ID、页面 ID 等信息
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

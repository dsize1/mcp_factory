/**
 * URL 解析工具
 * 
 * 提供蓝湖 URL 的解析和验证功能
 */

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
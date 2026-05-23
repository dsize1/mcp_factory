/**
 * 产品文档 API
 * 
 * 负责与蓝湖产品文档相关的 API 交互
 * 包括：邀请链接解析、页面列表获取、页面内容分析
 */

import { lanhuApi } from './client.js';
import type {
  LanhuProduct,
  LanhuPage,
  LanhuPageDetail,
  ApiResponse,
} from '../types.js';
import { parseLanhuUrl as _parseLanhuUrl } from '../utils/url-parser.js';

/** 重新导出，供外部使用 */
export { _parseLanhuUrl as parseLanhuUrl };

/**
 * 解析蓝湖邀请链接
 */
export async function resolveInviteLink(url: string): Promise<ApiResponse> {
  // TODO: 实现邀请链接解析逻辑
  throw new Error('Not implemented: resolveInviteLink');
}

/**
 * 获取产品文档列表
 */
export async function getProductList(projectId: string): Promise<ApiResponse<LanhuProduct[]>> {
  // TODO: 实现产品文档列表获取
  throw new Error('Not implemented: getProductList');
}

/**
 * 获取原型页面列表
 */
export async function getPageList(docId: string): Promise<ApiResponse<LanhuPage[]>> {
  // TODO: 实现页面列表获取
  throw new Error('Not implemented: getPageList');
}

/**
 * 获取页面详细信息
 */
export async function getPageDetail(docId: string, pageId: string): Promise<ApiResponse<LanhuPageDetail>> {
  // TODO: 实现页面详情获取
  throw new Error('Not implemented: getPageDetail');
}

/**
 * 下载 Axure 资源文件
 */
export async function downloadAxureResources(docId: string): Promise<ApiResponse<string[]>> {
  // TODO: 实现 Axure 资源下载
  throw new Error('Not implemented: downloadAxureResources');
}
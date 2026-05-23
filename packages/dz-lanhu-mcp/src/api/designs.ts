/**
 * UI 设计稿 API
 * 
 * 负责与蓝湖 UI 设计稿相关的 API 交互
 * 包括：设计稿列表、设计图详情、切图信息等
 */

import type {
  LanhuDesign,
  LanhuDesignDetail,
  LanhuSlice,
  DesignParams,
  ApiResponse,
} from '../types.js';

/**
 * 获取设计稿列表
 */
export async function getDesignList(stageId: string): Promise<ApiResponse<LanhuDesign[]>> {
  // TODO: 实现设计稿列表获取
  throw new Error('Not implemented: getDesignList');
}

/**
 * 获取设计图详细信息
 */
export async function getDesignDetail(designId: string): Promise<ApiResponse<LanhuDesignDetail>> {
  // TODO: 实现设计图详情获取
  throw new Error('Not implemented: getDesignDetail');
}

/**
 * 获取设计图切图列表
 */
export async function getDesignSlices(designId: string): Promise<ApiResponse<LanhuSlice[]>> {
  // TODO: 实现切图列表获取
  throw new Error('Not implemented: getDesignSlices');
}

/**
 * 下载切图资源
 */
export async function downloadSlice(slice: LanhuSlice, outputDir?: string): Promise<string> {
  // TODO: 实现切图下载
  throw new Error('Not implemented: downloadSlice');
}

/**
 * 将设计图 Schema 转换为 HTML+CSS
 */
export async function convertSchemaToHtml(schema: Record<string, any>): Promise<{
  html: string;
  css: string;
}> {
  // TODO: 实现 Schema 到 HTML+CSS 的转换
  throw new Error('Not implemented: convertSchemaToHtml');
}

/**
 * 提取设计参数
 */
export async function extractDesignParams(schema: Record<string, any>): Promise<DesignParams> {
  // TODO: 实现设计参数提取
  throw new Error('Not implemented: extractDesignParams');
}
/**
 * TypeScript 类型定义
 * 
 * 定义本项目中使用的各种 TypeScript 接口和类型
 */

// ============================================================
// URL 解析类型
// ============================================================

/** 蓝湖 URL 类型 */
export type LanhuUrlType = 'invite' | 'product' | 'stage' | 'design';

/** 解析后的蓝湖 URL 信息 */
export interface ParsedLanhuUrl {
  /** URL 类型 */
  type: LanhuUrlType;
  /** 项目 ID */
  projectId?: string;
  /** 产品文档 ID */
  productId?: string;
  /** 文档 ID */
  docId?: string;
  /** 页面 ID */
  pageId?: string;
  /** 阶段/设计稿 ID */
  stageId?: string;
  /** 设计图 ID */
  designId?: string;
  /** 邀请码 */
  inviteCode?: string;
  /** 原始 URL */
  url: string;
}

// ============================================================
// 需求文档相关类型
// ============================================================

/** 产品文档信息 */
export interface LanhuProduct {
  /** 产品 ID */
  id: string;
  /** 产品名称 */
  name: string;
  /** 项目 ID */
  project_id: string;
  /** 项目/产品组 ID */
  product_group_id: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 文档状态 */
  status: number;
}

/** 原型页面信息 */
export interface LanhuPage {
  /** 页面 ID */
  id: string;
  /** 页面名称 */
  name: string;
  /** 页面排序 */
  index: number;
  /** 页面类型 */
  type: string;
  /** 是否是首页 */
  is_home: boolean;
  /** 页面截图 URL */
  screenshot_url?: string;
  /** 页面宽度 */
  width?: number;
  /** 页面高度 */
  height?: number;
}

/** 原型页面详细信息 */
export interface LanhuPageDetail {
  /** 页面基本信息 */
  page: LanhuPage;
  /** 页面 HTML 内容 */
  html: string;
  /** 页面交互数据 */
  data?: Record<string, any>;
  /** 资源列表 */
  resources?: LanhuResource[];
}

// ============================================================
// UI 设计稿相关类型
// ============================================================

/** 设计稿信息 */
export interface LanhuDesign {
  /** 设计稿 ID */
  id: string;
  /** 设计稿名称 */
  name: string;
  /** 项目 ID */
  project_id: string;
  /** 阶段 ID */
  stage_id: string;
  /** 创建者 ID */
  creator_id: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 缩略图 URL */
  thumb_url?: string;
  /** 原始图 URL */
  original_url?: string;
}

/** 设计稿详细信息 */
export interface LanhuDesignDetail {
  /** 设计稿基本信息 */
  design: LanhuDesign;
  /** 设计稿 Schema（包含图层信息） */
  schema: Record<string, any>;
  /** 预览图片 URL */
  preview_url?: string;
  /** 切图列表 */
  slices?: LanhuSlice[];
  /** 设计参数 */
  designParams?: DesignParams;
}

/** 设计参数（尺寸、间距、颜色等） */
export interface DesignParams {
  /** 组件尺寸 */
  dimensions: {
    width: number;
    height: number;
  };
  /** 间距 */
  spacing: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
  };
  /** 颜色 */
  colors: Array<{
    property: string;
    value: string;
  }>;
  /** 字体 */
  fonts: Array<{
    property: string;
    value: string;
    size: number;
    weight: string;
    lineHeight: number;
  }>;
}

/** 切图信息 */
export interface LanhuSlice {
  /** 切图 ID */
  id: string;
  /** 切图名称 */
  name: string;
  /** 图层路径 */
  layer_path: string;
  /** 切图 URL */
  url: string;
  /** 切图宽度 */
  width: number;
  /** 切图高度 */
  height: number;
  /** 切图格式 */
  format?: string;
  /** 缩放比例 */
  scale?: number;
  /** 语义化文件名 */
  semanticName?: string;
}

// ============================================================
// Axure 资源相关类型
// ============================================================

/** Axure 资源文件 */
export interface LanhuResource {
  /** 资源文件路径 */
  path: string;
  /** 资源文件 URL */
  url: string;
  /** 资源类型 (css/js/image/etc) */
  type: string;
  /** 资源大小 */
  size?: number;
}

// ============================================================
// 团队协作留言相关类型
// ============================================================

/** 留言信息 */
export interface LanhuMessage {
  /** 留言 ID */
  id: string;
  /** 项目 ID */
  project_id: string;
  /** 文档 ID */
  doc_id?: string;
  /** 留言摘要 */
  summary: string;
  /** 留言内容 */
  content: string;
  /** 留言类型 */
  type: 'normal' | 'task' | 'question' | 'urgent' | 'knowledge';
  /** 发布用户 */
  author: string;
  /** 被提醒用户列表 */
  mentions?: string[];
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/** 发布留言请求参数 */
export interface SayMessageParams {
  /** 项目或文档 URL */
  url: string;
  /** 留言摘要 */
  summary: string;
  /** 留言内容 */
  content: string;
  /** 提醒的用户名 */
  mentions?: string[];
  /** 留言类型 */
  type?: 'normal' | 'task' | 'question' | 'urgent' | 'knowledge';
}

/** 查看留言列表请求参数 */
export interface ListMessagesParams {
  /** 项目或文档 URL，使用 "all" 搜索全局 */
  url: string;
  /** 按类型筛选 */
  type?: 'normal' | 'task' | 'question' | 'urgent' | 'knowledge';
  /** 正则搜索关键词 */
  search?: string;
  /** 返回数量限制 */
  limit?: number;
}

/** 编辑留言请求参数 */
export interface EditMessageParams {
  /** 项目或文档 URL */
  url: string;
  /** 留言 ID */
  messageId: string;
  /** 新的留言摘要 */
  summary: string;
  /** 新的留言内容 */
  content: string;
}

// ============================================================
// 协作者相关类型
// ============================================================

/** 协作者信息 */
export interface LanhuCollaborator {
  /** 用户 ID */
  id: string;
  /** 用户名称 */
  name: string;
  /** 用户角色 */
  role?: string;
  /** 头像 URL */
  avatar_url?: string;
  /** 首次访问时间 */
  first_seen?: string;
  /** 最后访问时间 */
  last_seen?: string;
}

/** 项目成员信息 */
export interface LanhuMember {
  /** 成员 ID */
  id: string;
  /** 成员名称 */
  name: string;
  /** 成员角色 */
  role?: string;
  /** 邮箱 */
  email?: string;
  /** 头像 URL */
  avatar_url?: string;
}

// ============================================================
// 错误类型
// ============================================================

/** McpError 类型标记 Symbol */
export const MCP_ERROR_TAG = Symbol('McpError');

/** 错误码枚举 */
export enum ErrorCode {
  // 通用错误 (1000-1099)
  INVALID_PARAMS = 'INVALID_PARAMS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  // URL 解析错误 (1100-1199)
  INVALID_URL = 'INVALID_URL',
  URL_PARSE_FAILED = 'URL_PARSE_FAILED',
  UNSUPPORTED_URL_TYPE = 'UNSUPPORTED_URL_TYPE',

  // API 请求错误 (1200-1299)
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  REQUEST_FAILED = 'REQUEST_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  HTTP_ERROR = 'HTTP_ERROR',

  // Cookie 相关错误 (1300-1399)
  COOKIE_INVALID = 'COOKIE_INVALID',
  COOKIE_EXPIRED = 'COOKIE_EXPIRED',

  // 缓存错误 (1400-1499)
  CACHE_READ_FAILED = 'CACHE_READ_FAILED',
  CACHE_WRITE_FAILED = 'CACHE_WRITE_FAILED',
  CACHE_EXPIRED = 'CACHE_EXPIRED',

  // 文件操作错误 (1500-1599)
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  FILE_READ_FAILED = 'FILE_READ_FAILED',

  // 业务逻辑错误 (2000-2999)
  DESIGN_NOT_FOUND = 'DESIGN_NOT_FOUND',
  PAGE_NOT_FOUND = 'PAGE_NOT_FOUND',
  MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
  SLICE_NOT_FOUND = 'SLICE_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
}

/** 统一错误类型 */
export interface McpError {
  /** MCP 错误类型标记 */
  [MCP_ERROR_TAG]: true;
  /** 错误码 */
  code: ErrorCode;
  /** 错误消息 */
  message: string;
  /** 详细信息（调试用） */
  details?: Record<string, unknown>;
  /** 原始错误 */
  cause?: Error;
  /** 时间戳 */
  timestamp: number;
}

/** 错误工厂函数 */
export function createMcpError(
  code: ErrorCode,
  message: string,
  options: { details?: Record<string, unknown>; cause?: Error } = {}
): McpError {
  return {
    [MCP_ERROR_TAG]: true,
    code,
    message,
    details: options.details,
    cause: options.cause,
    timestamp: Date.now(),
  };
}

/** 将 McpError 转换为普通 Error */
export function mcpErrorToError(error: McpError): Error {
  const err: McpError & Error = Object.assign(new Error(error.message), error);
  err.name = error.code;
  return err as Error;
}

/** 判断是否为 McpError */
export function isMcpError(error: unknown): error is McpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    MCP_ERROR_TAG in error &&
    (error as Record<typeof MCP_ERROR_TAG, unknown>)[MCP_ERROR_TAG] === true &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

// ============================================================
// API 响应类型
// ============================================================

/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** HTTP 状态码 */
  statusCode: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

// ============================================================
// 缓存相关类型
// ============================================================

/** 缓存项 */
export interface CacheItem<T> {
  /** 缓存数据 */
  data: T;
  /** 缓存时间 */
  timestamp: number;
  /** 版本号（用于增量更新判断） */
  version?: string;
  /** 是否过期 */
  expiresAt?: number;
}

/** 缓存元数据 */
export interface CacheMetadata {
  /** 最后更新时间 */
  lastUpdated: string;
  /** 缓存版本 */
  version?: string;
  /** 缓存大小（字节） */
  size: number;
}

// ============================================================
// 截图相关类型
// ============================================================

/** 截图配置 */
export interface ScreenshotConfig {
  /** 视口宽度 */
  viewportWidth: number;
  /** 视口高度 */
  viewportHeight: number;
  /** 是否全屏截图 */
  fullPage: boolean;
  /** 截图等待时间（毫秒） */
  waitForTimeout?: number;
  /** 截图格式 */
  format?: 'png' | 'jpeg' | 'webp';
  /** 截图质量（仅 jpeg/webp） */
  quality?: number;
}

/** 截图结果 */
export interface ScreenshotResult {
  /** 截图数据（Base64） */
  data: string;
  /** 截图格式 */
  format: string;
  /** 截图宽度 */
  width: number;
  /** 截图高度 */
  height: number;
}

// ============================================================
// 工具调用参数类型
// ============================================================

/** 解析邀请链接参数 */
export interface ResolveInviteLinkParams {
  url: string;
}

/** 获取页面列表参数 */
export interface GetPagesParams {
  url: string;
}

/** 分析页面参数 */
export interface AnalyzePageParams {
  url: string;
  pageId: string;
  mode?: 'development' | 'testing' | 'explore';
}

/** 获取设计稿列表参数 */
export interface GetDesignsParams {
  url: string;
}

/** 分析设计图参数 */
export interface AnalyzeDesignParams {
  url: string;
  designId: string;
}

/** 获取切图参数 */
export interface GetSlicesParams {
  url: string;
  designId: string;
  outputDir?: string;
}

/** 查看协作者参数 */
export interface GetMembersParams {
  url: string;
}
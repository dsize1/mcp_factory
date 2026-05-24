/**
 * dz-lanhu-mcp - 蓝湖 MCP 服务器
 * 
 * TypeScript 重构版蓝湖 MCP 服务器，用于解析蓝湖设计稿和需求文档。
 * 基于 mcp-dev-tools (FastMCPServer) 框架构建。
 * 
 * @module dz-lanhu-mcp
 */

import { FastMCPServer, runServer } from 'mcp-dev-tools';
import { config } from './config.js';
import { createResolveLinkTool } from './tools/resolve-link.js';
import { createGetPagesTool } from './tools/get-pages.js';
import { createGetDesignsTool } from './tools/get-designs.js';
import { createGetSlicesTool } from './tools/get-slices.js';

// ============================================================
// 创建服务器实例
// ============================================================

const server = new FastMCPServer({
  name: 'dz-lanhu-mcp',
  version: '1.0.0',
  description: '蓝湖 MCP 服务器 - 解析蓝湖设计稿和需求文档的 TypeScript 重构版',
});

// ============================================================
// 工具注册（待实现）
// ============================================================

/**
 * 注册所有 MCP 工具
 * 以下为项目规划的工具列表，具体实现待开发
 */
function registerAllTools(): void {
  // --- 需求文档分析工具 ---
  
  // 解析蓝湖邀请链接
  server.registerTool(createResolveLinkTool());

  // 获取原型页面列表
  server.registerTool(createGetPagesTool());

  // 分析原型页面内容
  // server.registerTool({
  //   name: 'lanhu_get_ai_analyze_page_result',
  //   description: '分析原型页面内容，支持开发/测试/探索三种模式',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '需求文档 URL' },
  //       pageId: { type: 'string', description: '页面 ID' },
  //       mode: { 
  //         type: 'string', 
  //         enum: ['development', 'testing', 'explore'],
  //         description: '分析模式：development=开发视角, testing=测试视角, explore=快速探索'
  //       },
  //     },
  //     required: ['url', 'pageId'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现页面分析逻辑
  //     return {};
  //   },
  // });

  // --- UI 设计支持工具 ---

  // 获取设计稿列表
  server.registerTool(createGetDesignsTool());

  // 分析设计图
  // server.registerTool({
  //   name: 'lanhu_get_ai_analyze_design_result',
  //   description: '分析 UI 设计图，获取详细设计参数和 HTML+CSS 代码',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '设计稿 URL' },
  //       designId: { type: 'string', description: '设计图 ID' },
  //     },
  //     required: ['url', 'designId'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现设计图分析逻辑
  //     return {};
  //   },
  // });

  // 获取切图信息
  server.registerTool(createGetSlicesTool());

  // --- 团队协作留言板工具 ---

  // 发布留言
  // server.registerTool({
  //   name: 'lanhu_say',
  //   description: '发布团队协作留言，支持 @提醒和飞书通知',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '项目或文档 URL' },
  //       summary: { type: 'string', description: '留言摘要' },
  //       content: { type: 'string', description: '留言内容' },
  //       mention: { type: 'string', description: '提醒的用户名' },
  //       type: { 
  //         type: 'string', 
  //         enum: ['normal', 'task', 'question', 'urgent', 'knowledge'],
  //         description: '留言类型'
  //       },
  //     },
  //     required: ['url', 'summary', 'content'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现发布留言逻辑
  //     return {};
  //   },
  // });

  // 查看留言列表
  // server.registerTool({
  //   name: 'lanhu_say_list',
  //   description: '查看团队协作留言列表，支持筛选和搜索',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '项目或文档 URL，使用 "all" 搜索全局' },
  //       type: { 
  //         type: 'string', 
  //         enum: ['normal', 'task', 'question', 'urgent', 'knowledge'],
  //         description: '按类型筛选'
  //       },
  //       search: { type: 'string', description: '正则搜索关键词' },
  //       limit: { type: 'number', description: '返回数量限制' },
  //     },
  //     required: ['url'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现留言列表逻辑
  //     return {};
  //   },
  // });

  // 查看留言详情
  // server.registerTool({
  //   name: 'lanhu_say_detail',
  //   description: '查看留言完整内容',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '项目或文档 URL' },
  //       messageId: { type: 'string', description: '留言 ID' },
  //     },
  //     required: ['url', 'messageId'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现留言详情逻辑
  //     return {};
  //   },
  // });

  // 编辑留言
  // server.registerTool({
  //   name: 'lanhu_say_edit',
  //   description: '编辑已发布的留言',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '项目或文档 URL' },
  //       messageId: { type: 'string', description: '留言 ID' },
  //       summary: { type: 'string', description: '新的留言摘要' },
  //       content: { type: 'string', description: '新的留言内容' },
  //     },
  //     required: ['url', 'messageId', 'summary', 'content'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现编辑留言逻辑
  //     return {};
  //   },
  // });

  // 删除留言
  // server.registerTool({
  //   name: 'lanhu_say_delete',
  //   description: '删除已发布的留言',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '项目或文档 URL' },
  //       messageId: { type: 'string', description: '留言 ID' },
  //     },
  //     required: ['url', 'messageId'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现删除留言逻辑
  //     return {};
  //   },
  // });

  // 查看协作者
  // server.registerTool({
  //   name: 'lanhu_get_members',
  //   description: '查看项目协作者列表及访问记录',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       url: { type: 'string', description: '项目 URL' },
  //     },
  //     required: ['url'],
  //   },
  //   handler: async (params) => {
  //     // TODO: 实现协作者查询逻辑
  //     return {};
  //   },
  // });
}

// ============================================================
// 资源注册（待实现）
// ============================================================

/**
 * 注册所有 MCP 资源
 * 以下为项目规划的资源列表，具体实现待开发
 */
function registerAllResources(): void {
  // 设计图预览资源（待实现）
  // server.registerResource({
  //   uri: 'design://{designId}/preview',
  //   name: 'Design Preview',
  //   mimeType: 'image/png',
  //   description: '设计图预览图片',
  //   read: async () => {
  //     // TODO: 实现设计图预览逻辑
  //     return '';
  //   },
  // });

  // 页面截图资源（待实现）
  // server.registerResource({
  //   uri: 'screenshot://{pageId}',
  //   name: 'Page Screenshot',
  //   mimeType: 'image/png',
  //   description: 'Axure 页面截图',
  //   read: async () => {
  //     // TODO: 实现页面截图逻辑
  //     return '';
  //   },
  // });
}

// ============================================================
// 初始化
// ============================================================

// 注册所有工具和资源
registerAllTools();
registerAllResources();

// 启动服务器
if (import.meta.url === `file://${process.argv[2]}` || process.argv[1]?.endsWith('index.js')) {
  runServer(server).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// 导出服务器实例（用于测试）
export { server, config };
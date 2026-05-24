/**
 * 蓝湖 HTTP 客户端
 * 
 * 封装与蓝湖 API 的所有 HTTP 通信
 * 基于 Python 参考实现 (lanhu_mcp_server.py) 的 TypeScript 移植
 * 
 * 核心 HTTP 请求逻辑已移至 request.ts 中的 LanhuRequest 类
 */

import { config, BASE_URL, DDS_BASE_URL, CDN_URL } from '../config.js';
import { formatLanhuTime, parseLanhuUrl } from '../utils/url-parser.js';
import { LanhuRequest } from './request.js';
import type {
  ParsedLanhuUrl,
  LanhuProduct,
  LanhuPage,
  LanhuPageDetail,
  LanhuDesign,
  LanhuDesignDetail,
  LanhuSlice,
  LanhuResource,
  LanhuMessage,
  LanhuCollaborator,
  LanhuMember,
  ApiResponse,
  PaginatedResponse,
  HttpResponse,
  ProjectInfo,
  ProductDocument,
  DocVersion,
  DocInfo,
  SliceInfo,
  SketchData,
  SketchLayer,
  LanhuApiResponse,
  DesignApiResponse,
  MessageApiResponse,
  InviteLinkInfo,
  // Client 方法返回类型
  ProjectMembersResult,
  ProductDocumentsResult,
  ProductDetailResult,
  DesignSlicesResult,
  MessageActionResult,
  InviteLinkInfoResult,
  PagesListResult,
  LanhuSitemapPage,
} from '../types.js';

// ============================================================
// LanhuAPIClient 类
// ============================================================

/**
 * 蓝湖 API 客户端
 * 
 * 封装与蓝湖 API 的所有 HTTP 通信
 * 基于 Python LanhuExtractor 类的 TypeScript 实现
 * 
 * 核心 HTTP 请求由 LanhuRequest 实例处理
 */
class LanhuAPIClient {
  /** HTTP 请求客户端实例 */
  private request: LanhuRequest;

  constructor() {
    // 创建请求客户端实例
    this.request = new LanhuRequest({
      cookie: config.lanhuCookie,
      ddsCookie: config.ddsCookie,
      baseUrl: BASE_URL,
      ddsBaseUrl: DDS_BASE_URL,
      cdnUrl: CDN_URL,
      timeout: (config.httpTimeout || 30) * 1000,
    });
  }

  // ============================================================
  // URL 解析
  // ============================================================

  /**
   * 解析蓝湖 URL，提取项目、产品、文档等信息
   */
  parseUrl(url: string): ParsedLanhuUrl {
    return parseLanhuUrl(url);
  }

  // ============================================================
  // 项目/产品 API
  // ============================================================

  /**
   * 获取项目信息
   * API: GET /api/project/info
   */
  async getProjectInfo(projectId: string, teamId?: string): Promise<ProjectInfo> {
    const params: Record<string, string> = { project_id: projectId };
    if (teamId) {
      params.team_id = teamId;
    }
    
    const response = await this.request.get<LanhuApiResponse<ProjectInfo>>('api/project/info', params);
    const result = response.data as LanhuApiResponse<ProjectInfo>;
    
    if (result.code !== '00000') {
      throw new Error(`获取项目信息失败: ${result.msg}`);
    }
    
    return result.result;
  }

  /**
   * 获取项目成员列表
   * API: GET /api/project/multi_info
   */
  async getProjectMembers(projectId: string, teamId?: string): Promise<ProjectMembersResult> {
    const params: Record<string, string> = {
      project_id: projectId,
      doc_info: '1',
      member_info: '1',
    };
    if (teamId) {
      params.team_id = teamId;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/multi_info', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取项目成员失败: ${result.msg}`);
    }
    
    const data = result.result;
    const members: LanhuMember[] = [];
    const collaborators: LanhuCollaborator[] = [];
    
    // 解析成员信息
    if (data.members && Array.isArray(data.members)) {
      for (const m of data.members) {
        members.push({
          id: m.user_id || m.id || '',
          name: m.user_name || m.name || '',
          role: m.role,
          email: m.email,
          avatar_url: m.avatar_url,
        });
      }
    }
    
    // 解析协作者访问记录
    if (data.access_records && Array.isArray(data.access_records)) {
      for (const c of data.access_records) {
        collaborators.push({
          id: c.user_id || c.id || '',
          name: c.user_name || c.name || '',
          role: c.role,
          avatar_url: c.avatar_url,
          first_seen: c.first_seen,
          last_seen: c.last_seen,
        });
      }
    }
    
    return { members, collaborators, projectInfo: data };
  }

  /**
   * 获取项目下的产品文档列表
   * API: GET /api/project/v2/resources
   */
  async listProductDocuments(projectId: string, teamId?: string): Promise<ProductDocumentsResult> {
    const params: Record<string, string> = {
      project_id: projectId,
      batch: '2019,2020,2021,2022,2023,2024,2025',
      doc_info: '1',
      doc_status: '1',
      type: 'prddoc',
    };
    if (teamId) {
      params.team_id = teamId;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/v2/resources', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取产品文档列表失败: ${result.msg}`);
    }
    
    const data = result.result;
    const resources = data.resources || [];
    
    // 过滤出产品文档（排除子产品组）
    const documents: ProductDocument[] = [];
    for (const resource of resources) {
      // 跳过子产品组（type=product_group 且 is_sub=1）
      if (resource.type === 'product_group' && resource.is_sub === 1) {
        continue;
      }
      
      documents.push({
        id: resource.id,
        name: resource.name || resource.title || '未命名',
        type: resource.type || 'prddoc',
        status: resource.status || 1,
        created_at: formatLanhuTime(resource.created_at),
        updated_at: formatLanhuTime(resource.updated_at),
        creator: resource.creator || resource.user_info,
      });
    }
    
    return {
      documents,
      defaultGroupId: data.default_group_id,
      needGroup: data.need_group,
      total: documents.length,
    };
  }

  /**
   * 获取文档信息和版本
   * API: GET /api/project/doc_versions
   */
  async getDocumentInfo(projectId: string, docId?: string): Promise<DocInfo> {
    const params: Record<string, string> = { project_id: projectId };
    if (docId) {
      params.doc_id = docId;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/doc_versions', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取文档信息失败: ${result.msg}`);
    }
    
    const data = result.result;
    const versions: DocVersion[] = [];
    
    if (data.versions && Array.isArray(data.versions)) {
      for (const v of data.versions) {
        versions.push({
          id: v.id,
          version_info: v.version_info,
          json_url: v.json_url,
          created_at: v.created_at,
        });
      }
    }
    
    return {
      id: data.id || docId || '',
      name: data.name || '未命名文档',
      type: data.type || 'axure',
      versions,
      create_time: data.create_time,
      update_time: data.update_time,
    };
  }

  /**
   * 获取产品文档详情
   * API: GET /api/project/doc_versions
   */
  async getProductDetail(productId: string, teamId?: string, projectId?: string): Promise<ProductDetailResult> {
    const project_Id = projectId || teamId;
    const params: Record<string, string> = { doc_id: productId };
    if (project_Id) {
      params.project_id = project_Id;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/doc_versions', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取产品详情失败: ${result.msg}`);
    }
    
    const data = result.result;
    
    return {
      id: data.id || productId,
      name: data.name || '未命名',
      type: data.type || 'axure',
      pages: [], // 需要另外调用获取页面列表
      createdAt: data.create_time,
      updatedAt: data.update_time,
    };
  }

  // ============================================================
  // 页面/原型 API
  // ============================================================

  /**
   * 获取页面 HTML 内容
   * CDN: GET https://axure-file.lanhuapp.com/{md5}
   */
  async getPageHtml(md5OrUrl: string): Promise<string> {
    let url: string;
    
    if (md5OrUrl.startsWith('http')) {
      url = md5OrUrl;
    } else {
      url = `${CDN_URL}/${md5OrUrl}`;
    }
    
    const response = await this.request.get<string>(url);
    return response.data as unknown as string;
  }

  /**
   * 下载资源文件
   * CDN: GET https://axure-file.lanhuapp.com/{md5}
   */
  async downloadResourceFiles(fileList: Array<{ path: string; md5: string }>): Promise<Map<string, Buffer>> {
    return this.request.downloadResourceFiles(fileList);
  }

  /**
   * 下载单个文件
   */
  async downloadFile(url: string): Promise<Buffer> {
    return this.request.downloadFile(url);
  }

  // ============================================================
  // UI 设计稿 API
  // ============================================================

  /**
   * 获取设计稿列表
   * API: GET /api/project/stage_design
   */
  async getDesignsList(stageId: string, teamId?: string, projectId?: string): Promise<LanhuDesign[]> {
    const params: Record<string, string> = {
      stage_id: stageId,
      status: '1',
      page_no: '1',
      page_size: '1000',
    };
    if (teamId) {
      params.team_id = teamId;
    }
    if (projectId) {
      params.project_id = projectId;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/stage_design', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取设计稿列表失败: ${result.msg}`);
    }
    
    const data = result.result;
    const designs: LanhuDesign[] = [];
    
    if (data.list && Array.isArray(data.list)) {
      for (const d of data.list) {
        designs.push({
          id: d.id,
          name: d.name,
          project_id: d.project_id,
          stage_id: d.stage_id,
          creator_id: d.creator_id,
          created_at: formatLanhuTime(d.created_at),
          updated_at: formatLanhuTime(d.updated_at),
          thumb_url: d.thumb_url,
          original_url: d.original_url,
        });
      }
    }
    
    return designs;
  }

  /**
   * 获取设计稿详情
   * API: GET /api/project/image
   */
  async getDesignDetail(imageId: string, teamId?: string, projectId?: string): Promise<LanhuDesignDetail> {
    const params: Record<string, string> = {
      dds_status: '1',
      image_id: imageId,
    };
    if (teamId) {
      params.team_id = teamId;
    }
    if (projectId) {
      params.project_id = projectId;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/image', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取设计稿详情失败: ${result.msg}`);
    }
    
    const data = result.result;
    
    // 获取 JSON URL
    const versions = data.versions || [];
    if (versions.length === 0) {
      throw new Error('设计稿版本信息不存在');
    }
    
    const latestVersion = versions[0];
    
    return {
      design: {
        id: data.id,
        name: data.name,
        project_id: data.project_id,
        stage_id: data.stage_id,
        creator_id: data.creator_id,
        created_at: formatLanhuTime(data.created_at),
        updated_at: formatLanhuTime(data.updated_at),
        thumb_url: data.thumb_url,
        original_url: data.original_url,
      },
      schema: {}, // 需要从 json_url 获取
      preview_url: latestVersion.json_url,
    };
  }

  /**
   * 获取设计图的切图信息
   * API: GET /api/project/image + JSON URL
   * 对应 Python: get_design_slices_info
   */
  async getDesignSlicesInfo(imageId: string, teamId?: string, projectId?: string, includeMetadata: boolean = true): Promise<DesignSlicesResult> {
    // 1. 获取设计图详情
    const params: Record<string, string> = {
      dds_status: '1',
      image_id: imageId,
    };
    if (teamId) {
      params.team_id = teamId;
    }
    if (projectId) {
      params.project_id = projectId;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/image', params);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取设计图失败: ${result.msg}`);
    }
    
    const data = result.result;
    const versions = data.versions || [];
    
    if (versions.length === 0) {
      throw new Error('设计稿版本信息不存在');
    }
    
    const latestVersion = versions[0];
    const jsonUrl = latestVersion.json_url;
    
    // 2. 下载并解析 Sketch/Figma JSON
    const jsonResponse = await this.request.get<any>(jsonUrl);
    const sketchData = jsonResponse.data as SketchData;
    
    // 获取 sliceScale
    const meta = sketchData.meta || {};
    const sliceScale = Number(
      sketchData.sliceScale ||
      sketchData.exportScale ||
      meta.sliceScale ||
      2
    );
    
    // 判断是否为 Figma 设计
    const hostName = (meta.host || {}).name || '';
    const isFigma = hostName === 'figma';
    
    const slices: SliceInfo[] = [];
    
    // 3. 递归提取所有切图
    const layers = sketchData.layers || sketchData.artboard?.layers || [];
    
    const findSlices = (obj: SketchLayer | undefined, parentName: string, layerPath: string) => {
      if (!obj || typeof obj !== 'object') return;
      
      const currentName = obj.name || '';
      const currentPath = layerPath ? `${layerPath}/${currentName}` : currentName;
      
      // Figma: 检查 image 字段 (bitmapLayer + hasExportImage)
      if (obj.image && (obj.image.imageUrl || obj.image.svgUrl)) {
        if (isFigma && !obj.hasExportImage) {
          // Figma 图片填充层，不是切图
          return;
        }
        
        const imageData = obj.image;
        const downloadUrl = imageData.imageUrl || imageData.svgUrl || '';
        
        if (downloadUrl) {
          const imgSize = imageData.size || { width: 0, height: 0 };
          const logicalW = imgSize.width || 0;
          const logicalH = imgSize.height || 0;
          
          slices.push({
            id: currentName,
            name: currentName,
            layerPath: currentPath,
            url: downloadUrl,
            width: logicalW,
            height: logicalH,
            formats: this.buildScaleUrls(downloadUrl, logicalW, logicalH, sliceScale),
          });
        }
      }
      
      // 旧版 Sketch: 检查 ddsImage 字段
      const ddsImage = obj.ddsImage;
      if (ddsImage && typeof ddsImage.imageUrl === 'string') {
        const imageUrl = ddsImage.imageUrl;
        const imgSize = ddsImage.size || { width: 0, height: 0 };
        const baseW = imgSize.width || 0;
        const baseH = imgSize.height || 0;
        
        slices.push({
          id: currentName,
          name: currentName,
          layerPath: currentPath,
          url: imageUrl,
          width: baseW,
          height: baseH,
          formats: this.buildPsScaleUrls(imageUrl, baseW, baseH),
        });
      }
      
      // 递归处理子图层
      const childLayers = obj.layers || [];
      for (const child of childLayers) {
        findSlices(child, currentName, currentPath);
      }
    };
    
    for (const layer of layers) {
      findSlices(layer, '', '');
    }
    
    return {
      designId: data.id || imageId,
      designName: data.name || '未命名设计',
      slices,
      totalSlices: slices.length,
    };
  }

  /**
   * 生成多倍图下载 URL（OSS image/resize）
   * 对应 Python: _build_scale_urls
   */
  private buildScaleUrls(imageUrl: string, logicalW: number, logicalH: number, sliceScale: number): Record<string, string> {
    if (!imageUrl || !logicalW || !logicalH) return {};
    
    const lw = Math.max(1, Math.round(logicalW));
    const lh = Math.max(1, Math.round(logicalH));
    const storedW = lw * sliceScale;
    const storedH = lh * sliceScale;
    
    const makeUrl = (w: number, h: number): string => {
      w = Math.max(1, w);
      h = Math.max(1, h);
      if (w === storedW && h === storedH) return imageUrl;
      return `${imageUrl}?x-oss-process=image/resize,w_${w},h_${h}/format,png`;
    };
    
    const jsRound = (v: number): number => Math.floor(v + 0.5);
    
    // iOS 按 stored/4 基准
    const iosBase = storedW / 4;
    
    return {
      // Web / 通用
      '1x': makeUrl(lw * 1, lh * 1),
      '2x': makeUrl(lw * 2, lh * 2), // = stored, 原图
      '3x': makeUrl(lw * 3, lh * 3),
      // iOS
      'ios_1x': makeUrl(Math.max(1, jsRound(iosBase * 1)), Math.max(1, jsRound(storedH / 4 * 1))),
      'ios_2x': makeUrl(Math.max(1, jsRound(iosBase * 2)), Math.max(1, jsRound(storedH / 4 * 2))),
      'ios_3x': makeUrl(Math.max(1, jsRound(iosBase * 3)), Math.max(1, jsRound(storedH / 4 * 3))),
      // Android
      'android_mdpi': makeUrl(Math.max(1, jsRound(storedW / 4 * 1)), Math.max(1, jsRound(storedH / 4 * 1))),
      'android_hdpi': makeUrl(Math.max(1, jsRound(storedW / 4 * 1.5)), Math.max(1, jsRound(storedH / 4 * 1.5))),
      'android_xhdpi': makeUrl(Math.max(1, jsRound(storedW / 4 * 2)), Math.max(1, jsRound(storedH / 4 * 2))),
      'android_xxhdpi': makeUrl(Math.max(1, jsRound(storedW / 4 * 3)), Math.max(1, jsRound(storedH / 4 * 3))),
      'android_xxxhdpi': makeUrl(storedW, storedH), // = 原图
    };
  }

  /**
   * 生成 PS 稿切图的多倍图 URL
   * 对应 Python: _build_ps_scale_urls
   */
  private buildPsScaleUrls(imageUrl: string, baseW: number, baseH: number): Record<string, string> {
    if (!imageUrl || !baseW || !baseH) return {};
    
    const bw = Math.max(1, Math.round(baseW));
    const bh = Math.max(1, Math.round(baseH));
    
    const jsRound = (v: number): number => Math.floor(v + 0.5);
    
    const makeUrl = (w: number, h: number): string => {
      w = Math.max(1, w);
      h = Math.max(1, h);
      return `${imageUrl}?x-oss-process=image/resize,w_${w},h_${h}/format,png`;
    };
    
    const oneXW = bw / 2;
    const oneXH = bh / 2;
    
    return {
      // Web / 通用
      '1x': makeUrl(jsRound(oneXW), jsRound(oneXH)),
      '2x': makeUrl(bw, bh),
      '3x': makeUrl(jsRound(oneXW * 3), jsRound(oneXH * 3)),
      // iOS
      'ios_1x': makeUrl(jsRound(oneXW), jsRound(oneXH)),
      'ios_2x': makeUrl(bw, bh),
      'ios_3x': makeUrl(jsRound(oneXW * 3), jsRound(oneXH * 3)),
      // Android
      'android_mdpi': makeUrl(jsRound(oneXW), jsRound(oneXH)),
      'android_hdpi': makeUrl(jsRound(oneXW * 1.5), jsRound(oneXH * 1.5)),
      'android_xhdpi': makeUrl(bw, bh),
      'android_xxhdpi': makeUrl(jsRound(oneXW * 3), jsRound(oneXH * 3)),
      'android_xxxhdpi': makeUrl(jsRound(oneXW * 4), jsRound(oneXH * 4)),
    };
  }

  // ============================================================
  // 留言板 API
  // ============================================================

  /**
   * 发布/编辑/删除留言
   * API: GET /api/project/msg/action
   * action: publish / edit / delete
   */
  async sayMessage(params: {
    action: 'publish' | 'edit' | 'delete';
    projectId?: string;
    docId?: string;
    messageId?: string;
    summary?: string;
    content?: string;
  }): Promise<MessageActionResult> {
    const query: Record<string, string> = { action: params.action };
    
    if (params.projectId) {
      query.project_id = params.projectId;
    }
    if (params.docId) {
      query.doc_id = params.docId;
    }
    if (params.messageId) {
      query.msg_id = params.messageId;
    }
    if (params.summary) {
      query.summary = params.summary;
    }
    if (params.content) {
      query.content = params.content;
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/msg/action', query);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`留言操作失败: ${result.msg}`);
    }
    
    const data = result.result;
    return {
      success: true,
      messageId: data.msg_id || data.id || params.messageId,
    };
  }

  /**
   * 查看留言列表
   * API: GET /api/project/msg/list
   */
  async listMessages(params: {
    projectId?: string;
    docId?: string;
    type?: string;
    limit?: number;
  }): Promise<LanhuMessage[]> {
    const query: Record<string, string> = {};
    
    if (params.projectId) {
      query.project_id = params.projectId;
    }
    if (params.docId) {
      query.doc_id = params.docId;
    }
    if (params.type) {
      query.type = params.type;
    }
    if (params.limit) {
      query.limit = String(params.limit);
    }
    
    const response = await this.request.get<LanhuApiResponse<any>>('api/project/msg/list', query);
    const result = response.data as LanhuApiResponse<any>;
    
    if (result.code !== '00000') {
      throw new Error(`获取留言列表失败: ${result.msg}`);
    }
    
    const data = result.result;
    const messages: LanhuMessage[] = [];
    
    if (data.list && Array.isArray(data.list)) {
      for (const m of data.list) {
        messages.push({
          id: m.id,
          project_id: m.project_id,
          doc_id: m.doc_id,
          summary: m.summary,
          content: m.content,
          type: (m.type as LanhuMessage['type']) || 'normal',
          author: m.author,
          mentions: m.mentions,
          created_at: formatLanhuTime(m.created_at),
          updated_at: formatLanhuTime(m.updated_at),
        });
      }
    }
    
    return messages;
  }

  // ============================================================
  // 邀请链接 API
  // ============================================================

  /**
   * 获取邀请链接信息
   * API: GET /api/invite/show
   */
  async getInviteLinkInfo(inviteCode: string): Promise<InviteLinkInfoResult> {
    const response = await this.request.get<LanhuApiResponse<any>>('api/invite/show', { code: inviteCode });
    const result = response.data as InviteLinkInfo;
    
    if (result.code !== '00000') {
      throw new Error(`获取邀请链接信息失败: ${result.msg}`);
    }
    
    const data = result.result;
    
    return {
      projectId: data.project_id,
      teamId: data.team_id,
      folderName: data.folder_name,
      creatorName: data.creator_name,
      raw: data,
    };
  }

  // ============================================================
  // 页面/原型 API - 页面列表
  // ============================================================

  /**
   * 获取文档的所有页面列表（仅包含sitemap中的页面）
   * 对应 Python: get_pages_list
   * 
   * API 流程:
   * 1. GET /api/project/doc_versions - 获取文档版本信息
   * 2. GET {json_url} - 获取项目 mapping JSON (sitemap)
   * 3. 递归提取 sitemap.rootNodes 中的页面
   * 4. GET /api/project/multi_info - 获取项目信息（可选）
   */
  async getPagesList(docId: string, teamId?: string, projectId?: string): Promise<PagesListResult> {
    // 1. 获取文档信息（使用 /api/project/image API，与 Python 实现一致）
    const imageParams: Record<string, string> = { pid: projectId || '', image_id: docId };
    if (teamId) {
      imageParams.team_id = teamId;
    }
    
    // Python 的 /api/project/image 返回 {code: 0|'0'|'00000', msg: '', data: {...}}
    // 注意：Python 使用 'data' 字段，TypeScript 类型使用 'result'
    const docResponse = await this.request.get<any>('api/project/image', imageParams);
    const docResult = docResponse.data as any;
    
    // Python 返回 code=0 或 code='0' 或 code='00000' 都表示成功
    const code = docResult.code;
    const success = code === 0 || code === '0' || code === '00000';
    
    if (!success) {
      throw new Error(`获取文档信息失败: ${docResult.msg} (code=${code})`);
    }
    
    // Python: return data.get('data') or data.get('result', {})
    const docData = docResult.data || docResult.result;
    const versions = docData.versions || [];
    
    if (versions.length === 0) {
      throw new Error('文档版本信息不存在');
    }
    
    const latestVersion = versions[0];
    const jsonUrl = latestVersion.json_url;
    
    if (!jsonUrl) {
      throw new Error('映射 JSON URL 不存在');
    }
    
    // 2. 下载项目 mapping JSON
    const mappingResponse = await this.request.get<any>(jsonUrl);
    const projectMapping = mappingResponse.data as any;
    
    // 3. 从 sitemap 提取页面列表
    const sitemap = projectMapping.sitemap || {};
    const rootNodes = sitemap.rootNodes || [];
    
    // 递归提取所有页面
    const pages: LanhuSitemapPage[] = [];
    
    const extractPages = (
      nodes: any[],
      parentPath: string,
      level: number,
      parentFolder: string
    ): void => {
      for (const node of nodes) {
        const pageName = node.pageName || '';
        const url = node.url || '';
        const nodeId = node.id || '';
        const nodeType = node.type || 'Wireframe';
        
        // 构建当前路径
        const currentPath = parentPath ? `${parentPath}/${pageName}` : pageName;
        
        // 判断是否为纯文件夹（type=Folder 且 无url）
        const isPureFolder = nodeType === 'Folder' && !url;
        
        if (pageName && url) {
          // 这是一个页面（有url的都是页面）
          pages.push({
            index: pages.length + 1,
            name: pageName,
            filename: url,
            id: nodeId,
            type: nodeType,
            level: level,
            folder: parentFolder || '根目录',
            path: currentPath,
            has_children: Array.isArray(node.children) && node.children.length > 0,
          });
        }
        
        // 递归处理子节点
        const children = node.children || [];
        if (children.length > 0) {
          const nextFolder = isPureFolder ? pageName : parentFolder;
          extractPages(children, currentPath, level + 1, nextFolder);
        }
      }
    };
    
    extractPages(rootNodes, '', 0, '');
    
    // 4. 统计信息
    const folderStats: Record<string, number> = {};
    let maxLevel = 0;
    let pagesWithChildren = 0;
    
    for (const page of pages) {
      folderStats[page.folder] = (folderStats[page.folder] || 0) + 1;
      maxLevel = Math.max(maxLevel, page.level);
      if (page.has_children) {
        pagesWithChildren += 1;
      }
    }
    
    // 5. 获取项目信息（可选）
    let creatorName: string | undefined;
    let folderName: string | undefined;
    let projectPath: string | undefined;
    let memberCount: number | undefined;
    
    try {
      const multiParams: Record<string, string | number> = {
        project_id: projectId || '',
        doc_info: 1,
      };
      if (teamId) {
        multiParams.team_id = teamId;
      }
      
      const multiResponse = await this.request.get<LanhuApiResponse<any>>('api/project/multi_info', multiParams as any);
      const multiResult = multiResponse.data as LanhuApiResponse<any>;
      
      if (multiResult.code === '00000') {
        const projectInfo = multiResult.result || {};
        creatorName = projectInfo.creator_name;
        folderName = projectInfo.folder_name;
        projectPath = projectInfo.save_path;
        memberCount = projectInfo.member_cnt;
      }
    } catch {
      // 项目信息获取失败不影响主流程
    }
    
    // 6. 构建返回结果
    return {
      document_id: docData.id || docId,
      document_name: docData.name || '未命名文档',
      document_type: docData.type || 'axure',
      total_pages: pages.length,
      max_level: maxLevel,
      pages_with_children: pagesWithChildren,
      folder_statistics: folderStats,
      pages,
      create_time: docData.create_time,
      update_time: docData.update_time,
      total_versions: versions.length,
      latest_version: latestVersion.version_info,
      creator_name: creatorName,
      folder_name: folderName,
      project_path: projectPath,
      member_count: memberCount,
    };
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 获取蓝湖基础 URL
   */
  getBaseUrl(): string {
    return this.request.getBaseUrl();
  }

  /**
   * 获取 DDS 基础 URL
   */
  getDdsBaseUrl(): string {
    return this.request.getDdsBaseUrl();
  }

  /**
   * 获取 CDN 基础 URL
   */
  getCdnUrl(): string {
    return this.request.getCdnUrl();
  }
}

// ============================================================
// 导出
// ============================================================

// 导出单例
export const lanhuApi = new LanhuAPIClient();

// 导出类以便测试和其他模块使用
export { LanhuAPIClient };
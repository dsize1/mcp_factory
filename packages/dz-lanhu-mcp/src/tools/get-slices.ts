/**
 * 获取设计切图信息工具
 *
 * 从蓝湖 UI 设计稿中获取切图/素材信息，支持获取多倍图下载 URL
 *
 * 对应 Python 参考实现 (lanhu_mcp_server.py) 的 lanhu_get_design_slices 逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import { parseLanhuUrl } from '../utils/url-parser.js';
import type { LanhuDesign } from '../types.js';

// ============================================================
// 工具定义
// ============================================================

export function createGetSlicesTool(): ToolHandler {
  return {
    name: 'lanhu_get_design_slices',
    description:
      '获取设计切图信息。从指定设计稿中提取所有切图/素材（图标、图片等），包含切图名称、图层路径、尺寸、多倍图下载 URL。' +
      '使用前请先调用 lanhu_get_designs 获取设计稿列表，确认设计稿名称。' +
      '支持精确名称匹配、index 数字匹配、模糊匹配和 URL 中 image_id 匹配。',
    inputSchema: createSchema(
      {
        url: {
          type: 'string',
          description:
            '蓝湖设计稿项目 URL，不含 docId。例: https://lanhuapp.com/web/#/item/project/stage?tid=xxx&pid=xxx。' +
            '也支持 detailDetach 格式: ?pid=xxx&image_id=xxx。如果有邀请链接，请先用 lanhu_resolve_invite_link 获取参数！',
        },
        design_name: {
          type: 'string',
          description:
            '设计稿名称（必需，精确名称）。例: "首页设计"、"登录页"。必须与 lanhu_get_designs 返回的 name 字段完全匹配。',
        },
        include_metadata: {
          type: 'boolean',
          description: '是否包含元数据（颜色、透明度、阴影等信息）',
        },
      },
      ['url', 'design_name']
    ),
    handler: async (params: Record<string, any>): Promise<string> => {
      const url = (params as { url: string }).url;
      const designName = (params as { design_name: string }).design_name;
      const includeMetadata = (params as { include_metadata?: boolean }).include_metadata ?? true;

      // 1. 解析 URL 提取 tid/pid/image_id
      const parsed = parseLanhuUrl(url);
      const teamId = parsed.teamId;
      const projectId = parsed.projectId;
      const imageIdFromUrl = parsed.docId; // parse_url 会把 image_id 解析为 doc_id

      if (!projectId) {
        return JSON.stringify(
          {
            status: 'error',
            message: 'URL 中缺少 project_id 参数，请确保 URL 包含 pid（项目 ID）',
            parsed_type: parsed.type,
            parsed_params: {
              teamId,
              projectId,
              imageIdFromUrl,
            },
            url: url,
          },
          null,
          2
        );
      }

      // 2. 获取设计稿列表
      const stageId = parsed.stageId;
      if (!stageId) {
        return JSON.stringify(
          {
            status: 'error',
            message: 'URL 中缺少 stage_id 参数，请确保 URL 包含 stage_id（设计稿项目 ID）',
            parsed_type: parsed.type,
            parsed_params: {
              teamId,
              projectId,
              stageId,
            },
            url: url,
          },
          null,
          2
        );
      }

      let designs: LanhuDesign[];
      try {
        designs = await lanhuApi.getDesignsList(stageId, teamId, projectId);
      } catch (error: any) {
        return JSON.stringify(
          {
            status: 'error',
            message: `获取设计稿列表失败: ${error.message || String(error)}`,
            url: url,
            parsed_params: {
              teamId,
              projectId,
              stageId,
            },
          },
          null,
          2
        );
      }

      // 3. 查找指定的设计稿
      // 支持：精确名称匹配、index 数字匹配、模糊/归一化匹配、image_id 匹配
      let targetDesign: LanhuDesign | null = null;
      const designNameStripped = designName.trim();

      // 3a. 尝试精确名称匹配
      for (const design of designs) {
        if (design.name === designNameStripped) {
          targetDesign = design;
          break;
        }
      }

      // 3b. 尝试归一化引号后匹配（解决框架转换中文引号的问题）
      if (!targetDesign) {
        const normalizeQuotes = (s: string) =>
          s.replace(/\u201c/g, '"').replace(/\u201d/g, '"').replace(/\u2018/g, "'").replace(/\u2019/g, "'");
        const normalizedInput = normalizeQuotes(designNameStripped);
        for (const design of designs) {
          if (normalizeQuotes(design.name) === normalizedInput) {
            targetDesign = design;
            break;
          }
        }
      }

      // 3c. 尝试子串包含匹配（输入是设计名的一部分）
      if (!targetDesign) {
        const matches = designs.filter(
          (d) => designNameStripped.includes(d.name) || d.name.includes(designNameStripped)
        );
        if (matches.length === 1) {
          targetDesign = matches[0];
        }
      }

      // 3d. 如果名称没匹配到，尝试使用 URL 中的 image_id
      if (!targetDesign && imageIdFromUrl) {
        for (const design of designs) {
          if (design.id === imageIdFromUrl) {
            targetDesign = design;
            break;
          }
        }
      }

      if (!targetDesign) {
        const availableNames = designs.map((d) => d.name);
        return JSON.stringify(
          {
            status: 'error',
            message: `设计稿 '${designName}' 不存在`,
            available_designs: availableNames,
            url: url,
            parsed_params: {
              teamId,
              projectId,
              stageId,
              imageIdFromUrl,
            },
          },
          null,
          2
        );
      }

      // 4. 获取切图信息
      try {
        const slicesResult = await lanhuApi.getDesignSlicesInfo(
          targetDesign.id,
          teamId,
          projectId,
          includeMetadata
        );

        // 5. 构建 AI 工作流指南
        const aiWorkflowGuide = buildAiWorkflowGuide(slicesResult.slices);

        // 6. 构建返回结果
        const result = {
          status: 'success',
          design: {
            id: targetDesign.id,
            name: targetDesign.name,
            project_id: targetDesign.project_id,
            stage_id: targetDesign.stage_id,
          },
          summary: {
            total_slices: slicesResult.totalSlices,
            design_width:
              slicesResult.slices.length > 0 ? (slicesResult.slices[0]?.width || 0) : 0,
            design_height:
              slicesResult.slices.length > 0 ? (slicesResult.slices[0]?.height || 0) : 0,
          },
          slices: slicesResult.slices.map((slice) => ({
            id: slice.id,
            name: slice.name,
            layer_path: slice.layerPath,
            url: slice.url,
            width: slice.width,
            height: slice.height,
            format: slice.width && slice.height ? 'png' : undefined,
            scale_urls: slice.formats,
          })),
          ai_workflow_guide: aiWorkflowGuide,
        };

        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return JSON.stringify(
          {
            status: 'error',
            message: `获取切图信息失败: ${error.message || String(error)}`,
            design: {
              id: targetDesign.id,
              name: targetDesign.name,
            },
            url: url,
          },
          null,
          2
        );
      }
    },
  };
}

// ============================================================
// AI 工作流指南构建函数
// ============================================================

/**
 * 构建 AI 工作流指南
 */
function buildAiWorkflowGuide(
  slices: Array<{
    id: string;
    name: string;
    layerPath: string;
    url: string;
    width: number;
    height: number;
    formats?: Record<string, string>;
  }>
): any {
  // 计算示例尺寸
  const sampleSlice = slices.length > 0 ? slices[0] : null;
  const w1x = sampleSlice?.width ? Math.round(sampleSlice.width / 2) : 0;
  const h1x = sampleSlice?.height ? Math.round(sampleSlice.height / 2) : 0;
  const w2x = sampleSlice?.width || 0;
  const h2x = sampleSlice?.height || 0;
  const w3x = sampleSlice?.width ? sampleSlice.width * 1.5 : 0;
  const h3x = sampleSlice?.height ? sampleSlice.height * 1.5 : 0;

  return {
    instructions:
      '\uD83E\uDD16 AI assistant must follow this workflow to process slice download tasks',
    language_requirement:
      '\u26A0\uFE0F IMPORTANT: Always respond to user in Chinese (\u4e2d\u6587\u56de\u590d)',
    FIRST_ACTION_REQUIRED: {
      action: 'ASK_USER_SCALE_PREFERENCE',
      description: '在开始下载前，必须先向用户确认平台和倍率偏好',
      question_template:
        '请问您需要下载哪个平台的切图？\n\n' +
        '**Web 端**\n' +
        '- `1x` — ' +
        w1x +
        '\u00d7' +
        h1x +
        'px\uff08CSS 1\u500d\u56fe\uff09\n' +
        '- `2x` — ' +
        w2x +
        '\u00d7' +
        h2x +
        'px\uff08Retina / \u539f\u56fe\uff09\n' +
        '- `3x` — ' +
        w3x +
        '\u00d7' +
        h3x +
        'px\uff08\u8d85\u9ad8\u6e05\uff09\n\n' +
        '**iOS**\n' +
        '- ios_1x — @1x\n' +
        '- ios_2x — @2x\uff08\u540c Web 1x\uff09\n' +
        '- ios_3x — @3x\n\n' +
        '**Android**\n' +
        '- android_xhdpi — xhdpi\uff08\u540c Web 1x\uff09\n' +
        '- android_xxhdpi — xxhdpi\uff08\u540c iOS @3x\uff09\n' +
        '- android_xxxhdpi — xxxhdpi\uff08\u539f\u56fe\uff09\n' +
        '- \u5168\u5957\uff08mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi\uff09\n\n' +
        '> \u9ed8\u8ba4\u63a8\u8350\uff1a**Web 2x**\uff08\u6700\u9ad8\u6e05\uff0c\u76f4\u63a5\u4f7f\u7528\u539f\u56fe URL\uff0c\u65e0\u9700\u989d\u5916\u5904\u7406\uff09',
      how_to_use_scale_urls:
        '\u6bcf\u4e2aslice\u7684 scale_urls \u5b57\u6bb5\u5305\u542b\u6240\u6709\u500d\u7387\u7684 URL\uff0c\u6839\u636e\u7528\u6237\u9009\u62e9\u53d6\u5bf9\u5e94 key \u7684 URL \u4e0b\u8f7d\u5373\u53ef',
      scale_url_keys: {
        'Web 1x': 'scale_urls.1x',
        'Web 2x (\u539f\u56fe)': 'scale_urls.2x',
        'Web 3x': 'scale_urls.3x',
        'iOS @1x': 'scale_urls.ios_1x',
        'iOS @2x': 'scale_urls.ios_2x',
        'iOS @3x': 'scale_urls.ios_3x',
        'Android mdpi': 'scale_urls.android_mdpi',
        'Android hdpi': 'scale_urls.android_hdpi',
        'Android xhdpi': 'scale_urls.android_xhdpi',
        'Android xxhdpi': 'scale_urls.android_xxhdpi',
        'Android xxxhdpi': 'scale_urls.android_xxxhdpi',
      },
      multi_scale_naming: {
        'Web 1x+2x': 'filename.png / filename@2x.png',
        'iOS all': 'filename.png / filename@2x.png / filename@3x.png',
        'Android all': 'mipmap-mdpi/f.png, mipmap-hdpi/f.png, ... mipmap-xxxhdpi/f.png',
      },
    },
    workflow_steps: [
      {
        step: 0,
        title: '\u8be2\u95ee\u7528\u6237\u4e0b\u8f7d\u5e73\u53f0\u548c\u500d\u7387\uff08\u5fc5\u987b\u5728\u4e0b\u8f7d\u524d\u5b8c\u6210\uff09',
        mandatory: true,
        tasks: [
          '\u5c55\u793a\u5207\u56fe\u5217\u8868\u6458\u8981\uff08\u603b\u6570 + \u524d3\u4e2a\u540d\u5b57\uff09\u7ed9\u7528\u6237',
          '\u5217\u51fa\u53ef\u9009\u5e73\u53f0\uff1aWeb\uff081x/2x/3x\uff09\u3001iOS\uff08@1x/@2x/@3x\uff09\u3001Android\uff08\u5168\u5957/\u5355\u500d\u7387\uff09',
          '\u7b49\u5f85\u7528\u6237\u660e\u786e\u9009\u62e9\uff0c\u4e0d\u8981\u64c5\u81ea\u5047\u8bbe\u9ed8\u8ba4\u503c',
          '\u82e5\u7528\u6237\u5728\u610f\uff0c\u63a8\u8350 Web 2x\uff08\u539f\u56fe URL\uff0c\u65e0 OSS \u53c2\u6570\uff0c\u6700\u7b80\u5355\uff09',
        ],
      },
      {
        step: 1,
        title: 'Create TODO Task Plan',
        tasks: [
          'Analyze project structure (read package.json, pom.xml, requirements.txt, etc.)',
          'Identify project type (React/Vue/Flutter/iOS/Android/Plain Frontend, etc.)',
          'Determine slice storage directory (e.g., src/assets/images/)',
          'Plan slice grouping strategy (by feature module, UI component, etc.)',
        ],
      },
      {
        step: 2,
        title: 'Smart Directory Selection Rules',
        rules: [
          'Priority 1: If user explicitly specified output_dir \u2192 use user-specified path',
          'Priority 2: If project has standard assets directory \u2192 use project convention (e.g., src/assets/images/slices/)',
          'Priority 3: If generic project \u2192 use design_slices/{design_name}/',
        ],
        common_project_structures: {
          'React/Vue': ['src/assets/', 'public/images/'],
          Flutter: ['assets/images/'],
          iOS: ['Assets.xcassets/'],
          Android: ['res/drawable/', 'res/mipmap/'],
          'Plain Frontend': ['images/', 'assets/'],
        },
      },
      {
        step: 3,
        title: '\u6587\u4ef6\u547d\u540d\u89c4\u8303',
        primary_rule:
          '\u6839\u636e\u7528\u6237\u9879\u76ee\u547d\u540d\u89c4\u8303\u5bf9 slice.name \u8fdb\u884c\u8bed\u4e49\u5316\u82f1\u6587\u91cd\u547d\u540d\uff0c\u518d\u52a0\u500d\u7387\u540e\u7f00',
        naming_workflow: [
          '1. \u8bfb\u53d6\u7528\u6237\u9879\u76ee\u5df2\u6709\u5207\u56fe/\u8d44\u6e90\u6587\u4ef6\uff0c\u8bc6\u522b\u547d\u540d\u98ce\u683c\uff08snake_case / camelCase / kebab-case \u7b49\uff09',
          '2. \u5c06 slice.name\uff08\u53ef\u80fd\u662f\u4e2d\u6587\uff09\u7ffb\u8bd1\u5e76\u8bed\u4e49\u5316\u4e3a\u82f1\u6587\uff0c\u9075\u5faa\u8bc6\u522b\u5230\u7684\u547d\u540d\u98ce\u683c',
          '3. \u65e0\u6cd5\u8bc6\u522b\u98ce\u683c\u65f6\u9ed8\u8ba4 snake_case\uff08\u5982 icon_share\u3001btn_confirm\u3001img_empty_state\uff09',
          '4. \u52a0\u500d\u7387\u540e\u7f00',
        ],
        scale_suffix_convention: {
          'Web 1x': '{name}.png',
          'Web 2x': '{name}@2x.png',
          'Web 3x': '{name}@3x.png',
          'iOS @1x': '{name}.png',
          'iOS @2x': '{name}@2x.png',
          'iOS @3x': '{name}@3x.png',
          'Android mdpi': 'mipmap-mdpi/{name}.png',
          'Android hdpi': 'mipmap-hdpi/{name}.png',
          'Android xhdpi': 'mipmap-xhdpi/{name}.png',
          'Android xxhdpi': 'mipmap-xxhdpi/{name}.png',
          'Android xxxhdpi': 'mipmap-xxxhdpi/{name}.png',
        },
        rename_examples: [
          { slice_name: '\u7ebf', renamed: 'icon_line', 'Web 2x': 'icon_line@2x.png' },
          {
            slice_name: 'img_\u6210\u529f\u7533\u8bf7\u7cbe\u88c5',
            renamed: 'img_apply_success',
            'Web 2x': 'img_apply_success@2x.png',
          },
          {
            slice_name: '\u7533\u8bf7\u88ab\u62d2\u7ec3',
            renamed: 'img_apply_rejected',
            'Web 2x': 'img_apply_rejected@2x.png',
          },
          { slice_name: '\u8349\u5730\u5927\u80cc\u666f', renamed: 'bg_grass', 'Web 2x': 'bg_grass@2x.png' },
          { slice_name: 'icon-\u5bfc\u51fa', renamed: 'icon_export', 'Web 2x': 'icon_export@2x.png' },
        ],
        duplicate_handling:
          '\u540d\u5b57\u5207\u56fe\u52a0\u5e8f\u53f7\u540e\u7f00\uff1aicon_line.png / icon_line_2.png / icon_line_3.png',
      },
      {
        step: 4,
        title: 'Environment Detection and Download Solution Selection',
        principle:
          'AI must first detect current system environment and available tools, then autonomously select the best download solution',
        priority_rules: [
          'Priority 1: Use system built-in download tools (curl/PowerShell/wget, etc.)',
          'Priority 2: If system tools unavailable, detect programming language environment (python/node, etc.)',
          'Priority 3: Create temporary script as last resort',
        ],
        detection_steps: [
          'Step 1: Detect operating system type (Windows/macOS/Linux)',
          'Step 2: Sequentially detect available download tools',
          'Step 3: Autonomously select optimal solution based on detection results',
          'Step 4: Execute download task',
          'Step 5: Clean up temporary files (if any)',
        ],
        common_tools_by_platform: {
          Windows: {
            built_in: ['PowerShell Invoke-WebRequest', 'certutil'],
            optional: ['curl (Win10 1803+ built-in)', 'python', 'node'],
          },
          macOS: {
            built_in: ['curl'],
            optional: ['python', 'wget', 'node'],
          },
          Linux: {
            built_in: ['curl', 'wget'],
            optional: ['python', 'node'],
          },
        },
        important_principles: [
          '\u26A0\uFE0F Do not assume any tool is available, must detect first',
          '\u26A0\uFE0F Prefer system built-in tools, avoid third-party dependencies',
          '\u26A0\uFE0F Do not use fixed code templates or example code',
          '\u26A0\uFE0F Dynamically generate commands or scripts based on actual environment',
          '\u26A0\uFE0F Control concurrency when batch downloading',
          '\u26A0\uFE0F Must clean up temporary files after completion',
        ],
      },
    ],
    execution_workflow: {
      description: 'Complete workflow that AI must autonomously complete',
      steps: [
        'Step 0: \u5c55\u793a\u5207\u56fe\u6458\u8981\uff0c\u8be2\u95ee\u7528\u6237\u9700\u8981\u54ea\u4e2a\u5e73\u53f0/\u500d\u7387\uff08\u5fc5\u987b\u7b49\u5f85\u7528\u6237\u56de\u590d\uff09',
        'Step 1: Call lanhu_get_design_slices(url, design_name) to get slice info',
        'Step 2: Create TODO task plan (use todo_write tool)',
        'Step 3: Detect current operating system type',
        'Step 4: Detect available download tools by priority',
        'Step 5: Identify project type and determine output directory',
        'Step 6: \u6839\u636e\u7528\u6237\u9009\u62e9\u7684\u500d\u7387\uff0c\u4ece slice.scale_urls \u53d6\u5bf9\u5e94 URL\uff0c\u751f\u6210\u667a\u80fd\u6587\u4ef6\u540d',
        'Step 7: Select optimal download solution based on detection results',
        'Step 8: Execute batch download task',
        'Step 9: Verify download results',
        'Step 10: Clean up temporary files and complete TODO',
      ],
    },
    important_notes: [
      '\uD83C\uDF0F AI \u5fc5\u987b\u5148\u8be2\u95ee\u7528\u6237\u9700\u8981\u4e0b\u8f7d\u54ea\u4e2a\u5e73\u53f0/\u500d\u7387\uff0c\u4e0d\u80fd\u64c5\u81ea\u5f00\u59cb\u4e0b\u8f7d',
      '\uD83D\uDCD0 \u6bcf\u4e2aslice\u90fd\u6709 scale_urls \u5b57\u6bb5\uff0c\u5305\u542b 1x/2x/3x \u53ca iOS/Android \u5168\u5957 URL',
      '\u2B50 Web 2x = scale_urls.2x = \u539f\u56fe URL\uff08\u65e0 OSS \u53c2\u6570\uff0c\u6700\u7b80\u5355\uff09\uff0c\u63a8\u8350\u9996\u9009',
      '\uD83C\uDF4E iOS \u5168\u5957\u4e0b\u8f7d\uff1aios_1x/ios_2x/ios_3x\uff0c\u6587\u4ef6\u540d\u52a0 @2x/@3x \u540e\u7f00',
      '\uD83E\uDD16 Android \u5168\u5957\u4e0b\u8f7d\uff1aandroid_mdpi~xxxhdpi\uff0c\u5206\u522b\u653e\u5165\u5bf9\u5e94 mipmap \u76ee\u5f55',
      '\uD83C\uDF0F AI must proactively complete the entire workflow, don\'t just return info and wait for user action',
      '\uD83D\uDCCB AI must use todo_write tool to create task plan, ensure orderly progress',
      '\uD83D\uDD0D AI must detect environment and tool availability first, then select download solution',
      '\u2B50 AI must prefer system built-in tools, avoid third-party dependencies',
      '\uD83D\uDEAD AI must not use fixed code examples, must dynamically generate commands based on actual environment',
      '\uD83D\uDE80 AI must smartly select output directory based on project structure, don\'t blindly use default path',
      '\uD83C\uDFF7\uFE0F AI must generate semantic filenames based on slice layer_path and parent_name',
      '\uD83D\uDCBB AI must select corresponding download tools for different OS (Windows/macOS/Linux)',
      '\uD83E\uDDF9 AI must clean up temporary files after completion (if any)',
      '\uD83D\uDD63\uFE0F AI must always respond to user in Chinese (\u4e2d\u6587\u56de\u590d)',
    ],
  };
}
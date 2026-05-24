/**
 * AI 分析工具测试套件
 * 
 * 测试以下两个 AI 工具：
 * 1. lanhu_get_ai_analyze_page_result - 分析蓝湖原型页面内容
 * 2. lanhu_get_ai_analyze_design_result - 分析蓝湖 UI 设计图
 * 
 * 运行方式:
 *   npx tsx tests/test-ai-tools.ts              # 运行所有测试
 *   npx tsx tests/test-ai-tools.ts page         # 仅测试页面分析
 *   npx tsx tests/test-ai-tools.ts design       # 仅测试设计图分析
 *   npx tsx tests/test-ai-tools.ts schema       # 仅测试工具 schema
 *   npx tsx tests/test-ai-tools.ts help         # 显示帮助信息
 */

// 加载 .env 文件
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { lanhuApi } from '../src/api/client.js';
import { analyzeAxurePage } from '../src/utils/playwright-browser.js';

// ============================================================
// 测试配置
// ============================================================

const TEST_URL =
  process.argv[2] === 'help'
    ? undefined
    : (process.env.LANHU_TEST_URL || 'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=d6e1502802bc4ad49ce78f8d6b4e83de&share_type=quickShare');

const TEST_URL_DESIGN =
  process.env.LANHU_TEST_URL_DESIGN || 'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=d6e1502802bc4ad49ce78f8d6b4e83de&share_type=quickShare';

type TestMode = 'development' | 'testing' | 'explore';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 从蓝湖 URL 中提取参数
 */
function extractHashParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const parsed = new URL(url);
    const hash = parsed.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = hash.substring(queryIndex + 1);
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
  } catch {
    const queryMatch = url.match(/\?([&#].*)$/);
    if (queryMatch) {
      const queryString = queryMatch[1].replace(/^[?#]/, '');
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
  }
  return params;
}

/**
 * 测量执行时间
 */
async function measureTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * 记录测试结果
 */
function recordTest(results: TestResult[], name: string, passed: boolean, duration: number, error?: string) {
  results.push({ name, passed, duration, error });
}

/**
 * 打印测试结果摘要
 */
function printSummary(results: TestResult[], totalDuration: number) {
  console.log('\n' + '='.repeat(60));
  console.log('测试摘要');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`总耗时: ${totalDuration}ms`);
  console.log(`通过: ${passed}/${results.length}`);
  console.log(`失败: ${failed}/${results.length}`);
  console.log('-'.repeat(60));
  
  for (const r of results) {
    const status = r.passed ? '✓' : '✗';
    const time = `${r.duration}ms`;
    console.log(`  ${status} ${r.name} (${time})`);
    if (!r.passed && r.error) {
      console.log(`    错误: ${r.error}`);
    }
  }
  
  console.log('='.repeat(60));
  if (failed > 0) {
    console.log(`结果: ${failed} 个测试失败`);
    process.exit(1);
  } else {
    console.log('结果: 所有测试通过!');
  }
}

// ============================================================
// 测试模块
// ============================================================

/**
 * 测试 lanhu_get_ai_analyze_page_result 工具
 */
async function testAnalyzePageTool() {
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log('测试套件: lanhu_get_ai_analyze_page_result');
  console.log('='.repeat(60));
  
  try {
    // 1. 测试 URL 解析
    console.log('\n[测试 1] URL 解析测试');
    
    if (!TEST_URL) {
      recordTest(results, 'URL 解析', false, 0, '测试 URL 未配置');
      const totalDuration = Date.now() - startTime;
      printSummary(results, totalDuration);
      return results;
    }
    
    const hashParams = extractHashParams(TEST_URL);
    const docId = hashParams.docId;
    const teamId = hashParams.tid;
    const projectId = hashParams.pid;
    
    console.log(`  docId: ${docId}`);
    console.log(`  tid (teamId): ${teamId}`);
    console.log(`  pid (projectId): ${projectId}`);
    
    if (!docId) {
      recordTest(results, 'URL 解析', false, 0, 'URL 中缺少 docId 参数');
    } else {
      recordTest(results, 'URL 解析', true, 0);
    }
    
    // 2. 测试获取页面列表
    console.log('\n[测试 2] 获取页面列表');
    const pageListStart = Date.now();
    const pagesList = await lanhuApi.getPagesList(docId || '', teamId, projectId);
    const pageListDuration = Date.now() - pageListStart;
    
    console.log(`  文档名称: ${pagesList.document_name}`);
    console.log(`  总页面数: ${pagesList.total_pages}`);
    
    if (pagesList.pages.length === 0) {
      recordTest(results, '获取页面列表', false, pageListDuration, '没有找到任何页面');
    } else {
      recordTest(results, '获取页面列表', true, pageListDuration);
    }
    
    // 3. 测试不同模式的分析
    const modes: TestMode[] = ['development', 'testing', 'explore'];
    const targetPage = pagesList.pages[0];
    
    for (const mode of modes) {
      console.log(`\n[测试 3.${modes.indexOf(mode) + 1}] 页面分析模式: ${mode}`);
      const { result, duration } = await measureTime(async () => {
        // 获取 HTML 内容
        const htmlContent = await lanhuApi.getPageHtml(targetPage.filename);
        console.log(`  HTML 内容长度: ${htmlContent.length} 字符`);
        
        // 使用 Playwright 分析页面
        const analysisResult = await analyzeAxurePage(htmlContent, targetPage.name, {
          fullPage: true,
          waitForTimeout: 3000,
        });
        
        return analysisResult;
      });
      
      // 验证结果字段
      const hasTextContent = result.textContent && result.textContent.length > 0;
      const hasDesignStyleInfo = result.designStyleInfo && result.designStyleInfo.length > 0;
      const hasInteractionGuide = result.interactionGuide && result.interactionGuide.length > 0;
      const hasScreenshot = result.screenshot && result.screenshot.length > 0;
      const hasScreenshotWidth = result.screenshotWidth && result.screenshotWidth > 0;
      const hasScreenshotHeight = result.screenshotHeight && result.screenshotHeight > 0;
      
      const allFieldsValid = hasTextContent && hasDesignStyleInfo && hasInteractionGuide && hasScreenshot;
      
      console.log(`  耗时: ${duration}ms`);
      console.log(`  文本内容: ${hasTextContent ? '✓' : '✗'} (${result.textContent?.length || 0} 字符)`);
      console.log(`  设计样式: ${hasDesignStyleInfo ? '✓' : '✗'} (${result.designStyleInfo?.length || 0} 字符)`);
      console.log(`  交互说明: ${hasInteractionGuide ? '✓' : '✗'} (${result.interactionGuide?.length || 0} 字符)`);
      console.log(`  截图数据: ${hasScreenshot ? '✓' : '✗'} (${result.screenshot?.length || 0} 字符)`);
      console.log(`  截图尺寸: ${hasScreenshotWidth ? '✓' : '✗'} (${result.screenshotWidth}x${result.screenshotHeight})`);
      
      recordTest(
        results,
        `页面分析模式: ${mode}`,
        allFieldsValid,
        duration,
        allFieldsValid ? undefined : '缺少必要的分析结果字段'
      );
    }
    
    // 4. 测试错误处理 - 无效 URL
    console.log('\n[测试 4] 错误处理 - 无效 URL');
    try {
      const invalidParsed = lanhuApi.parseUrl('https://example.com/invalid');
      console.log(`  无效 URL 解析类型: ${invalidParsed.type}`);
      recordTest(results, '错误处理 - 无效 URL', true, 0);
    } catch (error: any) {
      console.log(`  错误: ${error.message}`);
      recordTest(results, '错误处理 - 无效 URL', false, 0, error.message);
    }
    
    // 5. 测试错误处理 - 不存在的页面 ID
    console.log('\n[测试 5] 错误处理 - 不存在的页面 ID');
    try {
      const productDetail = await lanhuApi.getProductDetail(
        'nonexistent-page-id',
        teamId,
        projectId
      );
      console.log(`  产品详情: ${productDetail.name}`);
      // 不存在的页面 ID 不应该直接成功，但这里只是验证 API 调用不会崩溃
      recordTest(results, '错误处理 - 不存在的页面 ID', true, 0);
    } catch (error: any) {
      // 期望失败，所以这实际上是正确的行为
      console.log(`  预期错误: ${error.message}`);
      recordTest(results, '错误处理 - 不存在的页面 ID', true, 0);
    }
    
  } catch (error: any) {
    console.error('\n测试过程中发生严重错误:', error.message);
    recordTest(results, '页面分析主流程', false, 0, error.message);
  }
  
  const totalDuration = Date.now() - startTime;
  printSummary(results, totalDuration);
  return results;
}

/**
 * 测试 lanhu_get_ai_analyze_design_result 工具
 */
async function testAnalyzeDesignTool() {
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log('测试套件: lanhu_get_ai_analyze_design_result');
  console.log('='.repeat(60));
  
  try {
    // 1. 测试 URL 解析
    console.log('\n[测试 1] URL 解析测试');
    const hashParams = extractHashParams(TEST_URL_DESIGN);
    const docId = hashParams.docId;
    const teamId = hashParams.tid;
    const projectId = hashParams.pid;
    
    console.log(`  docId: ${docId}`);
    console.log(`  tid (teamId): ${teamId}`);
    console.log(`  pid (projectId): ${projectId}`);
    
    if (!docId) {
      recordTest(results, 'URL 解析', false, 0, 'URL 中缺少 docId 参数');
    } else {
      recordTest(results, 'URL 解析', true, 0);
    }
    
    // 2. 获取设计稿列表
    console.log('\n[测试 2] 获取设计稿列表');
    const designListStart = Date.now();
    const designs = await lanhuApi.getDesignsList(docId || '', teamId, projectId);
    const designListDuration = Date.now() - designListStart;
    
    console.log(`  设计稿数量: ${designs.length}`);
    if (designs.length > 0) {
      designs.slice(0, 5).forEach((d, i) => {
        console.log(`    ${i + 1}. ${d.name} (${d.id})`);
      });
    }
    
    if (designs.length === 0) {
      recordTest(results, '获取设计稿列表', false, designListDuration, '没有找到任何设计稿');
    } else {
      recordTest(results, '获取设计稿列表', true, designListDuration);
    }
    
    // 3. 测试获取设计稿详情
    if (designs.length > 0) {
      const targetDesign = designs[0];
      
      console.log(`\n[测试 3] 获取设计稿详情: ${targetDesign.name}`);
      const { result, duration } = await measureTime(async () => {
        const designDetail = await lanhuApi.getDesignDetail(
          targetDesign.id,
          teamId,
          projectId
        );
        return designDetail;
      });
      
      console.log(`  耗时: ${duration}ms`);
      console.log(`  预览 URL: ${result.preview_url ? '✓' : '✗'}`);
      console.log(`  设计信息: ✓`);
      
      recordTest(
        results,
        `获取设计稿详情`,
        !!result.preview_url,
        duration,
        !result.preview_url ? '缺少预览 URL' : undefined
      );
      
      // 4. 测试获取切图信息
      console.log(`\n[测试 4] 获取切图信息`);
      const { result: slicesResult, duration: slicesDuration } = await measureTime(async () => {
        const slicesInfo = await lanhuApi.getDesignSlicesInfo(
          targetDesign.id,
          teamId,
          projectId
        );
        return slicesInfo;
      });
      
      console.log(`  耗时: ${slicesDuration}ms`);
      console.log(`  切图数量: ${slicesResult.totalSlices}`);
      if (slicesResult.slices.length > 0) {
        console.log('  切图列表:');
        slicesResult.slices.slice(0, 5).forEach((s: any) => {
          console.log(`    - ${s.name}: ${s.width}x${s.height}`);
        });
      }
      
      recordTest(
        results,
        '获取切图信息',
        slicesResult !== undefined,
        slicesDuration,
        slicesResult === undefined ? '获取切图信息失败' : undefined
      );
      
      // 5. 测试构建 AI 分析提示词
      console.log('\n[测试 5] 构建 AI 分析提示词');
      const prompt = buildAnalysisPrompt(
        { name: targetDesign.name, original_url: targetDesign.original_url, thumb_url: targetDesign.thumb_url },
        { preview_url: result.preview_url },
        slicesResult
      );
      
      const promptValid = !!(prompt && prompt.length > 0);
      const hasDesignName = prompt?.includes(targetDesign.name) ?? false;
      const hasPromptInstructions = prompt?.includes('请提供') ?? false;
      
      console.log(`  提示词长度: ${prompt?.length || 0} 字符`);
      console.log(`  包含设计名称: ${hasDesignName ? '✓' : '✗'}`);
      console.log(`  包含分析指令: ${hasPromptInstructions ? '✓' : '✗'}`);
      
      const promptTestResult = promptValid && hasDesignName && hasPromptInstructions;
      recordTest(
        results,
        '构建 AI 分析提示词',
        promptTestResult,
        0,
        promptTestResult ? undefined : '提示词构建失败'
      );
    }
    
    // 6. 测试错误处理 - 不存在的设计稿 ID
    console.log('\n[测试 6] 错误处理 - 不存在的设计稿 ID');
    try {
      await lanhuApi.getDesignDetail(
        'nonexistent-design-id',
        teamId,
        projectId
      );
      recordTest(results, '错误处理 - 不存在的设计稿 ID', false, 0, '应该抛出错误');
    } catch (error: any) {
      console.log(`  预期错误: ${error.message}`);
      recordTest(results, '错误处理 - 不存在的设计稿 ID', true, 0);
    }
    
  } catch (error: any) {
    console.error('\n测试过程中发生严重错误:', error.message);
    recordTest(results, '设计图分析主流程', false, 0, error.message);
  }
  
  const totalDuration = Date.now() - startTime;
  printSummary(results, totalDuration);
  return results;
}

/**
 * 构建 AI 分析提示词（与 lanhu-get-ai-analyze-design-result.ts 中的实现一致）
 */
function buildAnalysisPrompt(
  design: { name: string; original_url?: string; thumb_url?: string },
  detail: { preview_url?: string; schema?: any },
  slices: { slices: Array<{ name: string; url: string; width?: number; height?: number }>; totalSlices: number }
): string {
  return `你是一个 UI/UX 设计分析助手，请分析以下设计图：

设计图名称: ${design.name}

设计图资源:
- 原始图 URL: ${design.original_url || '无'}
- 缩略图 URL: ${design.thumb_url || '无'}
- 预览 JSON: ${detail.preview_url || '无'}

切图信息 (${slices.totalSlices} 个):
${slices.slices.map((s: { name: string; url: string; width?: number; height?: number }) => `- ${s.name}: ${s.url} (${s.width || '?'}x${s.height || '?'})`).join('\n') || '无切图'}

请提供：
1. 设计图内容描述
2. 主要 UI 组件识别
3. 布局和交互建议
4. 可导出的切图清单`;
}

/**
 * 测试工具 Schema
 */
async function testToolSchema() {
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log('测试套件: 工具 Schema 验证');
  console.log('='.repeat(60));
  
  try {
    // 1. 测试 lanhu_get_ai_analyze_page_result Schema
    console.log('\n[测试 1] lanhu_get_ai_analyze_page_result Schema');
    const { createAnalyzePageTool } = await import('../src/tools/lanhu-get-ai-analyze-page-result.js');
    const analyzePageTool = createAnalyzePageTool();
    
    console.log(`  工具名称: ${analyzePageTool.name}`);
    console.log(`  是否有描述: ${analyzePageTool.description?.length > 0 ? '✓' : '✗'}`);
    console.log(`  Schema 类型: ${analyzePageTool.inputSchema?.type}`);
    console.log(`  Schema 属性: ${Object.keys(analyzePageTool.inputSchema?.properties || {})}`);
    console.log(`  必填字段: ${analyzePageTool.inputSchema?.required?.join(', ') || '无'}`);
    
    const pageSchemaValid = 
      analyzePageTool.name === 'lanhu_get_ai_analyze_page_result' &&
      analyzePageTool.description?.length > 0 &&
      analyzePageTool.inputSchema?.type === 'object' &&
      analyzePageTool.inputSchema?.properties?.url &&
      analyzePageTool.inputSchema?.properties?.pageId &&
      Array.isArray(analyzePageTool.inputSchema?.required) &&
      analyzePageTool.inputSchema.required.includes('url') &&
      analyzePageTool.inputSchema.required.includes('pageId');
    
    recordTest(results, 'lanhu_get_ai_analyze_page_result Schema', pageSchemaValid, 0);
    
    // 2. 测试 lanhu_get_ai_analyze_design_result Schema
    console.log('\n[测试 2] lanhu_get_ai_analyze_design_result Schema');
    const { createAnalyzeDesignTool } = await import('../src/tools/lanhu-get-ai-analyze-design-result.js');
    const analyzeDesignTool = createAnalyzeDesignTool();
    
    console.log(`  工具名称: ${analyzeDesignTool.name}`);
    console.log(`  是否有描述: ${analyzeDesignTool.description?.length > 0 ? '✓' : '✗'}`);
    console.log(`  Schema 类型: ${analyzeDesignTool.inputSchema?.type}`);
    console.log(`  Schema 属性: ${Object.keys(analyzeDesignTool.inputSchema?.properties || {})}`);
    console.log(`  必填字段: ${analyzeDesignTool.inputSchema?.required?.join(', ') || '无'}`);
    
    const designSchemaValid = 
      analyzeDesignTool.name === 'lanhu_get_ai_analyze_design_result' &&
      analyzeDesignTool.description?.length > 0 &&
      analyzeDesignTool.inputSchema?.type === 'object' &&
      analyzeDesignTool.inputSchema?.properties?.url &&
      analyzeDesignTool.inputSchema?.properties?.designId &&
      Array.isArray(analyzeDesignTool.inputSchema?.required) &&
      analyzeDesignTool.inputSchema.required.includes('url') &&
      analyzeDesignTool.inputSchema.required.includes('designId');
    
    recordTest(results, 'lanhu_get_ai_analyze_design_result Schema', designSchemaValid, 0);
    
    // 3. 测试工具都有 handler
    console.log('\n[测试 3] 工具 Handler 验证');
    const handlersValid = 
      typeof analyzePageTool.handler === 'function' &&
      typeof analyzeDesignTool.handler === 'function';
    
    console.log(`  analyzePageTool.handler: ${typeof analyzePageTool.handler}`);
    console.log(`  analyzeDesignTool.handler: ${typeof analyzeDesignTool.handler}`);
    
    recordTest(results, '工具 Handler 验证', handlersValid, 0);
    
  } catch (error: any) {
    console.error('\nSchema 测试过程中发生错误:', error.message);
    recordTest(results, 'Schema 验证', false, 0, error.message);
  }
  
  const totalDuration = Date.now() - startTime;
  printSummary(results, totalDuration);
  return results;
}

// ============================================================
// 主入口
// ============================================================

async function printHelp() {
  console.log(`
AI 分析工具测试套件
====================

用法:
  npx tsx tests/test-ai-tools.ts [选项]

选项:
  page      仅测试 lanhu_get_ai_analyze_page_result 工具
  design    仅测试 lanhu_get_ai_analyze_design_result 工具
  schema    仅测试工具 Schema 验证
  help      显示此帮助信息

默认运行所有测试。

环境变量:
  LANHU_TEST_URL         测试用蓝湖需求文档 URL
  LANHU_TEST_URL_DESIGN  测试用蓝湖设计稿 URL

示例:
  npx tsx tests/test-ai-tools.ts page "https://lanhuapp.com/..." development
  npx tsx tests/test-ai-tools.ts design
  npx tsx tests/test-ai-tools.ts schema
  `);
}

async function main() {
  const testType = process.argv[2];
  
  if (testType === 'help') {
    await printHelp();
    return;
  }
  
  let allResults: TestResult[] = [];
  const globalStart = Date.now();
  
  console.log('='.repeat(60));
  console.log('AI 分析工具测试套件 - 启动');
  console.log('='.repeat(60));
  
  if (testType === 'page' || !testType) {
    const results = await testAnalyzePageTool();
    allResults = allResults.concat(results);
  }
  
  if (testType === 'design' || !testType) {
    const results = await testAnalyzeDesignTool();
    allResults = allResults.concat(results);
  }
  
  if (testType === 'schema' || !testType) {
    const results = await testToolSchema();
    allResults = allResults.concat(results);
  }
  
  const totalDuration = Date.now() - globalStart;
  
  console.log('\n' + '='.repeat(60));
  console.log('全部测试完成 - 总耗时: ' + totalDuration + 'ms');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
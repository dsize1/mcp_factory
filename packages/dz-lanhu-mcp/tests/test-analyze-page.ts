/**
 * 测试 lanhu_get_ai_analyze_page_result 工具
 * 
 * 运行方式: npx tsx tests/test-analyze-page.ts [url] [pageId] [mode]
 * 
 * 参数说明:
 *   - url: 蓝湖需求文档 URL（可选，默认从 .env 读取）
 *   - pageId: 页面 ID（可选，需要先获取页面列表）
 *   - mode: 分析模式 development/testing/explore（可选，默认 development）
 * 
 * 示例:
 *   npx tsx tests/test-analyze-page.ts
 *   npx tsx tests/test-analyze-page.ts "https://lanhuapp.com/product/xxx" "pageId123" development
 */

// 加载 .env 文件
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { lanhuApi } from '../src/api/client.js';

// 测试参数
const TEST_URL =
  process.argv[2] ||
  process.env.LANHU_TEST_URL ||
  'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=d6e1502802bc4ad49ce78f8d6b4e83de&share_type=quickShare';

const TEST_PAGE_ID = process.argv[3];
const TEST_MODE = (process.argv[4] || 'development') as 'development' | 'testing' | 'explore';

/**
 * 从蓝湖 hash 路由 URL 中提取查询参数
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

async function testAnalyzePage() {
  console.log('=== lanhu_get_ai_analyze_page_result 工具测试 ===\n');
  console.log('测试链接:', TEST_URL);
  console.log('分析模式:', TEST_MODE);

  try {
    // 1. 从 URL 中提取参数
    const hashParams = extractHashParams(TEST_URL);
    const docId = hashParams.docId || hashParams.doc_id;
    const teamId = hashParams.tid || hashParams.team_id;
    const projectId = hashParams.pid || hashParams.project_id;
    
    console.log('\nURL 解析结果:');
    console.log('  docId:', docId);
    console.log('  tid (teamId):', teamId);
    console.log('  pid (projectId):', projectId);

    if (!docId) {
      console.error('\n错误: URL 中缺少 docId 参数');
      console.error('请提供包含 docId 的蓝湖 URL');
      process.exit(1);
    }

    // 2. 获取页面列表
    console.log('\n正在获取页面列表...');
    const pagesList = await lanhuApi.getPagesList(docId || '', teamId, projectId);
    
    console.log(`找到 ${pagesList.total_pages} 个页面`);
    console.log('文档名称:', pagesList.document_name);

    if (pagesList.pages.length === 0) {
      console.error('\n错误: 没有找到任何页面');
      process.exit(1);
    }

    // 3. 选择要测试的页面
    let targetPageId: string;
    if (TEST_PAGE_ID) {
      targetPageId = TEST_PAGE_ID;
    } else {
      // 默认选择第一个页面
      targetPageId = pagesList.pages[0].id;
      console.log('\n使用第一个页面进行测试');
    }

    // 显示页面列表供参考
    console.log('\n可用页面列表:');
    pagesList.pages.slice(0, 10).forEach((page) => {
      const indent = '  '.repeat(page.level + 1);
      const icon = page.has_children ? '📁 ' : '📄 ';
      const marker = page.id === targetPageId ? ' <- 测试' : '';
      console.log(`${indent}${icon}${page.name}${marker}`);
    });

    // 4. 获取目标页面的 HTML 内容
    const targetPage = pagesList.pages.find((p: { id: string }) => p.id === targetPageId);
    if (!targetPage) {
      console.error(`\n错误: 未找到页面 ID 为 "${targetPageId}" 的页面`);
      process.exit(1);
    }

    console.log(`\n正在获取页面 "${targetPage.name}" 的 HTML 内容...`);
    // 使用 signMd5（与工具实现一致）
    const htmlKey = targetPage.signMd5 || targetPage.filename;
    console.log('  HTML key (signMd5):', targetPage.signMd5 || '无，使用 filename');
    const htmlContent = await lanhuApi.getPageHtml(htmlKey);
    console.log(`HTML 内容长度: ${htmlContent.length} 字符`);

    if (!htmlContent || htmlContent.length === 0) {
      console.error('\n错误: 无法获取页面 HTML 内容');
      process.exit(1);
    }

    // 5. 使用 Playwright 分析页面
    console.log('\n正在使用 Playwright 分析页面...');
    console.log('  - 启动浏览器');
    console.log('  - 加载 HTML 内容');
    console.log('  - 提取文本、样式、交互信息');
    console.log('  - 截取全屏截图');

    // 动态导入 playwright 分析模块
    const { analyzeAxurePage } = await import('../src/utils/playwright-browser.js');
    
    const analysisResult = await analyzeAxurePage(htmlContent, targetPage.name, {
      fullPage: true,
      waitForTimeout: 3000,
    });

    // 6. 输出分析结果
    console.log('\n=== 分析结果 ===');
    console.log('页面名称:', targetPage.name);
    console.log('分析模式:', TEST_MODE);
    
    console.log('\n--- 页面文本内容 ---');
    console.log(analysisResult.textContent);
    
    console.log('\n--- 设计样式信息 ---');
    console.log(analysisResult.designStyleInfo);
    
    console.log('\n--- 交互行为 ---');
    console.log(analysisResult.interactionGuide);
    
    console.log('\n--- 截图信息 ---');
    console.log('截图宽度:', analysisResult.screenshotWidth);
    console.log('截图高度:', analysisResult.screenshotHeight);
    console.log('截图长度:', analysisResult.screenshot?.length || 0, '字符');
    console.log('截图格式: PNG (base64)');

    console.log('\n=== 测试完成 ===');
    console.log('\n下一步: 将以上分析结果（文本、样式、交互、截图）发送给 AI 模型进行智能分析');

  } catch (error: any) {
    console.error('\n=== 测试失败 ===');
    console.error('错误:', error.message);
    if (error.stack) {
      console.error('\n堆栈跟踪:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testAnalyzePage();
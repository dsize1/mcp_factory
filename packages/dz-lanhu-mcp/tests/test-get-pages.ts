/**
 * 测试 lanhu_get_pages 工具
 * 使用提供的蓝湖链接验证页面列表获取功能
 * 
 * 运行方式: npx tsx tests/test-get-pages.ts
 */

// 加载 .env 文件
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { lanhuApi } from '../src/api/client.js';

// 测试链接 - 可以从命令行参数或环境变量传入
const TEST_URL =
  process.argv[2] ||
  process.env.LANHU_TEST_URL ||
  'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=a0f6ae267133420e8cc5eee1e2d62f14&share_type=quickShare&parentId=52a222635cc64802a7ae808537fc9879';

/**
 * 从蓝湖 hash 路由 URL 中提取查询参数
 * 蓝湖的 Web 应用使用 hash 路由，参数格式如: #/item/project/product?param1=value1&param2=value2
 */
function extractHashParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  try {
    const parsed = new URL(url);
    
    // 从 hash 中提取查询字符串
    const hash = parsed.hash; // 例如: #/item/project/product?tid=xxx&pid=xxx
    const queryIndex = hash.indexOf('?');
    
    if (queryIndex !== -1) {
      const queryString = hash.substring(queryIndex + 1);
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
  } catch {
    // 如果 URL 解析失败，尝试手动提取
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

async function testGetPages() {
  console.log('=== lanhu_get_pages 工具测试 ===\n');
  console.log('测试链接:', TEST_URL);

  try {
    // 1. 从 hash 路由中提取参数
    const hashParams = extractHashParams(TEST_URL);
    const docId = hashParams.docId || hashParams.doc_id;
    const teamId = hashParams.tid || hashParams.team_id;
    const projectId = hashParams.pid || hashParams.project_id;
    
    console.log('\nURL 解析结果:');
    console.log('  docId:', docId);
    console.log('  tid (teamId):', teamId);
    console.log('  pid (projectId):', projectId);
    console.log('  所有参数:', JSON.stringify(hashParams, null, 2));

    if (!docId) {
      console.error('\n错误: URL 中缺少 docId 参数');
      process.exit(1);
    }

    // 2. 获取页面列表
    console.log('\n正在获取页面列表...');
    
    const result = await lanhuApi.getPagesList(docId, teamId, projectId);

    // 3. 输出结果
    console.log('\n=== 获取成功 ===');
    console.log('文档 ID:', result.document_id);
    console.log('文档名称:', result.document_name);
    console.log('文档类型:', result.document_type);
    console.log('页面总数:', result.total_pages);
    console.log('最大层级:', result.max_level);
    console.log('有子页面数:', result.pages_with_children);
    console.log(
      '文件夹统计:',
      JSON.stringify(result.folder_statistics, null, 2)
    );

    if (result.pages.length > 0) {
      console.log('\n页面列表 (前20个):');
      result.pages.slice(0, 20).forEach((page) => {
        const indent = '  '.repeat(page.level + 1);
        const icon = page.has_children ? '📁 ' : '📄 ';
        console.log(
          `${indent}${icon}${page.index}. [${page.folder}] ${page.name}`
        );
      });
      if (result.pages.length > 20) {
        console.log(`  ... 还有 ${result.pages.length - 20} 个页面`);
      }
    } else {
      console.log('\n没有找到页面');
    }

    console.log('\n=== 测试完成 ===');
  } catch (error: any) {
    console.error('\n=== 测试失败 ===');
    console.error('错误:', error.message);
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
    process.exit(1);
  }
}

testGetPages();
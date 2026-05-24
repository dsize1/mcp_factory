/**
 * 测试 lanhu_get_designs 工具
 * 使用提供的蓝湖链接验证设计稿列表获取功能
 * 
 * 运行方式: npx tsx tests/test-get-designs.ts [蓝湖设计稿 URL]
 */

// 加载 .env 文件
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { lanhuApi } from '../src/api/client.js';
import { parseLanhuUrl } from '../src/utils/url-parser.js';

// 测试链接 - 可以从命令行参数或环境变量传入
const TEST_URL =
  process.argv[2] ||
  process.env.LANHU_TEST_URL ||
  'https://lanhuapp.com/design/#/project?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&stage_id=xxx';

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

async function testGetDesigns() {
  console.log('=== lanhu_get_designs 工具测试 ===\n');
  console.log('测试链接:', TEST_URL);

  try {
    // 1. 解析 URL
    const hashParams = extractHashParams(TEST_URL);
    const parsed = parseLanhuUrl(TEST_URL);
    
    const teamId = parsed.teamId || hashParams.tid || hashParams.team_id;
    const projectId = parsed.projectId || hashParams.pid || hashParams.project_id;
    const stageId = parsed.stageId || hashParams.stage_id;
    
    console.log('\nURL 解析结果:');
    console.log('  类型:', parsed.type);
    console.log('  tid (teamId):', teamId);
    console.log('  pid (projectId):', projectId);
    console.log('  stageId:', stageId);
    console.log('  所有参数:', JSON.stringify(hashParams, null, 2));

    if (!stageId) {
      console.error('\n错误: URL 中缺少 stage_id 参数');
      console.error('请确保使用的是蓝湖设计稿项目 URL（包含 stage_id 参数）');
      console.error('示例: https://lanhuapp.com/design/#/project?tid=xxx&pid=xxx&stage_id=xxx');
      process.exit(1);
    }

    // 2. 获取设计稿列表
    console.log('\n正在获取设计稿列表...');
    
    const designs = await lanhuApi.getDesignsList(stageId, teamId, projectId);

    // 3. 输出结果
    console.log('\n=== 获取成功 ===');
    console.log('设计稿阶段 ID:', stageId);
    console.log('设计稿总数:', designs.length);

    if (designs.length > 0) {
      console.log('\n设计稿列表 (前20个):');
      designs.slice(0, 20).forEach((design, index) => {
        console.log(`\n  ${index + 1}. ${design.name}`);
        console.log(`     ID: ${design.id}`);
        console.log(`     项目 ID: ${design.project_id}`);
        console.log(`     创建者 ID: ${design.creator_id}`);
        console.log(`     创建时间: ${design.created_at || '未知'}`);
        console.log(`     更新时间: ${design.updated_at || '未知'}`);
        if (design.thumb_url) {
          console.log(`     缩略图: ${design.thumb_url}`);
        }
        if (design.original_url) {
          console.log(`     原图: ${design.original_url}`);
        }
      });
      if (designs.length > 20) {
        console.log(`\n  ... 还有 ${designs.length - 20} 个设计稿`);
      }
    } else {
      console.log('\n没有找到设计稿');
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

testGetDesigns();
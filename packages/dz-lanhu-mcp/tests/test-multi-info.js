/**
 * 测试 api/project/multi_info 返回值
 * 
 * 运行方式: node tests/test-multi-info.js
 */

// 显式加载 .env 文件
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: new URL('./.env', import.meta.url).pathname });

import { lanhuApi } from '../dist/api/client.js';

async function main() {
  console.log('=== 测试 api/project/multi_info ===\n');
  
  try {
    const result = await lanhuApi.getPagesList(
      '595b94bf-d55d-410b-8ad9-30ae69c35fa8',
      '9d0cc383-1d67-4ca3-85ff-02527bbff1a2',
      'b8308614-4b08-4f06-ab75-6919c5ffa3ac'
    );
    
    console.log('\n=== 结果 ===');
    console.log('文档名:', result.document_name);
    console.log('页面数:', result.total_pages);
    console.log('\n测试完成');
  } catch (error) {
    console.error('错误:', error.message);
    if (error.response) {
      console.error('响应:', error.response);
    }
  }
}

main();
/**
 * 调试 API 响应的测试脚本
 */

import { config, BASE_URL } from '../src/config.js';

async function debugApiCall() {
  const docId = '595b94bf-d55d-410b-8ad9-30ae69c35fa8';
  const projectId = 'b8308614-4b08-4f06-ab75-6919c5ffa8ac';
  
  const url = `${BASE_URL}/api/project/image?pid=${projectId}&image_id=${docId}`;
  
  console.log('Testing URL:', url);
  console.log('BASE_URL:', BASE_URL);
  console.log('Cookie prefix:', config.lanhuCookie?.substring(0, 50) + '...');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'dz-lanhu-mcp/1.0.0',
        'Accept': 'application/json',
        'Cookie': config.lanhuCookie || '',
      },
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\n--- Response Body ---');
    console.log(text.substring(0, 2000));
    console.log('--- End ---');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

debugApiCall();
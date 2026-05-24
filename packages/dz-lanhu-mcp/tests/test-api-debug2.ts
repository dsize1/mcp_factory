/**
 * 调试 API 响应的测试脚本 v2
 */

import { BASE_URL } from '../src/config.js';
import dotenv from 'dotenv';
dotenv.config();

async function debugApiCall() {
  const docId = '595b94bf-d55d-410b-8ad9-30ae69c35fa8';
  const projectId = 'b8308614-4b08-4f06-ab75-6919c5ffa3ac';  // 新的 pid
  const cookie = process.env.LANHU_COOKIE || '';
  
  const url = `${BASE_URL}/api/project/image?pid=${projectId}&image_id=${docId}`;
  
  console.log('Testing URL:', url);
  console.log('Cookie length:', cookie.length);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'dz-lanhu-mcp/1.0.0',
        'Accept': 'application/json',
        'Cookie': cookie,
      },
    });
    
    console.log('Status:', response.status);
    
    const text = await response.text();
    console.log('\n--- Response Body ---');
    console.log(text.substring(0, 3000));
    console.log('--- End ---');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

debugApiCall();
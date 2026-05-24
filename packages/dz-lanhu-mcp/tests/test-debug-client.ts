/**
 * 调试 LanhuAPIClient 的测试脚本
 */

import { lanhuApi } from '../src/api/client.js';

async function debugClient() {
  const docId = '595b94bf-d55d-410b-8ad9-30ae69c35fa8';
  const teamId = '9d0cc383-1d67-4ca3-85ff-02527bbff1a2';
  const projectId = 'b8308614-4b08-4f06-ab75-6919c5ffa3ac';
  
  console.log('Testing getProductDetail...');
  console.log('docId:', docId);
  console.log('teamId:', teamId);
  console.log('projectId:', projectId);
  
  try {
    const result = await lanhuApi.getProductDetail(docId, teamId, projectId);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

debugClient();
/**
 * 端到端测试：模拟 Cline 中 lanhu_get_ai_analyze_page_result 的调用
 */

import { lanhuApi } from '../src/api/client.js';

async function testE2E() {
  // 使用 Cline 中完全相同的 URL
  const url = 'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=d6e1502802bc4ad49ce78f8d6b4e83de&share_type=quickShare';
  const pageId = 'd6e1502802bc4ad49ce78f8d6b4e83de';

  console.log('=== 端到端测试 ===');
  console.log('URL:', url);
  console.log('pageId:', pageId);
  console.log('');

  try {
    // 步骤 1: 解析 URL
    console.log('步骤 1: 解析 URL...');
    const parsedUrl = lanhuApi.parseUrl(url);
    console.log('解析结果:', JSON.stringify(parsedUrl, null, 2));

    if (parsedUrl.type !== 'product') {
      console.log('ERROR: URL 类型不是 product');
      return;
    }

    // 步骤 2: 获取产品详情
    console.log('\n步骤 2: 获取产品详情...');
    const docId = parsedUrl.docId || pageId;
    console.log('docId:', docId);
    console.log('teamId:', parsedUrl.teamId);
    console.log('projectId:', parsedUrl.projectId);

    const productDetail = await lanhuApi.getProductDetail(docId, parsedUrl.teamId, parsedUrl.projectId);
    console.log('产品详情:', JSON.stringify(productDetail, null, 2));

    // 步骤 3: 获取页面列表
    console.log('\n步骤 3: 获取页面列表...');
    const pagesList = await lanhuApi.getPagesList(docId, parsedUrl.teamId, parsedUrl.projectId);
    console.log('页面数量:', pagesList.pages?.length);
    console.log('页面列表:', JSON.stringify(pagesList.pages?.slice(0, 3), null, 2));

    // 查找目标页面
    const targetPage = pagesList.pages?.find((p: any) => p.id === pageId);
    if (!targetPage) {
      console.log('ERROR: 未找到页面 ID 为 "%s" 的页面', pageId);
      return;
    }
    console.log('目标页面:', targetPage.name, targetPage.id);

    console.log('\n=== 测试成功 ===');
  } catch (error: any) {
    console.error('ERROR:', error.message);
    console.error('Full error:', error);
  }
}

testE2E();
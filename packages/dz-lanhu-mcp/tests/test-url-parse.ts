/**
 * 测试 URL 解析功能
 */

import { parseLanhuUrl } from '../src/utils/url-parser.js';

const testUrl = 'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=d6e1502802bc4ad49ce78f8d6b4e83de&share_type=quickShare';

console.log('测试 URL 解析:');
console.log('URL:', testUrl);
console.log('');

try {
  const result = parseLanhuUrl(testUrl);
  console.log('解析结果:');
  console.log(JSON.stringify(result, null, 2));
} catch (error: any) {
  console.error('解析失败:', error.message);
}
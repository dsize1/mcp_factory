/**
 * 直接测试 MCP 服务器进程的脚本
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP 服务器路径
const serverPath = path.resolve(__dirname, '../dist/index.js');

console.log('启动 MCP 服务器:', serverPath);

// 启动 MCP 服务器进程
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  // 不设置 LANHU_COOKIE，让 MCP 服务器从 .env 文件读取
  // 注意：dotenv 会从当前工作目录加载 .env 文件
  // 所以需要设置 cwd 选项
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    DEBUG: 'true',
  }
});

let outputBuffer = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  outputBuffer += output;
  console.log('[SERVER OUT]:', output.trim());
});

server.stderr.on('data', (data) => {
  console.error('[SERVER ERR]:', data.toString().trim());
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  console.log(`Server exited with code ${code} and signal ${signal}`);
});

// 等待服务器启动
setTimeout(async () => {
  console.log('\n--- 发送 initialize 请求 ---');
  
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n--- 发送 tools/list 请求 ---');
  
  const listRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(listRequest) + '\n');
  
  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n--- 发送 lanhu_get_ai_analyze_page_result 请求 ---');
  
  const toolRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'lanhu_get_ai_analyze_page_result',
      arguments: {
        url: 'https://lanhuapp.com/web/#/item/project/product?tid=9d0cc383-1d67-4ca3-85ff-02527bbff1a2&pid=b8308614-4b08-4f06-ab75-6919c5ffa3ac&image_id=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docId=595b94bf-d55d-410b-8ad9-30ae69c35fa8&docType=axure&versionId=c8918c77-a785-4f78-9af5-86bdddc57b14&pageId=d6e1502802bc4ad49ce78f8d6b4e83de&share_type=quickShare',
        pageId: 'd6e1502802bc4ad49ce78f8d6b4e83de',
        mode: 'development'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(toolRequest) + '\n');
  
  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('\n--- 完整输出 ---');
  console.log(outputBuffer);
  
  server.kill();
  process.exit(0);
}, 3000);
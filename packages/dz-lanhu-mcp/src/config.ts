/**
 * 配置管理模块
 * 
 * 从环境变量读取配置，提供类型安全的配置对象
 */

// Unused imports removed - will be used in future implementation

// ============================================================
// 配置接口定义
// ============================================================

export interface LanhuConfig {
  /** 蓝湖 Cookie（必需） */
  lanhuCookie: string;
  /** DDS Cookie（可选，默认为蓝湖 Cookie） */
  ddsCookie: string;
  /** 数据存储目录 */
  dataDir: string;
  /** HTTP 请求超时时间（秒） */
  httpTimeout: number;
  /** 浏览器视口宽度 */
  viewportWidth: number;
  /** 浏览器视口高度 */
  viewportHeight: number;
  /** 飞书 Webhook URL */
  feishuWebhookUrl: string;
  /** 调试模式 */
  debug: boolean;
}

// ============================================================
// 配置加载
// ============================================================

/**
 * 从环境变量加载配置
 */
function loadConfig(): LanhuConfig {
  const lanhuCookie = process.env.LANHU_COOKIE || '';

  // 验证必需的环境变量
  if (!lanhuCookie || lanhuCookie === 'your_lanhu_cookie_here') {
    console.warn(`
⚠️  警告: 未设置 LANHU_COOKIE 环境变量！

请执行以下步骤：
1. 复制 .env.example 文件为 .env
2. 登录蓝湖网页版 (https://lanhuapp.com)
3. 按 F12 打开开发者工具 -> Network 标签
4. 刷新页面，点击任意请求，复制请求头中的 Cookie
5. 将 Cookie 值填入 .env 文件中的 LANHU_COOKIE

或者在启动时设置环境变量：
  export LANHU_COOKIE="your_cookie_here"  # Linux/Mac
  set LANHU_COOKIE=your_cookie_here        # Windows
`);
  }

  return {
    // 必需配置
    lanhuCookie,
    
    // DDS Cookie 默认与蓝湖 Cookie 相同
    ddsCookie: process.env.DDS_COOKIE || lanhuCookie,
    
    // 数据存储目录
    dataDir: process.env.DATA_DIR || './data',
    
    // HTTP 超时时间
    httpTimeout: parseInt(process.env.HTTP_TIMEOUT || '30', 10),
    
    // 浏览器视口尺寸
    viewportWidth: parseInt(process.env.VIEWPORT_WIDTH || '1920', 10),
    viewportHeight: parseInt(process.env.VIEWPORT_HEIGHT || '1080', 10),
    
    // 飞书 Webhook
    feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL || '',
    
    // 调试模式
    debug: process.env.DEBUG?.toLowerCase() === 'true',
  };
}

// ============================================================
// 导出配置实例
// ============================================================

/** 全局配置实例 */
export const config = loadConfig();

/** HTTP 请求超时时间（毫秒） */
export const HTTP_TIMEOUT_MS = (config.httpTimeout || 30) * 1000;

/** 蓝湖基础 URL */
export const BASE_URL = 'https://lanhuapp.com';

/** DDS 基础 URL */
export const DDS_BASE_URL = 'https://dds.lanhuapp.com';

/** CDN 资源 URL */
export const CDN_URL = 'https://axure-file.lanhuapp.com';

/** 
 * 飞书用户 ID 映射
 * 用于 @提醒功能，将用户名映射到飞书用户 ID
 */
export const FEISHU_USER_ID_MAP: Record<string, string> = {
  // 请根据实际团队成员修改以下映射
  // '张三': '0000000000000000001',
  // '李四': '0000000000000000002',
};

/** 
 * 允许 @ 提醒的具体人名列表
 * 只允许具体人名，禁止使用角色名
 */
export const ALLOWED_MENTIONS = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八',
  '周九', '吴十', '郑十一', '冯十二', '陈十三', '褚十四',
  '卫十五', '蒋十六', '沈十七', '韩十八', '杨十九', '朱二十',
];

/** 
 * 角色映射规则
 * 用于自动识别用户角色
 * 格式: [[关键词数组], 标准角色名]
 */
export interface RoleMappingRule {
  keywords: string[];
  role: string;
}

export const ROLE_MAPPING_RULES: RoleMappingRule[] = [
  // 后端相关
  { keywords: ['后端', 'backend', '服务端', 'server', 'java', 'php', 'python', 'go', 'golang', 'node', 'nodejs', '.net', 'c#'], role: '后端' },
  // 前端相关
  { keywords: ['前端', 'frontend', 'h5', 'web', 'vue', 'react', 'angular', 'javascript', 'js', 'ts', 'typescript', 'css'], role: '前端' },
  // 客户端相关
  { keywords: ['客户端', 'client', 'ios', 'android', '安卓', '移动端', 'mobile', 'app', 'flutter', 'rn', 'react native', 'swift', 'kotlin'], role: '客户端' },
  // 运维相关
  { keywords: ['运维', 'ops', 'devops', 'sre', 'dba', '运营维护', '系统管理', 'infra'], role: '运维' },
  // 产品相关
  { keywords: ['产品', 'product', 'pm', '产品经理', '需求'], role: '产品' },
  // 项目经理相关
  { keywords: ['项目经理', '项目', 'pmo', 'project manager', 'scrum', '敏捷'], role: '项目经理' },
  // 开发（通用，优先级最低）
  { keywords: ['开发', 'dev', 'developer', '程序员', 'coder', 'engineer', '工程师'], role: '开发' },
];

/** 留言类型枚举 */
export const MESSAGE_TYPES = ['normal', 'task', 'question', 'urgent', 'knowledge'] as const;
export type MessageType = typeof MESSAGE_TYPES[number];

/** 分析模式枚举 */
export const ANALYSIS_MODES = ['development', 'testing', 'explore'] as const;
export type AnalysisMode = typeof ANALYSIS_MODES[number];
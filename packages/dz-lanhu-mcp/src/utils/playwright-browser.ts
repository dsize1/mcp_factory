// @ts-nocheck
/**
 * Playwright 浏览器工具
 *
 * 提供 headless 浏览器能力，用于：
 * 1. Axure 原型页面截图（full_page screenshot）
 * 2. 从 Axure HTML 页面提取文本内容
 * 3. 从 Axure HTML 页面提取设计样式信息
 *
 * 基于 Python 参考实现中的 AxureExtractor 类
 *
 * NOTE: 此文件使用 @ts-nocheck 因为 page.evaluate 回调在浏览器上下文中执行，
 * 可以访问 document/window 等 DOM API，但 tsconfig 仅配置了 Node.js 类型。
 */

import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import { config } from '../config.js';

// 全局浏览器实例（避免重复启动）
let globalBrowser = null;
let browserInited = false;

/** 截图配置 */

/** 页面分析结果 */

/**
 * 初始化浏览器实例
 */
async function initBrowser() {
  if (globalBrowser) {
    return globalBrowser;
  }

  if (!browserInited) {
    browserInited = true;
    // 默认 headless 模式，可通过环境变量 PLAYWRIGHT_HEADLESS=false 切换
    const headlessEnv = process.env.PLAYWRIGHT_HEADLESS;
    const headless = headlessEnv === 'false' ? false : true;
    globalBrowser = await chromium.launch({
      headless: headless,
      timeout: (config.httpTimeout || 30) * 1000,
    });
  }

  return globalBrowser;
}

/**
 * 关闭浏览器实例
 */
export async function closeBrowser() {
  if (globalBrowser) {
    await globalBrowser.close();
    globalBrowser = null;
    browserInited = false;
  }
}

/**
 * 从 Axure HTML 页面提取文本内容
 *
 * 对应 Python: _extract_page_text
 *
 * NOTE: page.evaluate 的回调函数在浏览器上下文中执行，可以访问 document/window 等 DOM API
 */
async function extractTextContent(page) {
  const textContent = await page.evaluate(() => {
    const result = [];
    const doc = document;

    // 1. 提取页面标题
    const titleEl = doc.querySelector('#NoteContent') || doc.body?.querySelector('h1, h2, h3');
    if (titleEl) {
      result.push(`# ${(titleEl.textContent || '').trim() || ''}`);
    }

    // 2. 提取注释/说明文字
    const notes = doc.querySelectorAll('.note, .annotation, .comment, .comments');
    notes.forEach((note) => {
      const text = (note.textContent || '').trim();
      if (text) {
        result.push(`\n[说明] ${text}`);
      }
    });

    // 3. 提取所有文本
    const body = doc.body?.textContent?.trim();
    if (body) {
      result.push(`\n--- 页面内容 ---\n${body}`);
    }

    return result.join('\n');
  });

  return textContent || '';
}

/**
 * 从 Axure HTML 页面提取设计样式信息
 *
 * 对应 Python: _extract_design_style_info
 */
async function extractDesignStyleInfo(page) {
  const styleInfo = await page.evaluate(() => {
    const result = [];
    const doc = document;

    // 1. 提取全局样式（从 body 和 html 元素）
    const bodyEl = doc.body || doc.documentElement;
    const bodyStyle = doc.defaultView?.getComputedStyle(bodyEl);
    if (bodyStyle) {
      const bg = bodyStyle.backgroundColor;
      const fg = bodyStyle.color;
      const font = bodyStyle.fontFamily;
      const size = bodyStyle.fontSize;

      if (bg || fg || font) {
        result.push('## 全局样式');
        if (bg) result.push(`- 背景色: ${bg}`);
        if (fg) result.push(`- 前景色: ${fg}`);
        if (font) result.push(`- 字体: ${font}`);
        if (size) result.push(`- 字号: ${size}`);
        result.push('');
      }
    }

    // 2. 提取可见元素的样式
    const selectors = ['h1, h2, h3, h4, h5, h6', 'p', 'span', 'a', 'div[class*="label"], div[class*="title"]'];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      const seenStyles = new Map();

      elements.forEach((el) => {
        const text = (el.textContent || '').trim();
        if (!text || text.length > 100) return;

        const style = doc.defaultView?.getComputedStyle(el);
        if (!style) return;

        const key = `${style.fontSize}_${style.fontWeight}_${style.color}_${style.backgroundColor}`;
        if (seenStyles.has(key)) return;
        seenStyles.set(key, true);

        result.push(`## 样式: "${text}"`);
        result.push(`- 字体: ${style.fontFamily}`);
        result.push(`- 字号: ${style.fontSize}`);
        result.push(`- 字重: ${style.fontWeight}`);
        result.push(`- 颜色: ${style.color}`);
        if (style.backgroundColor) {
          result.push(`- 背景色: ${style.backgroundColor}`);
        }
        result.push('');
      });
    }

    // 3. 提取颜色和尺寸
    const colors = new Set();
    const sizes = new Set();

    doc.querySelectorAll('*').forEach((el) => {
      const style = doc.defaultView?.getComputedStyle(el);
      if (!style) return;
      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        colors.add(style.backgroundColor);
      }
      if (style.color && style.color !== 'rgb(0, 0, 0)') {
        colors.add(style.color);
      }
      const w = style.width;
      const h = style.height;
      if (w && w !== 'auto' && w !== '0px') sizes.add(`宽: ${w}`);
      if (h && h !== 'auto' && h !== '0px') sizes.add(`高: ${h}`);
    });

    if (colors.size > 0) {
      result.push('## 页面颜色');
      for (const c of colors) {
        result.push(`- ${c}`);
      }
      result.push('');
    }

    if (sizes.size > 0) {
      result.push('## 页面尺寸');
      for (const s of sizes) {
        result.push(`- ${s}`);
      }
      result.push('');
    }

    return result.join('\n');
  });

  return styleInfo || '';
}

/**
 * 从 Axure HTML 页面提取交互行为说明
 *
 * 对应 Python: _extract_interaction_info
 */
async function extractInteractionInfo(page) {
  const interactionInfo = await page.evaluate(() => {
    const result = [];
    const doc = document;

    // 1. 提取 onclick 事件
    const clickableEls = doc.querySelectorAll('*[onclick]');
    if (clickableEls.length > 0) {
      result.push('## 交互行为');
      clickableEls.forEach((el, i) => {
        const text = (el.textContent || '').trim().substring(0, 50) || '';
        const tagName = el.tagName.toLowerCase();
        const id = el.id || '';
        const cls = el.className?.toString?.() || '';
        result.push(
          `- [交互${i + 1}] <${tagName}> "${text}" (id: ${id}, class: ${cls}) - 绑定 onclick 事件`
        );
      });
      result.push('');
    }

    // 2. 提取可访问性信息
    const roles = doc.querySelectorAll('[role]');
    if (roles.length > 0) {
      result.push('## 组件类型');
      roles.forEach((el) => {
        const role = el.getAttribute('role');
        const text = (el.textContent || '').trim().substring(0, 50) || '';
        if (role && text) {
          result.push(`- ${role}: "${text}"`);
        }
      });
      result.push('');
    }

    // 3. 提取表单元素
    const forms = doc.querySelectorAll('input, select, textarea');
    if (forms.length > 0) {
      result.push('## 表单元素');
      forms.forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        const type = el.getAttribute('type') || '';
        const name = el.getAttribute('name') || '';
        const placeholder = el.getAttribute('placeholder') || '';
        const label = (el.closest('label')?.textContent || '').trim();
        result.push(`- <${tagName}> type="${type}" name="${name}" placeholder="${placeholder}" ${label ? `label="${label}"` : ''}`);
      });
      result.push('');
    }

    return result.join('\n');
  });

  return interactionInfo || '';
}

/**
 * 对 Axure HTML 页面进行截图
 *
 * 对应 Python: AxureExtractor.screenshot_axure_page
 */
export async function screenshotAxurePage(
  htmlContent,
  options = {}
) {
  const browser = await initBrowser();
  const page = await browser.newPage();

  try {
    // 设置视口
    const viewportWidth = options.viewportWidth || 1440;
    const viewportHeight = options.viewportHeight || 900;
    await page.setViewportSize({ width: viewportWidth, height: viewportHeight });

    // 加载 HTML 内容
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    // 等待自定义时间
    if (options.waitForTimeout) {
      await page.waitForTimeout(options.waitForTimeout);
    } else {
      // 默认等待 Axure JS 加载
      await page.waitForTimeout(2000);
    }

    // 截图
    const screenshot = await page.screenshot({
      fullPage: options.fullPage !== false,
      type: 'png',
    });

    const width = page.viewportSize()?.width || viewportWidth;
    const height = page.viewportSize()?.height || viewportHeight;

    return {
      data: screenshot.toString('base64'),
      width: width,
      height: height,
    };
  } finally {
    await page.close();
  }
}

/**
 * 分析 Axure 原型页面
 *
 * 对应 Python: AxureExtractor.analyze_axure_page
 *
 * 执行流程：
 * 1. 加载 HTML 内容到 headless 浏览器
 * 2. 等待页面加载完成（Axure JS 执行）
 * 3. 截图（full_page）
 * 4. 提取文本内容
 * 5. 提取设计样式信息
 * 6. 提取交互行为说明
 */
export async function analyzeAxurePage(
  htmlContent,
  _pageName,
  options = {}
) {
  const browser = await initBrowser();
  const page = await browser.newPage();

  try {
    // 设置视口（宽屏，适合原型展示）
    const viewportWidth = options.viewportWidth || 1440;
    const viewportHeight = options.viewportHeight || 900;
    await page.setViewportSize({ width: viewportWidth, height: viewportHeight });

    // 加载 HTML 内容
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    // 等待自定义时间或默认等待 Axure JS 执行
    if (options.waitForTimeout) {
      await page.waitForTimeout(options.waitForTimeout);
    } else {
      await page.waitForTimeout(3000);
    }

    // 1. 截图
    let screenshotData;
    let screenshotWidth;
    let screenshotHeight;

    if (options.fullPage !== false) {
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      screenshotData = screenshot.toString('base64');
      screenshotWidth = viewportWidth;
      // 获取页面实际高度
      const heightValue = await page.evaluate(() => document.documentElement.scrollHeight);
      screenshotHeight = heightValue || viewportHeight;
    }

    // 2. 提取文本内容
    const textContent = await extractTextContent(page);

    // 3. 提取设计样式信息
    const designStyleInfo = await extractDesignStyleInfo(page);

    // 4. 提取交互行为说明
    const interactionInfo = await extractInteractionInfo(page);

    return {
      textContent: textContent || '（无文本内容）',
      designStyleInfo: designStyleInfo || '（无设计样式信息）',
      interactionGuide: interactionInfo || '（无交互行为）',
      screenshot: screenshotData,
      screenshotWidth,
      screenshotHeight,
    };
  } finally {
    await page.close();
  }
}
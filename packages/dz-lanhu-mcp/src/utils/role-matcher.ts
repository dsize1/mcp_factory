/**
 * 角色匹配工具
 * 
 * 根据关键词匹配用户角色
 */

import { ROLE_MAPPING_RULES, ALLOWED_MENTIONS, type RoleMappingRule } from '../config.js';

/**
 * 根据内容匹配角色
 */
export function matchRole(text: string): string | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  for (const rule of ROLE_MAPPING_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return rule.role;
      }
    }
  }

  return null;
}

/**
 * 检查用户名是否是允许的提醒对象
 */
export function isAllowedMention(name: string): boolean {
  return ALLOWED_MENTIONS.some(
    (allowed) => allowed === name || allowed.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * 从内容中提取被提醒的用户
 */
export function extractMentions(content: string): string[] {
  const mentions: string[] = [];
  const mentionRegex = /@([^\s@]+)/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const name = match[1];
    if (isAllowedMention(name) && !mentions.includes(name)) {
      mentions.push(name);
    }
  }

  return mentions;
}

/**
 * 验证提醒用户
 * 返回有效和无效的提醒列表
 */
export function validateMentions(mentions: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const name of mentions) {
    if (isAllowedMention(name)) {
      valid.push(name);
    } else {
      invalid.push(name);
    }
  }

  return { valid, invalid };
}
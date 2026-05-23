/**
 * 协作者 API
 * 
 * 负责与蓝湖项目协作者相关的 API 交互
 */

import type { LanhuMember, LanhuCollaborator, ApiResponse } from '../types.js';

/**
 * 获取项目成员列表
 */
export async function getProjectMembers(projectId: string): Promise<ApiResponse<LanhuMember[]>> {
  // TODO: 实现项目成员列表获取
  throw new Error('Not implemented: getProjectMembers');
}

/**
 * 获取项目协作者及访问记录
 */
export async function getProjectCollaborators(projectId: string): Promise<ApiResponse<LanhuCollaborator[]>> {
  // TODO: 实现协作者列表获取
  throw new Error('Not implemented: getProjectCollaborators');
}

/**
 * 记录用户访问
 */
export async function recordUserAccess(
  projectId: string,
  userName: string,
  userRole: string
): Promise<ApiResponse<void>> {
  // TODO: 实现用户访问记录
  throw new Error('Not implemented: recordUserAccess');
}
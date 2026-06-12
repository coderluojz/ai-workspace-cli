/**
 * @file 文件同步状态与数据结构的 TypeScript 类型定义
 * @description 遵循类型安全原则，禁止使用 any
 */

/**
 * 文件同步的状态枚举
 */
export enum FileSyncStatus {
  /** 目标文件不存在，成功新增拷贝 */
  ADDED = 'ADDED',
  /** 两端文件 MD5 一致，无需改动 */
  UNCHANGED = 'UNCHANGED',
  /** 两端文件内容不一致且发生冲突 */
  CONFLICT = 'CONFLICT',
  /** 用户选择不覆盖，跳过同步 */
  SKIPPED = 'SKIPPED',
  /** 用户选择覆盖，旧文件已成功备份归档，新文件覆盖写入 */
  OVERWRITTEN = 'OVERWRITTEN',
}

/**
 * 规范文件元数据接口
 */
export interface ISpecFile {
  /** 相对包根目录的相对路径，例如 'rules/global.md' */
  relativeSrcPath: string;
  /** 包内规范文件的绝对路径 */
  absoluteSrcPath: string;
  /** 目标项目中输出规范文件的绝对路径 */
  absoluteDestPath: string;
}

/**
 * 单个规范文件同步的结果报告
 */
export interface ISyncResult {
  /** 同步的文件相对路径 */
  filePath: string;
  /** 同步的状态结果 */
  status: FileSyncStatus;
  /** 如果发生了备份，对应备份文件的绝对路径 */
  backupPath?: string;
}

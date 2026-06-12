/**
 * @file 全局静态常量字典
 * @description 严格遵守消灭硬编码规范
 */

/**
 * 默认需要同步的文件夹目录名称
 */
export const SYNC_DIRECTORIES = ['rules', 'skills'] as const;

/**
 * 目标项目中的输出根目录
 */
export const TARGET_WORKSPACE_DIR = '.ai-workspace';

/**
 * 备份目录相对目标项目的根路径
 */
export const BACKUP_DIR_NAME = '.backup';

/**
 * 命令行提示文本常量字典
 */
export const CLI_PROMPTS = {
  OVERWRITE_CONFIRM: (filePath: string, backupPath: string) => 
    `检测到目标文件已修改: ${filePath}。\n是否使用包内最新版本覆盖？\n⚠️  注意: 若选择覆盖，您的本地修改将被备份至: ${backupPath}`,
  INIT_SUCCESS: '🎉 AI Workspace 规范同步完成！',
  INIT_START: '🚀 开始同步 AI Workspace 规范...',
  NO_FILES_FOUND: '⚠️  未在包内找到可同步的规范文件。',
} as const;

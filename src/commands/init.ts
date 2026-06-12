/**
 * @file init 初始化与同步命令主逻辑
 * @description 严格遵守单一职责原则，单函数不超过 50 行，包含完整的异常捕获
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';
import prompts from 'prompts';
import { FileSyncStatus, ISpecFile, ISyncResult } from '../types/index.js';
import { 
  SYNC_DIRECTORIES, 
  TARGET_WORKSPACE_DIR, 
  BACKUP_DIR_NAME, 
  CLI_PROMPTS 
} from '../constants.js';
import { getFileMd5 } from '../utils/crypto.js';

/**
 * 递归获取目录下所有文件的绝对路径
 */
function getFilesRecursive(dirPath: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dirPath)) {
    return results;
  }
  try {
    const list = fs.readdirSync(dirPath);
    for (const file of list) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        results = results.concat(getFilesRecursive(filePath));
      } else {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error(`[Scan Error] 读取目录失败: ${dirPath}`, error);
  }
  return results;
}

/**
 * 扫描并构造待同步的规范文件列表
 */
export function scanPackageFiles(packageRootDir: string): ISpecFile[] {
  const specFiles: ISpecFile[] = [];
  const destWorkspaceDir = path.join(process.cwd(), TARGET_WORKSPACE_DIR);

  for (const dirName of SYNC_DIRECTORIES) {
    const sourceDir = path.join(packageRootDir, dirName);
    const absoluteFiles = getFilesRecursive(sourceDir);

    for (const absoluteSrcPath of absoluteFiles) {
      const relativeSrcPath = path.relative(packageRootDir, absoluteSrcPath);
      const absoluteDestPath = path.join(destWorkspaceDir, relativeSrcPath);
      specFiles.push({
        relativeSrcPath,
        absoluteSrcPath,
        absoluteDestPath,
      });
    }
  }
  return specFiles;
}

/**
 * 同步单个规范文件，处理冲突与备份
 */
async function syncSingleFile(spec: ISpecFile, backupDir: string): Promise<ISyncResult> {
  const { relativeSrcPath, absoluteSrcPath, absoluteDestPath } = spec;
  try {
    if (!fs.existsSync(absoluteDestPath)) {
      fs.ensureDirSync(path.dirname(absoluteDestPath));
      fs.copySync(absoluteSrcPath, absoluteDestPath);
      return { filePath: relativeSrcPath, status: FileSyncStatus.ADDED };
    }

    const srcHash = getFileMd5(absoluteSrcPath);
    const destHash = getFileMd5(absoluteDestPath);
    if (srcHash === destHash) {
      return { filePath: relativeSrcPath, status: FileSyncStatus.UNCHANGED };
    }

    const backupPath = path.join(backupDir, relativeSrcPath);
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: CLI_PROMPTS.OVERWRITE_CONFIRM(relativeSrcPath, backupPath),
      initial: false,
    });

    if (response.overwrite) {
      fs.ensureDirSync(path.dirname(backupPath));
      fs.moveSync(absoluteDestPath, backupPath);
      fs.copySync(absoluteSrcPath, absoluteDestPath);
      return { filePath: relativeSrcPath, status: FileSyncStatus.OVERWRITTEN, backupPath };
    }
    return { filePath: relativeSrcPath, status: FileSyncStatus.SKIPPED };
  } catch (error) {
    console.error(`[Sync Error] 同步文件失败: ${relativeSrcPath}`, error);
    return { filePath: relativeSrcPath, status: FileSyncStatus.SKIPPED };
  }
}

/**
 * 打印同步完成后的总结报告
 */
function printSyncReport(results: ISyncResult[]): void {
  console.log('\n📊 同步状态汇总报告:');
  console.log('-------------------------------------------');
  const statusLabels: Record<FileSyncStatus, string> = {
    [FileSyncStatus.ADDED]: '🆕 新增成功',
    [FileSyncStatus.UNCHANGED]: '✅ 无变化  ',
    [FileSyncStatus.SKIPPED]: '⚠️  已跳过  ',
    [FileSyncStatus.OVERWRITTEN]: '🔄 备份覆盖',
    [FileSyncStatus.CONFLICT]: '⚠️  发生冲突',
  };

  for (const item of results) {
    const statusLabel = statusLabels[item.status];
    console.log(`[${statusLabel}] ${item.filePath}`);
    if (item.backupPath) {
      console.log(`   └─ 备份路径: ${item.backupPath}`);
    }
  }
  console.log('-------------------------------------------');
}

/**
 * init 命令的主入口函数
 */
export async function runInit(): Promise<void> {
  console.log(CLI_PROMPTS.INIT_START);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageRootDir = path.resolve(__dirname, '..');

  const specFiles = scanPackageFiles(packageRootDir);
  if (specFiles.length === 0) {
    console.log(CLI_PROMPTS.NO_FILES_FOUND);
    return;
  }

  const timestamp = Date.now().toString();
  const backupDir = path.join(process.cwd(), TARGET_WORKSPACE_DIR, BACKUP_DIR_NAME, timestamp);
  const syncResults: ISyncResult[] = [];

  for (const spec of specFiles) {
    const result = await syncSingleFile(spec, backupDir);
    syncResults.push(result);
  }

  printSyncReport(syncResults);
  console.log(CLI_PROMPTS.INIT_SUCCESS);
}

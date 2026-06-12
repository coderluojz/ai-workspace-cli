/**
 * @file CLI 调度入口
 * @description 使用 commander 注册并管理命令行指令，包含未捕获异常处理
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';
import { runInit } from './commands/init.js';

// 全局未捕获异常捕获
process.on('unhandledRejection', (reason) => {
  console.error('[CLI Fatal Error] 未捕获的 Promise 拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('[CLI Fatal Error] 未捕获的同步异常:', error);
  process.exit(1);
});

/**
 * 启动 CLI 命令行程序
 */
async function bootstrap(): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // 通过绝对路径读取 package.json 获取版本，避免 import 声明的兼容性问题
  const pkgPath = path.resolve(__dirname, '../package.json');
  const pkg = fs.readJsonSync(pkgPath);

  const program = new Command();

  program
    .name('ai-workspace')
    .description(pkg.description || 'AI Workspace rules & skills sync tool')
    .version(pkg.version || '1.0.0');

  program
    .command('init')
    .description('初始化或同步包中的 rules 与 skills 规范到本地工作区')
    .action(async () => {
      await runInit();
    });

  program.parse(process.argv);
}

// 启动程序
bootstrap();

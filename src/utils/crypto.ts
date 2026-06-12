/**
 * @file 密码学及 Hash 校验工具函数
 * @description 包含明确的异常捕获，确保异常发生时携带上下文路径日志
 */

import fs from 'fs';
import crypto from 'crypto';

/**
 * 计算指定文件的 MD5 校验和
 * @param filePath 文件绝对路径
 * @returns 32位 MD5 Hash 字符串
 * @throws 当文件读取或哈希计算失败时抛出带有上下文信息的 Error
 */
export function getFileMd5(filePath: string): string {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (error) {
    const errorMsg = `[Crypto Error] 无法计算文件 MD5 Hash。文件路径: ${filePath}`;
    console.error(errorMsg, error);
    throw new Error(`${errorMsg}。错误原因: ${(error as Error).message}`);
  }
}

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const OUTPUT_DIR = path.join(UPLOAD_DIR, 'resigned');

export function ensureDirectories(): void {
  [UPLOAD_DIR, OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function getOutputPath(filename: string): string {
  return path.join(OUTPUT_DIR, filename);
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error);
  }
}

export function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

export function copyFile(src: string, dest: string): void {
  fs.copyFileSync(src, dest);
}

export function generateOutputFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  return `${base}-resigned-${uuidv4().slice(0, 8)}${ext}`;
}

ensureDirectories();

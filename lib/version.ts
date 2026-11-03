/**
 * 应用版本号 —— 唯一展示来源
 *
 * ⚠️ 发版时需同步修改三处，保持完全一致：
 *   1. 本文件 APP_VERSION
 *   2. package.json 的 version
 *   3. android/app/build.gradle 的 versionName / versionCode
 */
export const APP_VERSION = '1.5.0';

/** 版本号 + 日期，展示用 */
export const APP_VERSION_LABEL = `v${APP_VERSION}`;

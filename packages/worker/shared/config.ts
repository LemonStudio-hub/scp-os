/**
 * 统一配置管理
 * 前端和 Worker 共享此配置
 * 确保所有配置项在两端保持一致
 */

export const SCRAPER_CONFIG = {
  // 基础配置
  baseUrl: 'https://scp-wiki-cn.wikidot.com',
  userAgent: 'SCP-Foundation-Terminal/3.0.2 (+https://github.com/LemonStudio-hub/scp-os)',

  // 请求配置
  timeout: 30000, // 30秒超时
  retryAttempts: 3,
  retryDelay: 2000, // 2秒重试延迟（指数退避基础值）

  // 缓存配置
  cacheDuration: 30 * 60 * 1000, // 30分钟缓存
  cacheMaxSize: 100, // 最大缓存条目数

  // 速率限制
  rateLimit: {
    maxRequests: 10, // 每分钟最大请求数
    windowMs: 60000, // 时间窗口（1分钟）
  },

  // CORS 配置
  cors: {
    allowedOrigins: [
      'https://scpos.site',
      'https://scpos.pages.dev',
      'https://*.scpos.pages.dev',
      'https://scpos.woodcat.online',
      'https://*.github.io',
      'http://localhost:*',
      'http://127.0.0.1:*',
    ],
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400, // 24小时
  },

  // HTML 清理配置
  htmlCleanup: {
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe',
      '.ad-banner', '.advertisement', '#nitro-ad',
      '.page-rate', '.rate-widget', '*[class*="page-rate"]',
      '.page-info', '.page-tags', '.page-options',
      '.page-footer', '.page-meta', '.page-versions',
      '.license-box', '.page-source', '.page-history',
      '.page-discuss', '.page-edited', '*[class*="wikiwalk-nav"]',
      '*[class*="footer-nav"]',
    ],
    minContentLength: 100, // 最小内容长度
  },

  // 解析配置
  parsing: {
    minParagraphLength: 10, // 最小段落长度
    maxParagraphLength: 10000, // 最大段落长度
    ignorePatterns: [
      // JavaScript 代码
      /window\[['"]nitroAds['"]\]/,
      /nitroAds\.(queue|createAd|addUserToken)/,
      // 页面工具栏
      /^编辑\s*评分/,
      /^标签\s*讨论/,
      /^历史记录\s*附件\s*打印/,
      /^网站工具/,
      /^编辑段落/,
      /^页面源代码/,
      /^锁定页面/,
      /^重新命名/,
      /^删除/,
      // 版本信息
      /页面版本[:：]\s*\d+[^。]*。/,
      /页面版本[:：].*编辑于/,
      /最后编辑于[:：][^。]+。/,
      // 广告相关
      /Report Ad/,
      /refreshTime/,
      // 页面导航
      /«.*»/,
      // 版权和许可信息
      /创作者信息/,
      /该照片由.*所摄/,
      /原作者保留所有权利/,
      /提醒：SCP-\d+是对由/,
      /的概念与该艺术家的/,
      /该雕塑.*外形.*照片.*适用于.*许可/,
      /仅有该文章的文本部分.*适用于.*共享/,
      /任何情况下都不得.*商业目的/,
      /已慷慨地允许SCP基金会/,
      /不要与.*就有关.*进行咨询或协商/,
      /不要要求.*商用许可/,
      /不要要求SCP基金会社群.*协商/,
      /不得使用.*开展任何.*商业活动/,
      /知识共享许可/,
      /知识共享/,
      /CC BY-SA/,
      /Licensed under CC/,
      // 作者和创作者信息
      /作者[:：].*所创作的艺术作品/,
      /艺术作品.*无题/,
      /图像为.*创作/,
    ],
  },
} as const

export type ScraperConfig = typeof SCRAPER_CONFIG

/**
 * 获取配置项
 */
export function getConfig(): ScraperConfig {
  return SCRAPER_CONFIG
}

/**
 * 获取特定配置项
 */
export function getConfigValue<K extends keyof ScraperConfig>(
  key: K
): ScraperConfig[K] {
  return SCRAPER_CONFIG[key]
}
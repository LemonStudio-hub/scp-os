import type { ScraperConfig, ObjectClassInfo } from '../types/scraper'

export const SCRAPER_CONFIG: ScraperConfig = {
  // SCP 基金会中文维基 URL
  baseUrl: 'https://scp-wiki-cn.wikidot.com',
  userAgent: 'SCP-Foundation-Terminal/3.0.1 (+https://github.com/LemonStudio-hub/scp-os)',
  timeout: 10000, // 10秒超时
  retryAttempts: 3,
  retryDelay: 1000, // 1秒重试延迟
}

export const OBJECT_CLASSES: Record<string, ObjectClassInfo> = {
  SAFE: {
    class: 'SAFE',
    color: '#00ff00',
    displayName: '安全级',
    description: '标准收容程序足够，无需特殊资源'
  },
  EUCLID: {
    class: 'EUCLID',
    color: '#ffa500',
    displayName: '欧几里得级',
    description: '需要持续监控，收容措施复杂'
  },
  KETER: {
    class: 'KETER',
    color: '#ff0000',
    displayName: '刻耳柏洛斯级',
    description: '极难收容，高度危险，需要大量资源'
  },
  THAUMIEL: {
    class: 'THAUMIEL',
    color: '#ff00ff',
    displayName: '塔耳塔洛斯级',
    description: '用于收容其他 SCP，基金会秘密武器'
  },
  NEUTRALIZED: {
    class: 'NEUTRALIZED',
    color: '#888888',
    displayName: '无效化',
    description: '已不再具有异常性质'
  },
  PENDING: {
    class: 'PENDING',
    color: '#ffff00',
    displayName: '待定级',
    description: '分级尚未确定'
  },
  UNKNOWN: {
    class: 'UNKNOWN',
    color: '#ffffff',
    displayName: '未知',
    description: '分级未知'
  }
}

export const CSS_SELECTORS = {
  title: '#page-title',
  content: '#page-content',
  contentHeader: '.content-header',
  ratingInfo: '.rating-module',
  infoBox: '.wiki-content-table',
  paragraphs: 'p',
  headings: 'h1, h2, h3, h4, h5, h6',
  lists: 'ul, ol',
  blockquote: 'blockquote',
  code: 'code, pre',
  table: 'table',
  image: 'img'
}

export const REQUEST_HEADERS = {
  'User-Agent': SCRAPER_CONFIG.userAgent,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
}
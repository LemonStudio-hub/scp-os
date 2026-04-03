/**
 * 分级解析器
 * 负责解析和验证 SCP 项目等级
 */

import type { ObjectClass, ObjectClassInfo } from '../shared/types'

export class ClassParser {
  /**
   * 已知的项目等级信息
   */
  private readonly CLASS_INFO: Record<ObjectClass, ObjectClassInfo> = {
    SAFE: {
      class: 'SAFE',
      color: '#00ff00',
      displayName: '安全级',
      description: '标准收容程序足够，无需特殊资源',
    },
    EUCLID: {
      class: 'EUCLID',
      color: '#ffa500',
      displayName: '欧几里得级',
      description: '需要持续监控，收容措施复杂',
    },
    KETER: {
      class: 'KETER',
      color: '#ff0000',
      displayName: '刻耳柏洛斯级',
      description: '极难收容，高度危险，需要大量资源',
    },
    THAUMIEL: {
      class: 'THAUMIEL',
      color: '#ff00ff',
      displayName: '塔耳塔洛斯级',
      description: '用于收容其他 SCP，基金会秘密武器',
    },
    NEUTRALIZED: {
      class: 'NEUTRALIZED',
      color: '#888888',
      displayName: '无效化',
      description: '已不再具有异常性质',
    },
    PENDING: {
      class: 'PENDING',
      color: '#ffff00',
      displayName: '待定级',
      description: '分级尚未确定',
    },
    UNKNOWN: {
      class: 'UNKNOWN',
      color: '#ffffff',
      displayName: '未知',
      description: '分级未知',
    },
  }

  /**
   * 解析项目等级
   */
  parseClass(text: string): ObjectClass {
    // 清理文本
    const cleanedText = this.cleanText(text)

    // 尝试匹配已知等级
    const knownClasses: ObjectClass[] = ['SAFE', 'EUCLID', 'KETER', 'THAUMIEL', 'NEUTRALIZED', 'PENDING']
    for (const className of knownClasses) {
      if (cleanedText.includes(className)) {
        return className
      }
    }

    return 'UNKNOWN'
  }

  /**
   * 验证项目等级
   */
  isValidClass(classStr: string): boolean {
    return classStr in this.CLASS_INFO
  }

  /**
   * 获取项目等级信息
   */
  getClassInfo(objectClass: ObjectClass): ObjectClassInfo {
    return this.CLASS_INFO[objectClass] || this.CLASS_INFO.UNKNOWN
  }

  /**
   * 获取所有已知的项目等级
   */
  getAllClasses(): ObjectClass[] {
    return Object.keys(this.CLASS_INFO) as ObjectClass[]
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .toUpperCase()
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, '')
      .replace(/\*\*/g, '')
      .trim()
  }

  /**
   * 比较两个项目等级的危险程度
   * 返回值：1 (class1 > class2), 0 (class1 == class2), -1 (class1 < class2)
   */
  compareDanger(class1: ObjectClass, class2: ObjectClass): number {
    const dangerLevel: Record<ObjectClass, number> = {
      NEUTRALIZED: 0,
      SAFE: 1,
      EUCLID: 2,
      KETER: 3,
      THAUMIEL: 4,
      PENDING: -1,
      UNKNOWN: -1,
    }

    const level1 = dangerLevel[class1]
    const level2 = dangerLevel[class2]

    if (level1 === level2) return 0
    return level1 > level2 ? 1 : -1
  }
}
"use client";

import { useEffect } from "react";
import { convertTierToEnglish } from "@/lib/permissions";

/**
 * 数据迁移脚本
 * 将旧的中文会员类型转换为新的英文枚举
 * 这个组件只运行一次，完成迁移后不再执行
 */
export default function MigrationScript() {
  useEffect(() => {
    // 检查是否已经迁移过
    const migrated = localStorage.getItem('membership_migrated');
    if (migrated === 'true') {
      return; // 已经迁移过，跳过
    }

    // 读取旧的会员类型
    const oldTier = localStorage.getItem('membershipType');
    
    if (oldTier) {
      // 如果是中文，转换为英文
      if (oldTier === '季度会员' || oldTier === '年度会员' || oldTier === '永久会员') {
        const newTier = convertTierToEnglish(oldTier);
        localStorage.setItem('membershipType', newTier || '');
        console.log(`[Migration] 会员类型已迁移: ${oldTier} → ${newTier}`);
      }
    }

    // 标记为已迁移
    localStorage.setItem('membership_migrated', 'true');
  }, []);

  return null; // 这个组件不渲染任何内容
}



























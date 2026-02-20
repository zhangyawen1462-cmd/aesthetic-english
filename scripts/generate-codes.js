// 兑换码生成脚本
// 使用方法：node scripts/generate-codes.js

function generateCode(prefix, index) {
  // 生成随机字符串（4位大写字母+数字）
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的 0,O,1,I
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 格式：AE-LIFE-序号-随机码
  const serial = String(index).padStart(3, '0');
  return `${prefix}-${serial}-${random}`;
}

function generateBatch(type, count) {
  const prefixMap = {
    '永久会员': 'AE-LIFE',
    '年度会员': 'AE-YEAR',
    '月度会员': 'AE-MOON'
  };
  
  const prefix = prefixMap[type];
  const codes = [];
  
  for (let i = 1; i <= count; i++) {
    codes.push({
      code: generateCode(prefix, i),
      type: type,
      status: '🆕 待售',
      created: new Date().toISOString().split('T')[0]
    });
  }
  
  return codes;
}

// ============================================================
// 主程序：生成兑换码
// ============================================================

console.log('🎫 开始生成兑换码...\n');

// 生成 20 个永久会员码
const lifetimeCodes = generateBatch('永久会员', 20);

console.log('✅ 已生成 20 个永久会员兑换码：\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

lifetimeCodes.forEach((item, index) => {
  console.log(`${index + 1}. ${item.code}`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 生成 CSV 格式（方便复制到 Notion）
console.log('📋 CSV 格式（可直接粘贴到 Notion）：\n');
console.log('Code,Type,Status,Created');
lifetimeCodes.forEach(item => {
  console.log(`${item.code},${item.type},${item.status},${item.created}`);
});

console.log('\n✨ 完成！');
console.log('\n💡 使用说明：');
console.log('1. 复制上面的 CSV 内容（从 "Code,Type..." 开始）');
console.log('2. 打开 Notion 的 Redemption Center 数据库');
console.log('3. 点击右上角 "..." → "Merge with CSV"');
console.log('4. 粘贴内容，点击导入');
console.log('\n或者手动复制每个兑换码，一个个粘贴到 Notion 里。\n');


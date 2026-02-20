// 测试 Notion API 连接
const fs = require('fs');
const path = require('path');

// 读取 .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  timeoutMs: 30000,
});

async function testDashboard() {
  console.log('🔍 测试 Dashboard Layout API...\n');
  
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DB_LESSONS,
      filter: {
        and: [
          {
            property: 'Status',
            select: {
              equals: 'Published'
            }
          },
          {
            property: 'Display_Position',
            select: {
              equals: 'dashboard-featured'
            }
          }
        ]
      },
      sorts: [
        {
          property: 'Sort_Order',
          direction: 'ascending'
        }
      ],
      page_size: 5
    });
    
    console.log('✅ 查询成功！');
    console.log(`📊 找到 ${response.results.length} 条记录\n`);
    
    response.results.forEach((page, index) => {
      if ('properties' in page) {
        const titleCn = page.properties.Title_CN?.rich_text?.[0]?.plain_text || 'N/A';
        const lessonId = page.properties.Lesson_ID?.title?.[0]?.plain_text || 'N/A';
        console.log(`  ${index + 1}. ${lessonId} - ${titleCn}`);
      }
    });
    
    console.log('\n✨ 测试完成！Dashboard API 工作正常。');
  } catch (error) {
    console.log('❌ 查询失败:', error.message);
    console.log('错误详情:', error);
  }
}

testDashboard();










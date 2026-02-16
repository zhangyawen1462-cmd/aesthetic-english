'use client';

import { useState, useEffect } from 'react';

export default function DebugDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        const response = await fetch('/api/debug-dashboard');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch debug info:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDebugInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div>LOADING</div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">❌ 错误</h1>
        <pre className="bg-gray-800 p-4 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Dashboard 数据调试</h1>
      
      {/* 摘要 */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">📊 数据摘要</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-sm">已发布课程总数</div>
            <div className="text-3xl font-bold text-green-400">{data.summary.totalPublished}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Dashboard 精选课程</div>
            <div className="text-3xl font-bold text-blue-400">{data.summary.dashboardFeatured}</div>
          </div>
        </div>
      </div>

      {/* Dashboard Featured 课程 */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">🏠 Dashboard Featured 课程</h2>
        {data.featuredLessons.length === 0 ? (
          <div className="text-yellow-400 bg-yellow-900/20 p-4 rounded">
            ⚠️ 没有设置为 "dashboard-featured" 的课程！
            <br />
            请在可视化管理器中拖动课程到 Dashboard 槽位并保存。
          </div>
        ) : (
          <div className="space-y-2">
            {data.featuredLessons.map((lesson: any, index: number) => (
              <div key={index} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                <div>
                  <span className="text-purple-400 font-mono mr-3">#{lesson.sortOrder}</span>
                  <span className="font-bold">{lesson.id}</span>
                  <span className="text-gray-400 ml-3">
                    {lesson.titleCn || lesson.titleEn || '(无标题)'}
                  </span>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                  {lesson.contentType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 所有已发布课程 */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">📚 所有已发布课程</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.allLessons.map((lesson: any, index: number) => (
            <div key={index} className="bg-gray-700 p-3 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{lesson.id}</span>
                <div className="flex gap-2">
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                    {lesson.status}
                  </span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    {lesson.contentType}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Display Position: <span className="text-yellow-400">{lesson.displayPosition}</span>
                {lesson.sortOrder !== null && (
                  <span className="ml-3">Sort Order: <span className="text-purple-400">{lesson.sortOrder}</span></span>
                )}
              </div>
              {(lesson.titleCn || lesson.titleEn) && (
                <div className="text-sm text-gray-300 mt-1">
                  {lesson.titleCn || lesson.titleEn}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 时间戳 */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        更新时间: {new Date(data.timestamp).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}





'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function DebugDetail() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-detail');
      const result = await response.json();
      setData(result);
      console.log('调试数据:', result);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>LOADING</div>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">❌ 错误</h1>
        <pre className="bg-gray-800 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">🔍 详细调试信息</h1>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        {/* 环境检查 */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">🔧 环境变量</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Notion API Key</div>
              <div className={`text-lg font-bold ${data.environment.hasNotionKey ? 'text-green-400' : 'text-red-400'}`}>
                {data.environment.hasNotionKey ? '✅ 已配置' : '❌ 未配置'}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Database ID</div>
              <div className={`text-lg font-bold ${data.environment.hasDbId ? 'text-green-400' : 'text-red-400'}`}>
                {data.environment.hasDbId ? '✅ 已配置' : '❌ 未配置'}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Database ID 值</div>
              <div className="text-xs text-gray-300 font-mono break-all">
                {data.environment.dbId || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">📊 数据统计</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">总课程数</div>
              <div className="text-2xl font-bold text-blue-400">{data.summary.total}</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Published</div>
              <div className="text-2xl font-bold text-green-400">{data.summary.published}</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Dashboard Featured</div>
              <div className="text-2xl font-bold text-purple-400">{data.summary.dashboardFeatured}</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Dashboard API</div>
              <div className="text-2xl font-bold text-yellow-400">{data.summary.dashboardLayoutFunction}</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Daily Cinema API</div>
              <div className="text-2xl font-bold text-pink-400">{data.summary.dailyCinemaLayoutFunction}</div>
            </div>
          </div>
        </div>

        {/* 问题诊断 */}
        <div className="bg-yellow-900/30 border border-yellow-500/50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">⚠️ 问题诊断</h2>
          <div className="space-y-3 text-sm">
            {data.summary.published === 0 && (
              <div className="bg-red-900/30 p-3 rounded">
                <strong className="text-red-400">❌ 没有 Published 课程</strong>
                <p className="text-gray-300 mt-1">请在 Notion 中将课程状态改为 "Published"</p>
              </div>
            )}
            {data.summary.published > 0 && data.summary.dashboardFeatured === 0 && (
              <div className="bg-yellow-900/30 p-3 rounded">
                <strong className="text-yellow-400">⚠️ 没有设置 Dashboard Featured</strong>
                <p className="text-gray-300 mt-1">
                  有 {data.summary.published} 个 Published 课程，但没有设置为 "dashboard-featured"
                  <br />
                  请前往 <a href="/admin/layout-manager" className="text-blue-400 underline">布局管理器</a> 拖拽课程到 Dashboard 槽位并保存
                </p>
              </div>
            )}
            {data.summary.dashboardFeatured > 0 && data.summary.dashboardLayoutFunction === 0 && (
              <div className="bg-red-900/30 p-3 rounded">
                <strong className="text-red-400">❌ API 函数返回为空</strong>
                <p className="text-gray-300 mt-1">
                  Notion 中有 {data.summary.dashboardFeatured} 个 Dashboard Featured 课程，但 getDashboardLayout() 返回 0
                  <br />
                  可能是数据格式问题，请检查控制台日志
                </p>
              </div>
            )}
            {data.summary.dashboardLayoutFunction > 0 && (
              <div className="bg-green-900/30 p-3 rounded">
                <strong className="text-green-400">✅ 数据正常</strong>
                <p className="text-gray-300 mt-1">
                  API 返回了 {data.summary.dashboardLayoutFunction} 个课程，如果页面还是不显示，请检查：
                  <br />
                  1. 是否重启了开发服务器
                  <br />
                  2. 浏览器是否有缓存（试试硬刷新 Cmd+Shift+R）
                  <br />
                  3. 检查浏览器控制台是否有错误
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Layout API 返回数据 */}
        {data.dashboardLayoutData && data.dashboardLayoutData.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">🏠 Dashboard Layout API 返回数据</h2>
            <div className="space-y-2">
              {data.dashboardLayoutData.map((lesson: any, index: number) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-purple-400 font-mono mr-3">#{lesson.sortOrder}</span>
                      <span className="font-bold text-lg">{lesson.id}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    {lesson.titleCn && <div>中文标题: {lesson.titleCn}</div>}
                    {lesson.titleEn && <div>英文标题: {lesson.titleEn}</div>}
                    {lesson.coverImg && lesson.coverImg !== 'none' && (
                      <div className="text-xs text-green-400">✓ 有封面图</div>
                    )}
                    {lesson.videoUrl && lesson.videoUrl !== 'none' && (
                      <div className="text-xs text-green-400">✓ 有视频</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 所有课程详情 */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📚 所有课程详情</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Lesson ID</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Display Position</th>
                  <th className="text-left p-2">Sort Order</th>
                  <th className="text-left p-2">Content Type</th>
                  <th className="text-left p-2">标题</th>
                </tr>
              </thead>
              <tbody>
                {data.allLessons.map((lesson: any, index: number) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2 font-mono text-xs">{lesson.id}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lesson.status === 'Published' ? 'bg-green-500/20 text-green-300' :
                        lesson.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {lesson.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lesson.displayPosition === 'dashboard-featured' ? 'bg-purple-500/20 text-purple-300' :
                        lesson.displayPosition === 'daily-cinema' ? 'bg-pink-500/20 text-pink-300' :
                        lesson.displayPosition === 'archive-only' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {lesson.displayPosition}
                      </span>
                    </td>
                    <td className="p-2 text-purple-400">{lesson.sortOrder ?? '-'}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
                        {lesson.contentType}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-gray-300">
                      {lesson.titleCn || lesson.titleEn || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 时间戳 */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          更新时间: {new Date(data.timestamp).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
}





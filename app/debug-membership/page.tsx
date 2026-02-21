"use client";

import { useEffect, useState } from 'react';
import { useMembership } from '@/context/MembershipContext';

export default function DebugMembershipPage() {
  const { tier, realTier, devTier, email, isLoading, refreshMembership } = useMembership();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // 读取所有 Cookie
    setCookies(document.cookie);
    
    // 调用 API 获取最新状态
    fetch('/api/membership')
      .then(res => res.json())
      .then(data => setApiResponse(data));
  }, []);

  const handleRefresh = async () => {
    await refreshMembership();
    const res = await fetch('/api/membership');
    const data = await res.json();
    setApiResponse(data);
    setCookies(document.cookie);
  };

  const handleClearCookie = () => {
    document.cookie = 'ae_membership=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setTimeout(() => {
      setCookies(document.cookie);
      handleRefresh();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">🔍 会员状态调试面板</h1>
        
        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔄 刷新状态
          </button>
          <button
            onClick={handleClearCookie}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            🗑️ 清除 Cookie
          </button>
        </div>

        {/* Context 状态 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📦 MembershipContext 状态</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex gap-2">
              <span className="text-gray-600">isLoading:</span>
              <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                {isLoading ? '⏳ 加载中' : '✅ 已加载'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">tier (生效等级):</span>
              <span className="text-blue-600 font-bold">{tier || 'null'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">realTier (真实等级):</span>
              <span className="text-purple-600">{realTier || 'null'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">devTier (开发覆盖):</span>
              <span className="text-orange-600">{devTier || 'null'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">email:</span>
              <span className="text-gray-800">{email || '未登录'}</span>
            </div>
          </div>
        </div>

        {/* API 响应 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🌐 /api/membership 响应</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        {/* Cookie 信息 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🍪 浏览器 Cookies</h2>
          <div className="bg-gray-100 p-4 rounded text-xs font-mono break-all">
            {cookies || '无 Cookie'}
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 注意：</strong> 如果你在 Notion 中删除了会员记录或标记为"已失效"，
              但这里仍然显示 <code className="bg-yellow-100 px-1">isAuthenticated: true</code>，
              说明浏览器的 Cookie 还没有被清除。
            </p>
          </div>
        </div>

        {/* 诊断建议 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">💡 诊断步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>点击"🔄 刷新状态"按钮，查看最新的 API 响应</li>
            <li>如果 <code className="bg-blue-100 px-1">isAuthenticated</code> 仍为 true，说明 Notion 中还有该用户记录</li>
            <li>如果 <code className="bg-blue-100 px-1">reason</code> 显示 "membership_revoked" 或 "user_not_found"，说明验证逻辑正常工作</li>
            <li>点击"🗑️ 清除 Cookie"可以手动删除登录状态</li>
            <li>清除后刷新页面，应该会跳转到未登录状态</li>
          </ol>
        </div>

        {/* 返回首页 */}
        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
          >
            ← 返回 Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}


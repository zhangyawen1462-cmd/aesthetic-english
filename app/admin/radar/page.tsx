"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Log {
  logId: string;
  code: string;
  status: string;
  reason: string;
  deviceId: string;
  email: string;
  time: string;
  ipAddress: string;
}

const ADMIN_SECRET = 'admin2026'; // 硬编码管理员密钥

export default function AdminRadar() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchCode, setSearchCode] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (searchCode) params.append('code', searchCode);
      
      const response = await fetch(`/api/admin/redemption-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_SECRET}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setStats(data.data.stats);
      } else {
        setError(data.message || '获取日志失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // 每5秒刷新一次

    return () => clearInterval(interval);
  }, [filterStatus, searchCode]);

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#E8F4F8] p-6">
      {/* 头部 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="flex items-center gap-2 text-[#E8F4F8]/60 hover:text-[#E8F4F8] transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm uppercase tracking-widest">返回工具台</span>
            </Link>
          </div>
          <button
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs uppercase tracking-widest transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold mb-2">主理人雷达</h1>
          <p className="text-sm opacity-60 uppercase tracking-widest">
            Redemption Activity Monitor
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-2">总尝试次数</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-2">成功</p>
            <p className="text-3xl font-bold text-green-400">{stats.success}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-2">失败</p>
            <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="搜索兑换码..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="">全部状态</option>
            <option value="🟢 成功">🟢 成功</option>
            <option value="🔴 失败">🔴 失败</option>
          </select>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="max-w-7xl mx-auto">
        <div className="space-y-2">
          {logs.map((log, index) => (
            <motion.div
              key={log.logId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded border ${
                log.status === '🟢 成功'
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{log.status}</span>
                    <span className="font-mono font-bold text-sm">{log.code}</span>
                    <span className="text-xs opacity-60">{log.email}</span>
                  </div>
                  <p className="text-xs opacity-60 mb-2">{log.reason}</p>
                  <div className="flex gap-4 text-xs opacity-40">
                    <span>设备: {log.deviceId}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
                <div className="text-right text-xs opacity-60 whitespace-nowrap">
                  {new Date(log.time).toLocaleString('zh-CN')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {logs.length === 0 && !isLoading && (
          <div className="text-center py-20 opacity-40">
            <p className="text-sm">暂无日志记录</p>
          </div>
        )}
      </div>
    </div>
  );
}



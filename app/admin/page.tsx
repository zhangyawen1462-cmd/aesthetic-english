'use client';

import Link from 'next/link';
import { Upload, Sparkles, Layout, FileText, Scissors, Image, Link as LinkIcon, Shield } from 'lucide-react';

export default function AdminPage() {
  const tools = [
    {
      title: '🚀 一键发布台',
      description: '上传素材 → AI 生成 → 自动发布到 Notion',
      href: '/admin/publish',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: '📡 主理人雷达',
      description: '实时监控所有兑换活动，追踪成功/失败记录',
      href: '/admin/radar',
      icon: Shield,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      title: '🎨 可视化布局管理器',
      description: '拖拽封面，实时预览，精确控制每个页面的显示内容',
      href: '/admin/layout-manager',
      icon: Layout,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: '✂️ 图片裁剪工具',
      description: '自动裁剪图片为 16:9、1:1、3:4、9:16 四种比例',
      href: '/admin/image-cropper',
      icon: Scissors,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: '🖼️ 纵向拼图工具',
      description: '拖拽上传 2 张图片，生成纵向拼图',
      href: '/admin/collage-maker',
      icon: Image,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: '📤 文件上传工具',
      description: '快速上传图片和视频到云存储',
      href: '/admin/upload',
      icon: Upload,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: '🔗 OSS 链接转换器',
      description: '一键将旧的 OSS 链接转换为正式 CDN 链接',
      href: '/admin/link-converter',
      icon: LinkIcon,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* 标题 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            ⚙️ 管理后台
          </h1>
          <p className="text-slate-300 text-lg">
            选择一个工具开始管理你的内容
          </p>
        </div>

        {/* 工具卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 
                  hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                {/* 渐变背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                
                {/* 内容 */}
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-2">
                    {tool.title}
                  </h2>
                  
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {tool.description}
                  </p>

                  {/* 箭头 */}
                  <div className="mt-4 flex items-center text-white/60 group-hover:text-white transition-colors">
                    <span className="text-sm font-medium">打开工具</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 文档链接 */}
        <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">📚 使用文档</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  <a href="/docs/自动化发布完整指南.md" className="hover:text-white underline">
                    自动化发布完整指南
                  </a>
                </li>
                <li>
                  <a href="/docs/Notion数据库配置指南.md" className="hover:text-white underline">
                    Notion 数据库配置指南
                  </a>
                </li>
                <li>
                  <a href="/docs/课程显示控制系统说明.md" className="hover:text-white underline">
                    课程显示控制系统说明
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}





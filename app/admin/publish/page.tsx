'use client';

// ============================================================
// 一站式发布台 - 整合上传、AI生成、Notion发布
// ============================================================

import { useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PublishFormData {
  lessonId: string;
  titleEn: string;
  titleCn: string;
  category: 'daily' | 'cognitive' | 'business';
  ep: string;
  contentType: 'video' | 'image'; // 视频课程 or 纯图片
  publishTarget: 'featured' | 'archive-only'; // 精选页面 or 仅归档
  coverFeaturedFile: File | null;  // 精选封面（3/4、1/1、9/16等）
  coverArchiveFile: File | null;   // 归档封面（16:9）
  videoFile: File | null;
  srtFile: File | null;
  audioFile: File | null; // 🆕 音频文件（MP3，用于永久会员下载）
}

type PublishStep = 'idle' | 'uploading' | 'generating' | 'creating' | 'success' | 'error';

export default function PublishPage() {
  const [formData, setFormData] = useState<PublishFormData>({
    lessonId: '',
    titleEn: '',
    titleCn: '',
    category: 'daily',
    ep: '',
    contentType: 'video',
    publishTarget: 'featured',
    coverFeaturedFile: null,
    coverArchiveFile: null,
    videoFile: null,
    srtFile: null,
    audioFile: null, // 🆕 音频文件
  });

  const [currentStep, setCurrentStep] = useState<PublishStep>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [notionUrl, setNotionUrl] = useState('');

  // 文件选择处理
  const handleFileChange = (field: 'coverFeaturedFile' | 'coverArchiveFile' | 'videoFile' | 'srtFile' | 'audioFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    setError('');
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.lessonId.trim()) {
      setError('请输入 Lesson ID');
      return false;
    }
    
    // 视频课程需要完整信息
    if (formData.contentType === 'video') {
      if (!formData.titleEn.trim()) {
        setError('请输入英文标题');
        return false;
      }
      if (!formData.titleCn.trim()) {
        setError('请输入中文标题');
        return false;
      }
      if (!formData.ep.trim()) {
        setError('请输入期数');
        return false;
      }
      if (!formData.srtFile) {
        setError('视频课程需要上传 SRT 字幕文件');
        return false;
      }
      // 精选页面需要精选封面
      if (formData.publishTarget === 'featured' && !formData.coverFeaturedFile) {
        setError('精选页面需要上传精选封面（用于 Dashboard/Daily Cinema）');
        return false;
      }
      // 归档封面暂时改为可选（等 Notion 添加 Cover_Img_16x9 字段后再改为必填）
      // if (!formData.coverArchiveFile) {
      //   setError('需要上传归档封面（16:9，用于 Archives）');
      //   return false;
      // }
    }
    
    // 纯图片只需要精选封面
    if (formData.contentType === 'image' && !formData.coverFeaturedFile) {
      setError('纯图片模式需要上传封面图片');
      return false;
    }
    
    return true;
  };

  // 一键发布
  const handlePublish = async () => {
    if (!validateForm()) return;

    setCurrentStep('uploading');
    setError('');
    setProgress('正在准备上传...');

    try {
      // 构建 FormData
      const uploadData = new FormData();
      uploadData.append('lessonId', formData.lessonId);
      uploadData.append('titleEn', formData.titleEn);
      uploadData.append('titleCn', formData.titleCn);
      uploadData.append('category', formData.category);
      uploadData.append('ep', formData.ep);
      uploadData.append('contentType', formData.contentType);
      uploadData.append('publishTarget', formData.publishTarget);
      
      if (formData.coverFeaturedFile) uploadData.append('coverFeatured', formData.coverFeaturedFile);
      if (formData.coverArchiveFile) uploadData.append('coverArchive', formData.coverArchiveFile);
      if (formData.videoFile) uploadData.append('video', formData.videoFile);
      if (formData.srtFile) uploadData.append('srt', formData.srtFile);
      if (formData.audioFile) uploadData.append('audio', formData.audioFile); // 🆕 音频文件

      // 调用统一发布 API
      console.log('📤 开始发布，调用 /api/publish...');
      const response = await fetch('/api/publish', {
        method: 'POST',
        body: uploadData,
      });

      console.log('📥 收到响应，状态码:', response.status);
      
      // 尝试解析 JSON
      let result;
      try {
        result = await response.json();
        console.log('📋 响应内容:', result);
      } catch (parseError) {
        console.error('❌ JSON 解析失败:', parseError);
        const text = await response.text();
        console.error('📄 原始响应:', text);
        throw new Error(`服务器响应格式错误 (状态码: ${response.status})`);
      }

      if (!result.success) {
        console.error('❌ 发布失败:', result.error);
        console.error('📋 详细信息:', result.details);
        throw new Error(result.error || '发布失败');
      }

      // 成功
      console.log('✅ 发布成功！');
      setCurrentStep('success');
      setProgress('');
      setNotionUrl(result.notionUrl || '');
      
      // 3秒后重置表单
      setTimeout(() => {
        resetForm();
      }, 5000);

    } catch (err) {
      console.error('❌ 发布过程出错:', err);
      setCurrentStep('error');
      
      // 提取详细错误信息
      if (err instanceof Error) {
        setError(err.message);
        setErrorDetails(err.stack || '');
      } else {
        setError('发布失败，请重试');
        setErrorDetails(JSON.stringify(err));
      }
      
      setProgress('');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      lessonId: '',
      titleEn: '',
      titleCn: '',
      category: 'daily',
      ep: '',
      contentType: 'video',
      publishTarget: 'featured',
      coverFeaturedFile: null,
      coverArchiveFile: null,
      videoFile: null,
      srtFile: null,
      audioFile: null, // 🆕 音频文件
    });
    setCurrentStep('idle');
    setProgress('');
    setError('');
    setErrorDetails('');
    setNotionUrl('');
  };

  // 获取步骤显示文本
  const getStepText = () => {
    switch (currentStep) {
      case 'uploading':
        return '📤 上传文件到 OSS...';
      case 'generating':
        return '🤖 AI 生成内容中...';
      case 'creating':
        return '📝 创建 Notion 页面...';
      case 'success':
        return '✅ 发布成功！';
      case 'error':
        return '❌ 发布失败';
      default:
        return '';
    }
  };

  const isProcessing = ['uploading', 'generating', 'creating'].includes(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">📦 课程素材上传</h1>
          <p className="text-slate-300 text-sm sm:text-base">上传素材到资源池 → 使用布局管理器排版 → 审核后发布</p>
        </div>

        {/* 主表单 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 mb-6 border border-white/20">
          
          {/* 基础信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Lesson ID *</label>
              <input
                type="text"
                value={formData.lessonId}
                onChange={(e) => setFormData(prev => ({ ...prev, lessonId: e.target.value }))}
                placeholder={formData.contentType === 'video' ? '例如: daily-01' : '例如: mood-01'}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl
                  text-white placeholder-slate-400 text-sm sm:text-base
                  focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isProcessing}
              />
              {formData.contentType === 'image' && (
                <p className="text-xs text-slate-400 mt-1">💡 仅用于后台管理识别</p>
              )}
            </div>

            {formData.contentType === 'video' && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">期数 *</label>
                <input
                  type="text"
                  value={formData.ep}
                  onChange={(e) => setFormData(prev => ({ ...prev, ep: e.target.value }))}
                  placeholder="例如: 01"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl
                    text-white placeholder-slate-400 text-sm sm:text-base
                    focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isProcessing}
                />
              </div>
            )}

            {formData.contentType === 'video' && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">英文标题 *</label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                  placeholder="例如: Morning Ritual"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl
                    text-white placeholder-slate-400 text-sm sm:text-base
                    focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isProcessing}
                />
              </div>
            )}

            {formData.contentType === 'video' && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">中文标题 *</label>
                <input
                  type="text"
                  value={formData.titleCn}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleCn: e.target.value }))}
                  placeholder="例如: 晨间唤醒"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl
                    text-white placeholder-slate-400 text-sm sm:text-base
                    focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          {/* 内容类型 */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3 text-sm sm:text-base">内容类型 *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['video', 'image'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, contentType: type }))}
                  disabled={isProcessing}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm sm:text-base
                    ${formData.contentType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type === 'video' ? '🎬 视频课程' : '🖼️ 纯图片'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {formData.contentType === 'video' && '• 需要上传视频和 SRT 字幕，AI 自动生成学习内容'}
              {formData.contentType === 'image' && '• 只需上传图片，用作氛围卡片（无标题、无分类、不收录 Archives）'}
            </p>
          </div>

          {/* 发布目标 - 仅视频课程显示 */}
          {formData.contentType === 'video' && (
            <div className="mb-6">
              <label className="block text-white font-medium mb-3 text-sm sm:text-base">发布目标 *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, publishTarget: 'featured' }))}
                  disabled={isProcessing}
                  className={`py-4 px-4 rounded-xl font-medium transition-all text-sm sm:text-base
                    ${formData.publishTarget === 'featured'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-lg mb-1">🎨</div>
                  <div>精选页面</div>
                  <div className="text-xs opacity-70 mt-1">需要布局管理器排版</div>
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, publishTarget: 'archive-only' }))}
                  disabled={isProcessing}
                  className={`py-4 px-4 rounded-xl font-medium transition-all text-sm sm:text-base
                    ${formData.publishTarget === 'archive-only'
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-lg mb-1">📦</div>
                  <div>仅 Archives</div>
                  <div className="text-xs opacity-70 mt-1">直接发布，无需排版</div>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {formData.publishTarget === 'featured' && '• 上传到资源池，使用布局管理器拖拽排版后显示在精选页面'}
                {formData.publishTarget === 'archive-only' && '• 直接发布到 Archives 归档页，按时间排序，无需额外排版'}
              </p>
            </div>
          )}

          {/* 分类选择 - 仅视频课程显示 */}
          {formData.contentType === 'video' && (
            <div className="mb-6">
              <label className="block text-white font-medium mb-3 text-sm sm:text-base">分类 *</label>
              <div className="grid grid-cols-3 gap-3">
                {(['daily', 'cognitive', 'business'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    disabled={isProcessing}
                    className={`py-3 px-4 rounded-xl font-medium transition-all text-sm sm:text-base
                      ${formData.category === cat
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {cat === 'daily' ? '🎬 Daily' : cat === 'cognitive' ? '🧠 Cognitive' : '💼 Business'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 文件上传区 */}
          <div className="space-y-4">
            {/* 智能提示 */}
            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
              <p className="text-blue-300 text-sm font-medium mb-2">💡 上传提示：</p>
              <ul className="text-xs text-blue-200 space-y-1">
                {formData.contentType === 'video' ? (
                  <>
                    {formData.publishTarget === 'featured' ? (
                      <>
                        <li>• <strong>必须上传两种封面</strong>：精选封面（用于 Dashboard/Daily Cinema）+ 归档封面（16:9，用于 Archives）</li>
                        <li>• 上传视频（可选）、<strong>SRT 字幕（必须）</strong></li>
                    <li>• 发布后，使用 <strong>布局管理器</strong> 拖拽排版</li>
                        <li>• 所有精选视频都会自动收录到 Archives</li>
                      </>
                    ) : (
                      <>
                        <li>• <strong>必须上传归档封面</strong>（16:9，用于 Archives）</li>
                        <li>• 上传视频（可选）、<strong>SRT 字幕（必须）</strong></li>
                        <li>• 直接发布到 Archives，无需排版</li>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <li>• <strong>必须上传封面图</strong>（作为氛围卡片）</li>
                    <li>• 不需要视频和字幕</li>
                    <li>• 发布后，使用 <strong>布局管理器</strong> 拖拽到卡片槽位</li>
                  </>
                )}
              </ul>
            </div>

            {/* 精选封面 - 视频精选模式或纯图片模式 */}
            {(formData.contentType === 'image' || (formData.contentType === 'video' && formData.publishTarget === 'featured')) && (
            <FileUploadBox
                label={formData.contentType === 'image' ? '封面图片' : '精选封面'}
              accept="image/*"
                file={formData.coverFeaturedFile}
                onChange={(file) => handleFileChange('coverFeaturedFile', file)}
              disabled={isProcessing}
                required
              hint={formData.contentType === 'image' 
                ? "必填：作为氛围卡片显示" 
                  : "必填：用于 Dashboard/Daily Cinema 精选页面，推荐比例 3:4、1:1 或 9:16"}
              />
            )}

            {/* 归档封面 - 仅视频模式 */}
            {formData.contentType === 'video' && (
              <FileUploadBox
                label="归档封面（16:9）"
                accept="image/*"
                file={formData.coverArchiveFile}
                onChange={(file) => handleFileChange('coverArchiveFile', file)}
                disabled={isProcessing}
                optional
                hint="可选：用于 Archives 归档页面，推荐尺寸 1920x1080 像素（16:9）。暂时可选，等 Notion 添加字段后会变为必填。"
            />
            )}

            {/* 视频 - 仅视频模式显示 */}
            {formData.contentType === 'video' && (
              <FileUploadBox
                label="视频文件"
                accept="video/*"
                file={formData.videoFile}
                onChange={(file) => handleFileChange('videoFile', file)}
                disabled={isProcessing}
                optional
              />
            )}

            {/* SRT 字幕 - 仅视频模式显示 */}
            {formData.contentType === 'video' && (
              <FileUploadBox
                label="SRT 字幕"
                accept=".srt"
                file={formData.srtFile}
                onChange={(file) => handleFileChange('srtFile', file)}
                disabled={isProcessing}
                required
              />
            )}

            {/* 🆕 音频文件 - 仅视频模式显示 */}
            {formData.contentType === 'video' && (
              <FileUploadBox
                label="音频文件（MP3）"
                accept="audio/mpeg,audio/mp3,.mp3"
                file={formData.audioFile}
                onChange={(file) => handleFileChange('audioFile', file)}
                disabled={isProcessing}
                optional
                hint="可选：预处理的 MP3 音频文件，用于永久会员秒速下载。如不上传，用户点击下载时会实时提取（较慢）。"
              />
            )}
          </div>

          {/* 发布按钮 */}
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="w-full mt-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 
              text-white font-semibold rounded-xl text-sm sm:text-base
              hover:from-purple-600 hover:to-pink-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 transform hover:scale-[1.02]
              flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {formData.contentType === 'image' 
                  ? '📦 上传到资源池' 
                  : formData.publishTarget === 'archive-only'
                  ? '✅ 直接发布到 Archives'
                  : '📦 上传到资源池'}
              </>
            )}
          </button>

          {/* 进度提示 */}
          {currentStep !== 'idle' && (
            <div className={`mt-6 p-4 rounded-xl border ${
              currentStep === 'success' 
                ? 'bg-green-500/20 border-green-500/30' 
                : currentStep === 'error'
                ? 'bg-red-500/20 border-red-500/30'
                : 'bg-blue-500/20 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {currentStep === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                ) : currentStep === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-300 animate-spin flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm sm:text-base ${
                    currentStep === 'success' ? 'text-green-300' :
                    currentStep === 'error' ? 'text-red-300' : 'text-blue-300'
                  }`}>
                    {getStepText()}
                  </p>
                  {progress && (
                    <p className="text-xs sm:text-sm text-white/60 mt-1">{progress}</p>
                  )}
                  {notionUrl && (
                    <a 
                      href={notionUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-green-300 hover:text-green-200 underline mt-2 inline-block break-all"
                    >
                      在 Notion 中查看 →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-red-300 text-sm sm:text-base font-medium">❌ {error}</p>
                  {errorDetails && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-200 cursor-pointer hover:text-red-100">
                        查看详细错误信息
                      </summary>
                      <pre className="mt-2 p-3 bg-black/30 rounded text-xs text-red-200 overflow-x-auto">
                        {errorDetails}
                      </pre>
                    </details>
                  )}
                  <button
                    onClick={() => {
                      console.log('=== 调试信息 ===');
                      console.log('表单数据:', formData);
                      console.log('当前步骤:', currentStep);
                      console.log('错误信息:', error);
                      console.log('错误详情:', errorDetails);
                    }}
                    className="mt-2 text-xs text-red-200 hover:text-red-100 underline"
                  >
                    📋 复制调试信息到控制台
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">💡 三种发布场景</h3>
          
          <div className="space-y-4">
            {/* 场景1 */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🖼️ 纯图片卡片（氛围装饰）</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>1. 只需填写 Lesson ID（如 mood-01）</li>
                <li>2. 上传一张图片</li>
                <li>3. 点击&quot;上传到资源池&quot;</li>
                <li>4. 前往 <a href="/admin/layout-manager" className="text-blue-600 underline">布局管理器</a> 拖拽到卡片槽位</li>
                <li>5. 保存布局后立即生效</li>
              </ul>
            </div>

            {/* 场景2 */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🎨 精选视频（Dashboard/Daily/Cognitive/Business）</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>1. 填写完整信息（ID、标题、期数、分类）</li>
                <li>2. 选择&quot;精选页面&quot;</li>
                <li>3. 上传素材（封面、视频、SRT 字幕）</li>
                <li>4. 点击&quot;上传到资源池&quot;，AI 自动生成学习内容</li>
                <li>5. 前往 <a href="/admin/layout-manager" className="text-blue-600 underline">布局管理器</a> 拖拽排版</li>
                <li>6. 在 Notion 中审核，改为 Published 状态</li>
              </ul>
            </div>

            {/* 场景3 */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📦 仅 Archives 视频（无需排版）</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>1. 填写完整信息（ID、标题、期数、分类）</li>
                <li>2. 选择&quot;仅 Archives&quot;</li>
                <li>3. 上传素材（封面、视频、SRT 字幕）</li>
                <li>4. 点击&quot;直接发布到 Archives&quot;</li>
                <li>5. 在 Notion 中审核，改为 Published 状态</li>
                <li>6. 自动按时间排序显示在 Archives 页面</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 文件上传组件
function FileUploadBox({ 
  label, 
  accept, 
  file, 
  onChange, 
  disabled,
  required = false,
  optional = false,
  hint
}: { 
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-white font-medium mb-2 text-sm sm:text-base">
        {label} {required && '*'} {optional && <span className="text-slate-400 text-xs">(可选)</span>}
      </label>
      {hint && (
        <p className="text-xs text-slate-400 mb-2">💡 {hint}</p>
      )}
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          disabled={disabled}
          className="block w-full text-xs sm:text-sm text-slate-300
            file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-6
            file:rounded-full file:border-0
            file:text-xs sm:file:text-sm file:font-semibold
            file:bg-purple-500 file:text-white
            hover:file:bg-purple-600
            file:cursor-pointer cursor-pointer
            bg-white/5 rounded-xl p-2 sm:p-3 border border-white/20
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      {file && (
        <div className="mt-2 flex items-center justify-between text-xs sm:text-sm text-green-400">
          <span className="truncate">✓ {file.name}</span>
          <span className="text-slate-400 ml-2 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        </div>
      )}
    </div>
  );
}


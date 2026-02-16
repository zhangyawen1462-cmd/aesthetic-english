'use client';

// ============================================================
// AI 内容生成器 - 管理后台页面
// ============================================================

import { useState } from 'react';
import type { AIGeneratedContent, AIGeneratedVocab, AIGeneratedGrammar } from '@/data/types';

export default function AIGeneratorPage() {
  // 状态管理
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState('');

  // 配置选项
  const [options, setOptions] = useState({
    generateVocab: true,
    generateGrammar: true,
    generateRecall: true,
  });

  // ============================================================
  // 文件上传处理
  // ============================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.srt')) {
        setError('请上传 .srt 格式的字幕文件');
        return;
      }
      setSrtFile(file);
      setError('');
      setSuccess('');
    }
  };

  // ============================================================
  // 生成内容
  // ============================================================

  const handleGenerate = async () => {
    if (!srtFile || !lessonId) {
      setError('请上传 SRT 文件并输入 Lesson ID');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');
    setProgress('正在读取文件...');

    try {
      // 读取文件内容
      const srtContent = await srtFile.text();
      setProgress('正在调用 AI 生成内容...');

      // 调用 AI 生成 API
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srtContent,
          lessonId,
          options,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      setGeneratedContent(result.data);
      setProgress('');
      setSuccess('✅ AI 生成完成！请检查内容后保存到 Notion。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // 保存到 Notion
  // ============================================================

  const handleSaveToNotion = async () => {
    if (!generatedContent || !lessonId) return;

    setIsSaving(true);
    setError('');
    setSuccess('');
    setProgress('正在写入 Notion...');

    try {
      const response = await fetch('/api/notion/batch-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          content: generatedContent,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '保存失败');
      }

      setProgress('');
      setSuccess('🎉 内容已成功保存到 Notion！');
      
      // 清空表单
      setTimeout(() => {
        setSrtFile(null);
        setLessonId('');
        setGeneratedContent(null);
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      setProgress('');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // 编辑词汇
  // ============================================================

  const handleEditVocab = (index: number, field: keyof AIGeneratedVocab, value: string | number) => {
    if (!generatedContent) return;
    
    const newVocab = [...generatedContent.vocabulary];
    newVocab[index] = { ...newVocab[index], [field]: value };
    
    setGeneratedContent({
      ...generatedContent,
      vocabulary: newVocab,
    });
  };

  const handleDeleteVocab = (index: number) => {
    if (!generatedContent) return;
    
    const newVocab = generatedContent.vocabulary.filter((_, i) => i !== index);
    
    setGeneratedContent({
      ...generatedContent,
      vocabulary: newVocab,
    });
  };

  // ============================================================
  // 编辑语法
  // ============================================================

  const handleEditGrammar = (index: number, field: keyof AIGeneratedGrammar, value: string | number) => {
    if (!generatedContent) return;
    
    const newGrammar = [...generatedContent.grammar];
    newGrammar[index] = { ...newGrammar[index], [field]: value };
    
    setGeneratedContent({
      ...generatedContent,
      grammar: newGrammar,
    });
  };

  const handleDeleteGrammar = (index: number) => {
    if (!generatedContent) return;
    
    const newGrammar = generatedContent.grammar.filter((_, i) => i !== index);
    
    setGeneratedContent({
      ...generatedContent,
      grammar: newGrammar,
    });
  };

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 AI 内容生成器</h1>
          <p className="text-slate-300">上传 SRT 字幕，自动生成词汇、语法、回译内容</p>
        </div>

        {/* 主表单 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          {/* 文件上传 */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">📤 上传 SRT 字幕文件</label>
            <div className="relative">
              <input
                type="file"
                accept=".srt"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-300
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-500 file:text-white
                  hover:file:bg-purple-600
                  file:cursor-pointer cursor-pointer
                  bg-white/5 rounded-xl p-3 border border-white/20"
              />
            </div>
            {srtFile && (
              <p className="mt-2 text-sm text-green-400">✓ 已选择: {srtFile.name}</p>
            )}
          </div>

          {/* Lesson ID */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">📝 Lesson ID</label>
            <input
              type="text"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              placeholder="例如: test-01"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl
                text-white placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 配置选项 */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">⚙️ 生成选项</label>
            <div className="space-y-2">
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.generateVocab}
                  onChange={(e) => setOptions({ ...options, generateVocab: e.target.checked })}
                  className="mr-3 w-5 h-5 rounded border-white/20 bg-white/5 
                    checked:bg-purple-500 cursor-pointer"
                />
                生成词汇 (5-10个)
              </label>
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.generateGrammar}
                  onChange={(e) => setOptions({ ...options, generateGrammar: e.target.checked })}
                  className="mr-3 w-5 h-5 rounded border-white/20 bg-white/5 
                    checked:bg-purple-500 cursor-pointer"
                />
                生成语法 (3-5个)
              </label>
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.generateRecall}
                  onChange={(e) => setOptions({ ...options, generateRecall: e.target.checked })}
                  className="mr-3 w-5 h-5 rounded border-white/20 bg-white/5 
                    checked:bg-purple-500 cursor-pointer"
                />
                生成回译 (1-2句)
              </label>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !srtFile || !lessonId}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 
              text-white font-semibold rounded-xl
              hover:from-purple-600 hover:to-pink-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isGenerating ? '🤖 AI 生成中...' : '🚀 开始生成'}
          </button>

          {/* 进度提示 */}
          {progress && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
              <p className="text-blue-300 text-center">{progress}</p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-300">❌ {error}</p>
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
              <p className="text-green-300">{success}</p>
            </div>
          )}
        </div>

        {/* 生成结果预览 */}
        {generatedContent && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📊 生成结果预览</h2>

            {/* 词汇列表 */}
            {generatedContent.vocabulary.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  📚 词汇 ({generatedContent.vocabulary.length}个)
                </h3>
                <div className="space-y-4">
                  {generatedContent.vocabulary.map((vocab, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={vocab.word}
                            onChange={(e) => handleEditVocab(index, 'word', e.target.value)}
                            className="text-lg font-semibold text-white bg-transparent border-b border-white/20 
                              focus:outline-none focus:border-purple-500 w-full mb-2"
                          />
                          <input
                            type="text"
                            value={vocab.phonetic}
                            onChange={(e) => handleEditVocab(index, 'phonetic', e.target.value)}
                            className="text-sm text-slate-300 bg-transparent border-b border-white/20 
                              focus:outline-none focus:border-purple-500 w-full mb-2"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteVocab(index)}
                          className="ml-4 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg 
                            hover:bg-red-500/30 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                      <textarea
                        value={vocab.definition}
                        onChange={(e) => handleEditVocab(index, 'definition', e.target.value)}
                        className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2 mb-2
                          border border-white/10 focus:outline-none focus:border-purple-500"
                        rows={2}
                      />
                      <textarea
                        value={vocab.definition_cn}
                        onChange={(e) => handleEditVocab(index, 'definition_cn', e.target.value)}
                        className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2 mb-2
                          border border-white/10 focus:outline-none focus:border-purple-500"
                        rows={1}
                      />
                      <textarea
                        value={vocab.example}
                        onChange={(e) => handleEditVocab(index, 'example', e.target.value)}
                        className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2
                          border border-white/10 focus:outline-none focus:border-purple-500"
                        rows={2}
                        placeholder="例句"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 语法列表 */}
            {generatedContent.grammar.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  📖 语法 ({generatedContent.grammar.length}个)
                </h3>
                <div className="space-y-4">
                  {generatedContent.grammar.map((grammar, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={grammar.point}
                          onChange={(e) => handleEditGrammar(index, 'point', e.target.value)}
                          className="flex-1 text-lg font-semibold text-white bg-transparent border-b border-white/20 
                            focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={() => handleDeleteGrammar(index)}
                          className="ml-4 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg 
                            hover:bg-red-500/30 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                      <textarea
                        value={grammar.description}
                        onChange={(e) => handleEditGrammar(index, 'description', e.target.value)}
                        className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2 mb-2
                          border border-white/10 focus:outline-none focus:border-purple-500"
                        rows={3}
                      />
                      <textarea
                        value={grammar.example}
                        onChange={(e) => handleEditGrammar(index, 'example', e.target.value)}
                        className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2
                          border border-white/10 focus:outline-none focus:border-purple-500"
                        rows={2}
                        placeholder="例句"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 回译 */}
            {generatedContent.recall.text_en && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">🔄 回译</h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <textarea
                    value={generatedContent.recall.text_cn}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      recall: { ...generatedContent.recall, text_cn: e.target.value }
                    })}
                    className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2 mb-2
                      border border-white/10 focus:outline-none focus:border-purple-500"
                    rows={2}
                    placeholder="中文"
                  />
                  <textarea
                    value={generatedContent.recall.text_en}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      recall: { ...generatedContent.recall, text_en: e.target.value }
                    })}
                    className="w-full text-sm text-slate-300 bg-white/5 rounded-lg p-2
                      border border-white/10 focus:outline-none focus:border-purple-500"
                    rows={2}
                    placeholder="英文"
                  />
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleSaveToNotion}
                disabled={isSaving}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 
                  text-white font-semibold rounded-xl
                  hover:from-green-600 hover:to-emerald-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isSaving ? '💾 保存中...' : '💾 保存到 Notion'}
              </button>
              <button
                onClick={() => {
                  setGeneratedContent(null);
                  setSuccess('');
                  setError('');
                }}
                className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl
                  hover:bg-white/20 transition-all duration-200"
              >
                🗑️ 放弃
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


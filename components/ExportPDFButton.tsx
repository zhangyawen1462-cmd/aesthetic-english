"use client";

import React, { useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'; // 处理中文必须保留
import { useMembership } from '@/context/MembershipContext';

interface Theme {
  bg?: string;
  text?: string;
  accent?: string;
}

interface ExportPDFButtonProps {
  content: string;
  filename: string;
  lessonId: string;
  type: 'vocab' | 'grammar' | 'script';
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  showLabel?: boolean;
  isMobile?: boolean;
  theme?: Theme;
  isSample?: boolean | 'freeTrial'; // 🆕 课程类型
  onUpgradeClick?: () => void; // 🆕 升级回调
}

export default function ExportPDFButton({ 
  content, 
  filename, 
  lessonId, 
  type,
  className = '',
  style = {},
  iconSize = 16,
  isMobile = false,
  theme,
  isSample = false,
  onUpgradeClick
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { tier, email } = useMembership(); 
  
  // 🔐 权限检查：trial 用户只能在 freeTrial 课程中导出
  const canExport = isSample === 'freeTrial' 
    ? true // freeTrial 课程所有人都可以导出
    : (tier === 'yearly' || tier === 'lifetime'); // 其他课程需要年度/永久会员

  const getExportDescription = () => {
    const descMap = { script: '双语字幕', vocab: '词汇表', grammar: '语法精讲' };
    return descMap[type] || '内容';
  };

  const handleExport = async () => {
    if (!canExport) return;
    
    setShowConfirm(false);
    setIsExporting(true);

    try {
      const userEmail = email || 'patron@aesthetic-english.com';
      const pdfDoc = await PDFDocument.create();
      
      // 1. 注册 fontkit引擎 (极其关键)
      pdfDoc.registerFontkit(fontkit);
      
      // 2. 加载中文字体（优先本地，降级到 CDN）
      const fontSources = [
        '/fonts/custom-font.ttf', // 本地字体
        'https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/fonts/LXGWWenKaiLite-Regular.ttf',
        'https://unpkg.com/lxgw-wenkai-lite-webfont@1.1.0/fonts/LXGWWenKaiLite-Regular.ttf',
        'https://fastly.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/fonts/LXGWWenKaiLite-Regular.ttf'
      ];
      
      let fontBytes: ArrayBuffer | null = null;
      let lastError: Error | null = null;
      
      for (const fontUrl of fontSources) {
        try {
          console.log('尝试加载字体:', fontUrl);
          const res = await fetch(fontUrl, { 
            mode: 'cors',
            cache: 'force-cache'
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fontBytes = await res.arrayBuffer();
          console.log('✅ 字体加载成功:', fontUrl);
          break;
      } catch (err) {
          console.warn('❌ 字体源失败:', fontUrl, err);
          lastError = err as Error;
        }
      }
      
      if (!fontBytes) {
        console.error('所有字体源均失败:', lastError);
        throw new Error('字体加载失败，请检查网络连接或稍后重试。');
      }
      
      const customFont = await pdfDoc.embedFont(fontBytes);
      
      // 3. 写入内容（带自动分页与智能排版）
      await addContentToPDF(pdfDoc, content, type, customFont);
      
      // 4. 添加专属水印
      await addWatermarkToAllPages(pdfDoc, userEmail, lessonId, customFont);
      
      // 5. 触发下载
      const pdfBytes = await pdfDoc.save();
      downloadPDF(pdfBytes, filename);
    } catch (error) {
      console.error('PDF 导出失败:', error);
      alert('导出受阻：请确保网络通畅以加载排版引擎。');
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // UI 渲染 (保持你原本极简优雅的排版)
  // ==========================================

  const handleButtonClick = () => {
    if (isExporting) return;
    
    if (!canExport) {
      // 🚪 无权限时触发升级弹窗
      onUpgradeClick?.();
      return;
    }
    
    setShowConfirm(true);
  };

  const renderButton = () => {
    // 🚫 移动端不显示下载按钮
    if (isMobile) {
      return null;
    }

    return (
      <motion.button
        onClick={handleButtonClick}
        whileHover={!isExporting ? "hover" : undefined}
        initial="initial"
        className={`relative group flex items-center justify-center ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        style={{ width: '40px', height: '40px', ...style }}
        title={canExport ? '导出 PDF' : '升级会员以导出'}
      >
        <motion.div
          variants={{
            initial: { scale: 1, opacity: canExport ? 0.4 : 0.2 },
            hover: { scale: 1.15, opacity: canExport ? 0.7 : 0.3 }
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {isExporting ? (
            <Loader2 size={iconSize} className="animate-spin" style={{ color: theme?.text || '#000' }} />
          ) : (
            <Download size={iconSize} strokeWidth={2} style={{ color: theme?.text || '#000' }} />
          )}
        </motion.div>
      </motion.button>
    );
  };

  return (
    <div className="relative">
      {renderButton()}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 z-[9998] bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-16 top-0 z-[9999] rounded-sm p-6 border whitespace-nowrap"
              style={{ 
                backgroundColor: theme?.bg || '#F7F8F9', 
                color: theme?.text || '#2D0F15',
                borderColor: `${theme?.text || '#2D0F15'}20`
              }}
            >
              <p className="text-xs opacity-70 mb-4">
                是否导出 {getExportDescription()} PDF?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors hover:bg-black/5"
                  style={{ borderColor: `${theme?.text || '#2D0F15'}20` }}
                >
                  取消
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:opacity-90 text-white"
                  style={{ backgroundColor: theme?.accent || '#2D0F15' }}
                >
                  确认
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 以下为辅助函数 (无需更改)
// ==========================================
function wrapText(text: string, maxWidth: number, font: any, fontSize: number) {
  const tokens = text.match(/[\u4e00-\u9fa5]|[^\u4e00-\u9fa5\s]+|\s+/g) || [];
  const lines: string[] = [];
  let currentLine = '';

  for (const token of tokens) {
    try {
      const testLine = currentLine + token;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = token.trimStart(); 
      } else {
        currentLine = testLine;
      }
    } catch (e) { continue; }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function addContentToPDF(pdfDoc: any, content: string, type: string, font: any) {
  let page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  const maxWidth = width - margin * 2;
  const fontSize = 11;
  const lineHeight = 20; 
  
  const titles = { vocab: 'Vocabulary List', grammar: 'Grammar Notes', script: 'Bilingual Script' };
  page.drawText(titles[type as keyof typeof titles] || 'Document', {
    x: margin, y: height - margin, size: 24, font, color: rgb(0.17, 0.06, 0.08),
  });
  
  page.drawLine({
    start: { x: margin, y: height - margin - 15 },
    end: { x: width - margin, y: height - margin - 15 },
    thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
  });

  let yPosition = height - margin - 45; 
  const paragraphs = content.split('\n');
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) { yPosition -= lineHeight * 0.5; continue; }
    const wrappedLines = wrapText(paragraph, maxWidth, font, fontSize);
    for (const line of wrappedLines) {
      if (yPosition < margin + 60) { 
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - margin - 20; 
      }
      try {
        page.drawText(line, { x: margin, y: yPosition, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
      } catch (e) { console.warn("字符渲染跳过:", line); }
      yPosition -= lineHeight;
    }
    yPosition -= 6; 
  }
}

async function addWatermarkToAllPages(pdfDoc: any, userEmail: string, lessonId: string, font: any) {
  const pages = pdfDoc.getPages();
  const watermarkLine1 = `Private Collection of: ${userEmail}`;
  const watermarkLine2 = `小红书 @审美英语Aesthetic`;
  
  for (const page of pages) {
    const { width } = page.getSize();
    const textWidth1 = font.widthOfTextAtSize(watermarkLine1, 11);
    page.drawText(watermarkLine1, {
      x: (width - textWidth1) / 2, y: 40, size: 11, font, color: rgb(0.5, 0.5, 0.5), opacity: 0.5,
    });
    const textWidth2 = font.widthOfTextAtSize(watermarkLine2, 11);
    page.drawText(watermarkLine2, {
      x: (width - textWidth2) / 2, y: 22, size: 11, font, color: rgb(0.5, 0.5, 0.5), opacity: 0.5,
    });
  }
}

function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
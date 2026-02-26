import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Star, Edit3 } from 'lucide-react';
import type { TranscriptLine } from '@/data/types';
import type { ThemeConfig } from '@/lib/theme-config';
import HighlightRenderer from './HighlightRenderer';

interface Highlight {
  id: string;
  text: string;
  color: string;
  lineId: number;
  startOffset: number;
  endOffset: number;
}

interface PreviewSelection {
  lineId: number;
  startOffset: number;
  endOffset: number;
}

export type LangMode = 'en' | 'cn' | 'bi';

interface ScriptLineProps {
  line: TranscriptLine;
  index: number;
  isActive: boolean;
  isSaved: boolean;
  isCopied: boolean;
  hasNote: boolean;
  isEditingNote: boolean;
  noteContent: string;
  langMode: LangMode;
  theme: ThemeConfig;
  isMobile: boolean;
  isSelecting: boolean;
  highlights: Highlight[];
  previewSelection: PreviewSelection | null;
  onLineClick: (time: number) => void;
  onCopy: (e: React.MouseEvent) => void;
  onToggleSave: () => void;
  onNoteToggle: (e: React.MouseEvent) => void;
  onNoteSave: (note: string) => void;
  onTouchStart: (e: React.TouchEvent, lineId: number) => void;
  onTouchMove: (e: React.TouchEvent, lineId: number) => void;
  onTouchEnd: (e: React.TouchEvent, lineId: number, text: string) => void;
  onMouseUp: (lineId: number, text: string) => void;
  onMouseLeave: () => void;
  onWordMouseDown: (lineId: number, wordIndex: number) => void;
  onWordMouseEnter: (e: React.MouseEvent, lineId: number, wordIndex: number) => void;
  onHighlightClick: (e: React.MouseEvent, highlight: Highlight) => void;
  onHighlightDoubleClick: (e: React.MouseEvent, highlight: Highlight) => void;
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 获取收藏后的样式
const getSavedStyle = (themeId: string) => {
  switch (themeId) {
    case 'daily':
      return { backgroundColor: '#1A2233', color: '#F7F8F9' };
    case 'cognitive':
      return { backgroundColor: '#2D0F15', color: '#F7F8F9' };
    case 'business':
      return { backgroundColor: '#4A2C32', color: '#E8D5D8' };
    default:
      return { backgroundColor: '', color: '' };
  }
};

// 获取活跃字幕的背景色
const getActiveBgColor = (themeId: string) => {
  switch (themeId) {
    case 'daily':
      return '#FFF0E8';
    case 'cognitive':
      return '#E5F6FF';
    case 'business':
      return '#5A3A3F';
    default:
      return '#F5F5F5';
  }
};

// 获取文字颜色
const getTextColor = (themeId: string) => {
  return themeId === 'daily' ? '#000000' : 'inherit';
};

// 获取活跃字幕的边框颜色
const getActiveBorderColor = (themeId: string, themeText: string) => {
  const textColor = getTextColor(themeId);
  if (textColor === '#000000') {
    return 'rgba(0, 0, 0, 0.15)';
  }
  return `${themeText}26`;
};

export default function ScriptLine({
  line,
  index,
  isActive,
  isSaved,
  isCopied,
  hasNote,
  isEditingNote,
  noteContent,
  langMode,
  theme,
  isMobile,
  isSelecting,
  highlights,
  previewSelection,
  onLineClick,
  onCopy,
  onToggleSave,
  onNoteToggle,
  onNoteSave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseUp,
  onMouseLeave,
  onWordMouseDown,
  onWordMouseEnter,
  onHighlightClick,
  onHighlightDoubleClick,
}: ScriptLineProps) {
  const savedStyle = getSavedStyle(theme.id);
  const activeBgColor = getActiveBgColor(theme.id);
  const textColor = getTextColor(theme.id);
  const activeBorderColor = getActiveBorderColor(theme.id, theme.text);

  return (
    <motion.div
      key={line.id}
      data-line-id={index}
      onClick={() => onLineClick(line.start)}
      initial={false}
      className="relative py-4 px-2 md:px-5 mb-1 transition-all duration-300 cursor-pointer group overflow-hidden rounded-[6px]"
      style={{
        backgroundColor: isActive ? activeBgColor : (isSaved ? savedStyle.backgroundColor : `${theme.bg}F5`),
        boxShadow: isActive 
          ? '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)'
          : '0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        border: isActive ? `0.5px solid ${activeBorderColor}` : 'none',
      }}
    >
      {/* 收藏后的背景色 */}
      {isSaved && !isActive && (
        <div
          className="absolute inset-0 -z-10 rounded-[6px] transition-all duration-500"
          style={{ backgroundColor: savedStyle.backgroundColor }}
        />
      )}

      {/* 活跃状态的高亮背景 */}
      {isActive && (
        <div
          className="absolute inset-0 -z-10 rounded-[6px] transition-opacity duration-300"
          style={{ backgroundColor: theme.highlight, opacity: 0.15 }}
        />
      )}
      
      {/* 活跃状态的顶部高亮条 */}
      {isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px]"
          style={{ backgroundColor: theme.accent }}
        />
      )}

      <div className="flex flex-col gap-2">
        {/* 英文 */}
        {(langMode === 'en' || langMode === 'bi') && (
          <p 
            className={`font-medium tracking-tight transition-all duration-300 ${
              isActive ? 'text-[19px] md:text-[23px]' : 'text-[18px] md:text-[22px]'
            }`}
            style={{
              color: isSaved && !isActive ? savedStyle.color : textColor,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
              lineHeight: '1.2',
              userSelect: isMobile ? 'none' : 'text',
              WebkitUserSelect: isMobile ? 'none' : 'text',
              WebkitTouchCallout: isMobile ? 'none' : 'default',
              touchAction: isSelecting ? 'none' : 'pan-y',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => isMobile && onTouchStart(e, line.id)}
            onTouchMove={(e) => isMobile && onTouchMove(e, line.id)}
            onTouchEnd={(e) => isMobile && onTouchEnd(e, line.id, line.en)}
            onMouseUp={() => !isMobile && onMouseUp(line.id, line.en)}
            onMouseLeave={onMouseLeave}
          >
            <HighlightRenderer
              text={line.en}
              lineId={line.id}
              highlights={highlights}
              previewSelection={previewSelection}
              theme={theme}
              isMobile={isMobile}
              onWordMouseDown={onWordMouseDown}
              onWordMouseEnter={onWordMouseEnter}
              onHighlightClick={onHighlightClick}
              onHighlightDoubleClick={onHighlightDoubleClick}
            />
          </p>
        )}

        {/* 纯中文模式 */}
        {langMode === 'cn' && (
          <p 
            className={`transition-all duration-300 ${
              isActive ? 'text-[20px] md:text-[23px]' : 'text-[19px] md:text-[22px]'
            }`}
            style={{
              color: isSaved && !isActive ? savedStyle.color : textColor,
              opacity: 0.75,
              fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif',
              lineHeight: '1.2',
              userSelect: isMobile ? 'none' : 'text',
              WebkitUserSelect: isMobile ? 'none' : 'text',
              WebkitTouchCallout: isMobile ? 'none' : 'default',
              touchAction: isSelecting ? 'none' : 'pan-y',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => isMobile && onTouchStart(e, line.id + 10000)}
            onTouchMove={(e) => isMobile && onTouchMove(e, line.id + 10000)}
            onTouchEnd={(e) => isMobile && onTouchEnd(e, line.id + 10000, line.cn)}
            onMouseUp={() => !isMobile && onMouseUp(line.id + 10000, line.cn)}
            onMouseLeave={onMouseLeave}
          >
            <HighlightRenderer
              text={line.cn}
              lineId={line.id + 10000}
              highlights={highlights}
              previewSelection={previewSelection}
              theme={theme}
              isMobile={isMobile}
              onWordMouseDown={onWordMouseDown}
              onWordMouseEnter={onWordMouseEnter}
              onHighlightClick={onHighlightClick}
              onHighlightDoubleClick={onHighlightDoubleClick}
            />
          </p>
        )}

        {/* 双语模式下的中文 */}
        {langMode === 'bi' && (
          <p 
            className={`transition-all duration-300 ${
              isActive ? 'text-[16px] md:text-[19px]' : 'text-[15px] md:text-[18px]'
            }`}
            style={{ 
              letterSpacing: '0.01em',
              color: isSaved && !isActive ? savedStyle.color : textColor,
              opacity: 0.75,
              fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif',
              lineHeight: '1.2',
              userSelect: isMobile ? 'none' : 'text',
              WebkitUserSelect: isMobile ? 'none' : 'text',
              WebkitTouchCallout: isMobile ? 'none' : 'default',
              touchAction: isSelecting ? 'none' : 'pan-y',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => isMobile && onTouchStart(e, line.id + 10000)}
            onTouchMove={(e) => isMobile && onTouchMove(e, line.id + 10000)}
            onTouchEnd={(e) => isMobile && onTouchEnd(e, line.id + 10000, line.cn)}
            onMouseUp={() => !isMobile && onMouseUp(line.id + 10000, line.cn)}
            onMouseLeave={onMouseLeave}
          >
            <HighlightRenderer
              text={line.cn}
              lineId={line.id + 10000}
              highlights={highlights}
              previewSelection={previewSelection}
              theme={theme}
              isMobile={isMobile}
              onWordMouseDown={onWordMouseDown}
              onWordMouseEnter={onWordMouseEnter}
              onHighlightClick={onHighlightClick}
              onHighlightDoubleClick={onHighlightDoubleClick}
            />
          </p>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between -mt-1">
          {/* 时间轴 */}
          <span 
            className={`font-mono opacity-40 ${isMobile ? 'text-[9.6px]' : 'text-[14.4px]'}`}
            style={{ 
              color: theme.text,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", "Menlo", monospace',
              marginLeft: isMobile ? '0' : '0.2rem'
            }}
          >
            {formatTime(line.start)}
          </span>

          {/* 操作图标 */}
          <div className={`flex items-center opacity-50 group-hover:opacity-100 transition-opacity ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {/* 播放 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onLineClick(line.start); }}
              className="hover:opacity-70 transition-opacity"
              style={{ color: theme.text }}
              title="播放"
            >
              <svg width={isMobile ? "12" : "16.8"} height={isMobile ? "12" : "16.8"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
            </motion.button>

            {/* 复制 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onCopy}
              className="hover:opacity-70 transition-opacity"
              style={{ color: isCopied ? theme.accent : theme.text }}
              title="复制"
            >
              {isCopied ? (
                <svg width={isMobile ? "12" : "16.8"} height={isMobile ? "12" : "16.8"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <Copy size={isMobile ? 12 : 16.8} />
              )}
            </motion.button>

            {/* 收藏 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              className="hover:opacity-70 transition-opacity"
              style={{ color: isSaved ? theme.accent : theme.text }}
              title="收藏"
            >
              <Star size={isMobile ? 12 : 16.8} fill={isSaved ? theme.accent : 'none'} />
            </motion.button>

            {/* 笔记 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNoteToggle}
              className="hover:opacity-70 transition-opacity"
              style={{ color: hasNote || isEditingNote ? theme.accent : theme.text }}
              title="笔记"
            >
              <Edit3 size={isMobile ? 12 : 16.8} />
            </motion.button>
          </div>
        </div>

        {/* 笔记编辑区 */}
        <AnimatePresence>
          {isEditingNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-2 overflow-hidden"
            >
              <textarea
                autoFocus
                defaultValue={noteContent}
                onChange={(e) => onNoteSave(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="写下你的笔记..."
                className="w-full p-2 text-sm rounded-md border outline-none resize-none"
                style={{
                  backgroundColor: `${theme.bg}80`,
                  borderColor: `${theme.accent}30`,
                  color: theme.text,
                  fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
                rows={3}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 显示已有笔记 */}
        {hasNote && !isEditingNote && (
          <div 
            className="mt-2 p-2 text-sm rounded-md border-l-2"
            style={{
              backgroundColor: `${theme.accent}08`,
              borderColor: theme.accent,
              color: theme.text,
              fontFamily: '"PingFang SC", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            }}
          >
            {noteContent}
          </div>
        )}
      </div>
    </motion.div>
  );
}




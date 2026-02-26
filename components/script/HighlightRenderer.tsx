import React from 'react';
import type { ThemeConfig } from '@/lib/theme-config';

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

interface HighlightRendererProps {
  text: string;
  lineId: number;
  highlights: Highlight[];
  previewSelection: PreviewSelection | null;
  theme: ThemeConfig;
  isMobile: boolean;
  onWordMouseDown?: (lineId: number, wordIndex: number) => void;
  onWordMouseEnter?: (e: React.MouseEvent, lineId: number, wordIndex: number) => void;
  onHighlightClick?: (e: React.MouseEvent, highlight: Highlight) => void;
  onHighlightDoubleClick?: (e: React.MouseEvent, highlight: Highlight) => void;
}

// 🎯 将文本按空格拆分成单词数组（保留标点符号）
const tokenizeWords = (text: string): string[] => {
  return text.split(/(\s+)/).filter(token => token.length > 0);
};

// 🎨 获取主题对应的阴影颜色
const getThemeShadowColor = (themeId: string) => {
  switch (themeId) {
    case 'daily':
      return 'rgba(210, 180, 140, 0.4)';
    case 'cognitive':
      return 'rgba(120, 150, 180, 0.35)';
    case 'business':
      return 'rgba(255, 192, 203, 0.3)';
    default:
      return 'rgba(0, 0, 0, 0.15)';
  }
};

// 🎨 获取预览背景色（根据主题）
const getPreviewBackgroundColor = (themeId: string) => {
  switch (themeId) {
    case 'daily':
      return 'rgba(210, 180, 140, 0.5)';
    case 'cognitive':
      return 'rgba(120, 150, 180, 0.45)';
    case 'business':
      return 'rgba(255, 192, 203, 0.4)';
    default:
      return 'rgba(255, 234, 40, 0.5)';
  }
};

export default function HighlightRenderer({
  text,
  lineId,
  highlights,
  previewSelection,
  theme,
  isMobile,
  onWordMouseDown,
  onWordMouseEnter,
  onHighlightClick,
  onHighlightDoubleClick,
}: HighlightRendererProps) {
  const words = tokenizeWords(text);
  const lineHighlights = highlights.filter(h => h.lineId === lineId);
  const isPreviewingThisLine = previewSelection && previewSelection.lineId === lineId;
  
  const isDarkTheme = theme.id === 'business';
  const themeShadowColor = getThemeShadowColor(theme.id);
  const previewBgColor = getPreviewBackgroundColor(theme.id);

  return (
    <>
      {words.map((word, wordIndex) => {
        const isInPreview = isPreviewingThisLine && 
          wordIndex >= previewSelection.startOffset && 
          wordIndex < previewSelection.endOffset;

        const matchedHighlight = lineHighlights.find(h => 
          wordIndex >= h.startOffset && wordIndex < h.endOffset
        );

        // 空格处理
        if (word.trim().length === 0) {
          return (
            <span 
              key={`space-${lineId}-${wordIndex}`} 
              data-word-index={wordIndex}
              data-line-id={lineId}
            >
              {word}
            </span>
          );
        }

        // 确定背景色和样式
        let backgroundColor = 'transparent';
        let boxShadow = 'none';
        let isHighlighted = false;

        if (isInPreview) {
          backgroundColor = previewBgColor;
          boxShadow = `0 2px 6px ${themeShadowColor}, 0 1px 3px ${themeShadowColor}`;
          isHighlighted = true;
        } else if (matchedHighlight) {
          backgroundColor = isDarkTheme 
            ? '#F5E6E8' 
            : (isMobile ? `${matchedHighlight.color}F0` : `${matchedHighlight.color}D9`);
          boxShadow = isDarkTheme 
            ? '0 1px 3px rgba(93, 31, 39, 0.25)'
            : (theme.id === 'daily' 
                ? `0 1px 3px ${matchedHighlight.color}40, 0 0.5px 1.5px ${matchedHighlight.color}30`
                : (theme.id === 'cognitive'
                    ? `0 1px 3px ${matchedHighlight.color}35, 0 0.5px 1px rgba(0,0,0,0.08)`
                    : `0 1px 3px ${matchedHighlight.color}40`
                  )
              );
          isHighlighted = true;
        }

        // 判断当前词是不是高亮块的"头"或"尾"
        let isStart = false;
        let isEnd = false;

        if (matchedHighlight) {
          isStart = wordIndex === matchedHighlight.startOffset;
          isEnd = wordIndex === (matchedHighlight.endOffset - 1);
        } else if (isInPreview) {
          isStart = wordIndex === previewSelection.startOffset;
          isEnd = wordIndex === (previewSelection.endOffset - 1);
        }

        const radius = (isStart && isEnd) ? '4px' : 
                       isStart ? '4px 0 0 4px' :   
                       isEnd ? '0 4px 4px 0' :     
                       '0';

        // 背景层溢出量
        const bleedLeft = isStart ? '0' : '-4px';
        const bleedRight = isEnd ? '0' : '-4px';

        return (
          <span
            key={`word-${lineId}-${wordIndex}`}
            data-word-index={wordIndex}
            data-line-id={lineId}
            className={`relative inline-block transition-all ${isHighlighted ? 'cursor-pointer' : ''}`}
            style={{
              margin: isHighlighted ? `0 ${isEnd ? '0' : '-2px'} 0 ${isStart ? '0' : '-2px'}` : '0',
              padding: isHighlighted ? '1px 3px' : '0',
              opacity: isInPreview ? 0.8 : 1,
              verticalAlign: 'baseline',
              transform: 'translateZ(0)',
              zIndex: 0,
              overflow: 'visible',
              isolation: 'isolate',
            }}
            onMouseDown={() => !isMobile && onWordMouseDown?.(lineId, wordIndex)}
            onMouseEnter={(e) => !isMobile && onWordMouseEnter?.(e, lineId, wordIndex)}
            onClick={(e) => {
              if (matchedHighlight && !isInPreview && onHighlightClick) {
                onHighlightClick(e, matchedHighlight);
              }
            }}
            onDoubleClick={(e) => {
              if (!isMobile && matchedHighlight && !isInPreview && onHighlightDoubleClick) {
                onHighlightDoubleClick(e, matchedHighlight);
              }
            }}
          >
            {/* 背景层 */}
            {isHighlighted && (
              <span 
                style={{
                  position: 'absolute',
                  backgroundColor,
                  top: 0,
                  bottom: 0,
                  left: bleedLeft,
                  right: bleedRight,
                  borderRadius: radius,
                  zIndex: -1,
                }}
              />
            )}
            
            {/* 文字层 */}
            <span 
              style={{ 
                position: 'relative', 
                zIndex: 1,
                color: isDarkTheme && isHighlighted ? '#5D1F27' : 'inherit',
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </>
  );
}




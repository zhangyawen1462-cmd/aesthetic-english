import React from 'react';
import { motion } from 'framer-motion';

interface ColorPickerProps {
  position: { x: number; y: number };
  colors: Array<{ id: string; color: string; name: string }>;
  showDeleteButton: boolean;
  isMobile: boolean;
  onColorSelect: (color: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function ColorPicker({
  position,
  colors,
  showDeleteButton,
  isMobile,
  onColorSelect,
  onDelete,
  onClose,
}: ColorPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed z-[100] flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2.5 py-1.5 md:py-2 rounded-full backdrop-blur-xl border shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* 颜色按钮组 */}
      {colors.map((color) => (
        <motion.button
          key={color.id}
          onClick={() => onColorSelect(color.color)}
          whileTap={{ scale: 0.9 }}
          className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white transition-transform active:scale-90"
          style={{
            backgroundColor: color.color,
            boxShadow: `0 2px 6px ${color.color}60, 0 1px 2px rgba(0,0,0,0.05)`, 
          }}
          title={color.name}
        />
      ))}
      
      {/* 删除按钮 */}
      {showDeleteButton && onDelete && (
        <>
          <div className="w-px h-4 md:h-5 bg-black/10" />
          <motion.button
            onClick={onDelete}
            whileTap={{ scale: 0.85 }}
            className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-red-500 bg-red-50 transition-transform active:scale-90"
            title="删除高亮"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </motion.button>
        </>
      )}
      
      {/* 关闭按钮 */}
      <motion.button
        onClick={onClose}
        whileTap={{ scale: 0.9 }}
        className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold transition-opacity active:opacity-70"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          color: '#333333',
        }}
      >
        ✕
      </motion.button>
    </motion.div>
  );
}






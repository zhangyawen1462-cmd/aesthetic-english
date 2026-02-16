'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, RefreshCw, Eye, X } from 'lucide-react';
import type { Lesson } from '@/data/types';

interface LayoutConfig {
  dashboard: string[];
  dailyCinema: string[];
  cognitive: string[];
  business: string[];
}

// 布局槽位配置 - 顺序与 Dashboard 实际渲染顺序完全一致
const LAYOUT_SLOTS = {
  dashboard: [
    // 左列（从上到下）- Dashboard 渲染顺序：0, 1, 2, 3
    { id: 'slot-0', col: 'left', ratio: 'aspect-[3/4]', type: 'video', label: '左1' },
    { id: 'slot-1', col: 'left', ratio: 'aspect-square', type: 'card', label: '左2' },
    { id: 'slot-2', col: 'left', ratio: 'aspect-[3/4]', type: 'video', label: '左3' },
    { id: 'slot-3', col: 'left', ratio: 'aspect-square', type: 'card', label: '左4' },
    // 右列（从上到下）- Dashboard 渲染顺序：4, 5, 6, 7
    { id: 'slot-4', col: 'right', ratio: 'aspect-square', type: 'card', label: '右1' },
    { id: 'slot-5', col: 'right', ratio: 'aspect-[3/4]', type: 'card', label: '右2' },
    { id: 'slot-6', col: 'right', ratio: 'aspect-[9/16]', type: 'card', label: '右3' },
    { id: 'slot-7', col: 'right', ratio: 'aspect-[3/4]', type: 'video', label: '右4' },
  ],
  dailyCinema: [
    // 实际渲染顺序：左列 0,2,4  右列 1,3,5
    { id: 'slot-0', col: 'left', ratio: 'aspect-[9/16]', type: 'card', label: '左1' },
    { id: 'slot-1', col: 'right', ratio: 'aspect-square', type: 'video', label: '右1' },
    { id: 'slot-2', col: 'left', ratio: 'aspect-[3/4]', type: 'video', label: '左2' },
    { id: 'slot-3', col: 'right', ratio: 'aspect-[9/16]', type: 'card', label: '右2' },
    { id: 'slot-4', col: 'left', ratio: 'aspect-square', type: 'card', label: '左3' },
    { id: 'slot-5', col: 'right', ratio: 'aspect-[3/4]', type: 'video', label: '右3' },
  ],
  cognitive: [
    { id: 'slot-0', col: 'left', ratio: 'aspect-video', type: 'video', label: '左1' },
    { id: 'slot-1', col: 'right', ratio: 'aspect-video', type: 'video', label: '右1' },
  ],
  business: [
    { id: 'slot-0', col: 'left', ratio: 'aspect-video', type: 'video', label: '左1' },
    { id: 'slot-1', col: 'right', ratio: 'aspect-video', type: 'video', label: '右1' },
  ],
};

export default function LayoutManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [layout, setLayout] = useState<LayoutConfig>({
    dashboard: [],
    dailyCinema: [],
    cognitive: [],
    business: [],
  });
  const [activeTab, setActiveTab] = useState<keyof LayoutConfig>('dashboard');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 抽屉状态

  // 获取所有已发布课程 + 加载已保存的布局
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. 获取所有课程
        const lessonsRes = await fetch('/api/lessons');
        const lessonsData = await lessonsRes.json();
        if (lessonsData.success) {
          setLessons(lessonsData.data);
        }

        // 2. 加载已保存的布局
        const layoutRes = await fetch('/api/layout');
        const layoutData = await layoutRes.json();
        if (layoutData.success) {
          setLayout(layoutData.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // 获取未使用的课程（只显示 Display_Position 为空或 available-pool 的课程）
  const availableLessons = lessons.filter(lesson => {
    // 1. 必须是未分配位置的课程（Display_Position 为空或 available-pool）
    const isAvailable = !lesson.displayPosition || lesson.displayPosition === 'available-pool';
    if (!isAvailable) return false;

    // 2. 根据当前标签页过滤分类
    if (activeTab === 'dashboard') {
      // Dashboard 可以显示 daily 分类的视频和所有图片卡片
      return lesson.category === 'daily' || !lesson.category;
    }
    if (activeTab === 'dailyCinema') {
      // Daily Cinema 可以显示 daily 分类的视频和所有图片卡片
      return lesson.category === 'daily' || !lesson.category;
    }
    if (activeTab === 'cognitive') return lesson.category === 'cognitive';
    if (activeTab === 'business') return lesson.category === 'business';
    return false;
  });

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const overId = over.id as string;
    const activeIdStr = active.id as string;

    // 如果拖到槽位上
    if (overId.startsWith('slot-')) {
      const slotIndex = parseInt(overId.split('-')[1]);
      const newLayout = [...layout[activeTab]];
      
      // 如果是从可用列表拖过来
      if (!layout[activeTab].includes(activeIdStr)) {
        newLayout[slotIndex] = activeIdStr;
      } 
      // 如果是槽位之间交换
      else {
        const oldIndex = newLayout.indexOf(activeIdStr);
        const temp = newLayout[slotIndex];
        newLayout[slotIndex] = activeIdStr;
        if (temp) {
          newLayout[oldIndex] = temp;
        } else {
          newLayout[oldIndex] = '';
        }
      }
      
      setLayout(prev => ({
        ...prev,
        [activeTab]: newLayout
      }));
    }

    setActiveId(null);
  };

  // 移除课程（将课程从卡槽移回可用池）
  const removeLesson = async (index: number, lessonId: string) => {
    try {
      // 1. 更新本地状态
    setLayout(prev => {
      const newLayout = [...prev[activeTab]];
      newLayout[index] = '';
      return {
        ...prev,
        [activeTab]: newLayout
      };
    });

      // 2. 更新 Notion 数据库，将 Display_Position 改为 available-pool
      const response = await fetch('/api/layout/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      });

      if (!response.ok) {
        throw new Error('移除失败');
      }

      // 3. 刷新课程列表
      const lessonsRes = await fetch('/api/lessons');
      const lessonsData = await lessonsRes.json();
      if (lessonsData.success) {
        setLessons(lessonsData.data);
      }
    } catch (error) {
      console.error('移除课程失败:', error);
      alert('❌ 移除失败，请重试');
    }
  };

  // 保存布局
  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout)
      });
      
      if (response.ok) {
        alert('✅ 布局已保存！');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      alert('❌ 保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 标签页配置
  const tabConfig = {
    dashboard: { label: 'Dashboard 精选', emoji: '🏠' },
    dailyCinema: { label: 'Daily Cinema', emoji: '🎬' },
    cognitive: { label: 'Cognitive 精选', emoji: '🧠' },
    business: { label: 'Business 精选', emoji: '💼' },
  };

  const slots = LAYOUT_SLOTS[activeTab];
  const leftSlots = slots.filter(s => s.col === 'left');
  const rightSlots = slots.filter(s => s.col === 'right');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">LOADING</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-[1800px] mx-auto">
        
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🎨 可视化布局管理器</h1>
          <p className="text-slate-300 text-sm">左边：拖拽到方框槽位 | 右边：可用课程</p>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(Object.keys(tabConfig) as Array<keyof LayoutConfig>).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {tabConfig[tab].emoji} {tabConfig[tab].label}
            </button>
          ))}
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* 左侧：布局预览区 - 全宽 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  📐 布局预览
                </h2>
                <div className="flex gap-2">
                <button
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 flex items-center gap-2"
                >
                  📚 可用课程 ({availableLessons.length})
                </button>
                  <button
                    onClick={() => {
                      const path = activeTab === 'dashboard' ? '/dashboard' :
                                   activeTab === 'dailyCinema' ? '/daily-cinema' :
                                   `/course/${activeTab}`;
                      window.open(path, '_blank');
                    }}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    预览
                  </button>
                  <button
                    onClick={() => setLayout(prev => ({ ...prev, [activeTab]: [] }))}
                    className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    清空
                  </button>
                </div>
              </div>

            {/* 双列布局 - 缩放到 0.5 */}
            <div className="grid grid-cols-2 gap-4 scale-[0.5] origin-top">
                
                {/* 左列 */}
                <div className="flex flex-col gap-4">
                  <div className="text-center text-white text-sm font-bold mb-2 bg-blue-500/20 py-2 rounded">
                    ← 左列
                  </div>
                  {leftSlots.map((slot, index) => {
                    const slotIndex = slots.indexOf(slot);
                    const lessonId = layout[activeTab][slotIndex];
                    const lesson = lessons.find(l => l.id === lessonId);
                    
                    return (
                      <DropSlot
                        key={slot.id}
                        slotId={slot.id}
                        ratio={slot.ratio}
                        type={slot.type}
                        lesson={lesson}
                        slotNumber={slotIndex}
                        slotLabel={`左${index + 1}`}
                      onRemove={() => removeLesson(slotIndex, lessonId)}
                      />
                    );
                  })}
                </div>

                {/* 右列 */}
                <div className="flex flex-col gap-4">
                  <div className="text-center text-white text-sm font-bold mb-2 bg-purple-500/20 py-2 rounded">
                    右列 →
                  </div>
                  {rightSlots.map((slot, index) => {
                    const slotIndex = slots.indexOf(slot);
                    const lessonId = layout[activeTab][slotIndex];
                    const lesson = lessons.find(l => l.id === lessonId);
                    
                    return (
                      <DropSlot
                        key={slot.id}
                        slotId={slot.id}
                        ratio={slot.ratio}
                        type={slot.type}
                        lesson={lesson}
                        slotNumber={slotIndex}
                        slotLabel={`右${index + 1}`}
                      onRemove={() => removeLesson(slotIndex, lessonId)}
                      />
                    );
                  })}
                </div>

              </div>
            </div>

          {/* 右侧抽屉：可用课程 */}
          <div 
            className={`fixed top-0 right-0 h-full w-[500px] bg-slate-900/95 backdrop-blur-xl border-l border-white/20 shadow-2xl transition-transform duration-300 ease-out z-50 ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                📚 可用课程 ({availableLessons.length})
              </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* 抽屉内容 */}
              <div className="flex-1 overflow-y-auto p-6">
              {availableLessons.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>没有可用的课程</p>
                </div>
              ) : (
                  <div className="grid grid-cols-2 gap-4">
                  {availableLessons.map(lesson => (
                    <DraggableLesson key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* 遮罩层 */}
          {isDrawerOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}

          {/* 拖拽预览 */}
          <DragOverlay>
            {activeId && !activeId.startsWith('slot-') ? (
              <div className="opacity-80 rotate-3 scale-105">
                <LessonCard lesson={lessons.find(l => l.id === activeId)!} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* 保存按钮 */}
        <button
          onClick={saveLayout}
          disabled={isSaving}
          className="fixed bottom-8 right-8 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 
            text-white font-semibold rounded-full shadow-2xl
            hover:from-green-600 hover:to-emerald-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 transform hover:scale-105
            flex items-center gap-2 z-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              💾 保存布局
            </>
          )}
        </button>

      </div>
    </div>
  );
}

// 槽位组件
function DropSlot({ 
  slotId, 
  ratio, 
  type, 
  lesson, 
  slotNumber,
  slotLabel,
  onRemove 
}: { 
  slotId: string; 
  ratio: string; 
  type: string;
  lesson?: Lesson;
  slotNumber: number;
  slotLabel?: string;
  onRemove: () => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: slotId });

  return (
    <div
      ref={setNodeRef}
      className={`relative ${ratio} rounded-lg border-2 border-dashed transition-all ${
        isOver 
          ? 'border-green-400 bg-green-500/20 scale-105' 
          : lesson 
            ? 'border-purple-500/50 bg-purple-500/10'
            : 'border-slate-600 bg-slate-800/30'
      }`}
    >
      {lesson ? (
        <div className="relative w-full h-full group bg-black/20">
          <img
            src={lesson.coverImg}
            alt={lesson.titleEn}
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg" />
          
          {/* 槽位编号 */}
          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
            {slotLabel || `#${slotNumber}`}
          </div>
          
          {/* 类型标签 */}
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {type === 'video' ? '🎬 视频' : '🖼️ 卡片'}
          </div>
          
          {/* 删除按钮 */}
          <button
            onClick={onRemove}
            className="absolute bottom-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* 标题 */}
          {type === 'video' && (
            <div className="absolute bottom-2 left-2 right-12">
              <p className="text-white text-xs font-medium line-clamp-1">{lesson.titleCn}</p>
              <p className="text-white/70 text-[10px] line-clamp-1">{lesson.titleEn}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-center p-2">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-xs font-medium">{slotLabel || `#${slotNumber}`}</div>
          <div className="text-[10px] mt-1">{type === 'video' ? '视频' : '卡片'}</div>
          <div className="text-[10px] opacity-60">{ratio.replace('aspect-', '')}</div>
        </div>
      )}
    </div>
  );
}

// 可拖拽课程
function DraggableLesson({ lesson }: { lesson: Lesson }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
      >
        <LessonCard lesson={lesson} />
      </div>
    </div>
  );
}

// 课程卡片
function LessonCard({ lesson }: { lesson: Lesson }) {
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // 判断是否为纯图片卡片
  const isImageCard = !lesson.videoUrl && !lesson.titleCn && !lesson.titleEn;
  
  // 根据图片实际尺寸计算比例
  const getAspectRatio = () => {
    if (!imgDimensions) return 'aspect-square'; // 默认方形
    
    const ratio = imgDimensions.width / imgDimensions.height;
    
    // 根据比例返回最接近的 Tailwind class
    if (ratio > 1.5) return 'aspect-video'; // 16:9
    if (ratio > 1.2) return 'aspect-[4/3]'; // 4:3
    if (ratio > 0.9 && ratio < 1.1) return 'aspect-square'; // 1:1
    if (ratio > 0.6 && ratio < 0.8) return 'aspect-[3/4]'; // 3:4
    if (ratio < 0.6) return 'aspect-[9/16]'; // 9:16
    
    return 'aspect-square'; // 默认
  };
  
  const aspectRatio = isImageCard ? getAspectRatio() : 'aspect-[3/4]';
  
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
      <div className={`${aspectRatio} relative bg-black/20`}>
        <img
          src={lesson.coverImg}
          alt={lesson.titleEn || lesson.id}
          className="w-full h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget;
            setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            console.log('Image loaded:', lesson.coverImg, `${img.naturalWidth}x${img.naturalHeight}`);
          }}
          onError={(e) => {
            console.error('Image failed to load:', lesson.coverImg);
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23333" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E图片加载失败%3C/text%3E%3Ctext x="50%25" y="60%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="10"%3E%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* 只有视频课程才显示标题 */}
        {!isImageCard && (
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white text-xs font-medium line-clamp-1">{lesson.titleCn}</p>
            <p className="text-white/70 text-[10px] line-clamp-1">{lesson.titleEn}</p>
          </div>
        )}
        
        {/* 纯图片卡片显示标识和尺寸 */}
        {isImageCard && (
          <>
            <div className="absolute top-2 right-2 bg-pink-500/80 text-white text-xs px-2 py-1 rounded">
              🖼️ 卡片
            </div>
            {imgDimensions && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {imgDimensions.width}×{imgDimensions.height}
              </div>
            )}
          </>
        )}
      </div>
      <div className="p-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{lesson.ep ? `Vol.${lesson.ep}` : lesson.id}</span>
          <span className="text-purple-400">{lesson.category || 'mood'}</span>
        </div>
      </div>
    </div>
  );
}

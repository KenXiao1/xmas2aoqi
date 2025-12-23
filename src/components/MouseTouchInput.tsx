import React, { useEffect, useRef, useContext, useCallback } from 'react';
import { TreeContext, TreeContextType } from '../types';

const MouseTouchInput: React.FC = () => {
  const {
    setState,
    state,
    setPointer,
    setHoverProgress,
    setClickTrigger,
    setPanOffset,
    setZoomOffset,
    setRotationBoost,
    selectedPhotoUrl
  } = useContext(TreeContext) as TreeContextType;

  const containerRef = useRef<HTMLDivElement>(null);

  // 拖拽状态
  const isDragging = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // 触摸状态
  const touchStartDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const isTwoFingerTouch = useRef(false);

  // 双击检测
  const lastClickTime = useRef(0);
  const clickCount = useRef(0);

  // 计算两点距离
  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  // 计算两点中心
  const getCenter = (touches: TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // 更新指针位置（用于照片选择）
    if (!isDragging.current) {
      setPointer({ x, y });
    }

    // 拖拽处理
    if (isDragging.current && lastMousePos.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      if (state === 'FORMED') {
        // FORMED 模式：左右拖拽控制旋转
        setRotationBoost(prev => {
          const newBoost = prev + dx * 0.01;
          return Math.max(-3, Math.min(newBoost, 3));
        });
      } else {
        // CHAOS 模式：拖拽平移
        setPanOffset(prev => ({
          x: prev.x + dx * 0.02,
          y: prev.y - dy * 0.02
        }));
      }
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [state, setPointer, setPanOffset, setRotationBoost]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) { // 左键
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // 鼠标松开
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      const wasDragging = isDragging.current;
      isDragging.current = false;

      // 检查是否是点击（非拖拽）
      if (dragStartPos.current && wasDragging) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        const distance = Math.hypot(dx, dy);

        // 如果移动距离很小，视为点击
        if (distance < 10) {
          const now = Date.now();

          // 双击检测 - 切换状态
          if (now - lastClickTime.current < 300) {
            clickCount.current++;
            if (clickCount.current >= 2) {
              setState(state === 'CHAOS' ? 'FORMED' : 'CHAOS');
              clickCount.current = 0;
            }
          } else {
            clickCount.current = 1;
            // 单击 - 触发选择
            setClickTrigger(now);
          }
          lastClickTime.current = now;
        }
      }

      // 旋转惯性衰减
      if (state === 'FORMED') {
        const decay = () => {
          setRotationBoost(prev => {
            const newBoost = prev * 0.95;
            if (Math.abs(newBoost) > 0.01) {
              requestAnimationFrame(decay);
            }
            return newBoost;
          });
        };
        decay();
      }
    }
  }, [state, setState, setClickTrigger, setRotationBoost]);

  // 滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    setZoomOffset(prev => {
      const delta = e.deltaY * 0.01;
      const next = prev + delta;
      return Math.max(-20, Math.min(next, 40));
    });
  }, [setZoomOffset]);

  // 触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指触摸
      const touch = e.touches[0];
      lastTouchCenter.current = { x: touch.clientX, y: touch.clientY };
      dragStartPos.current = { x: touch.clientX, y: touch.clientY };
      isDragging.current = true;
      isTwoFingerTouch.current = false;
    } else if (e.touches.length === 2) {
      // 双指触摸
      isTwoFingerTouch.current = true;
      touchStartDistance.current = getDistance(e.touches);
      lastTouchCenter.current = getCenter(e.touches);
    }
  }, []);

  // 触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1 && !isTwoFingerTouch.current) {
      // 单指滑动
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;

      // 更新指针位置
      setPointer({ x, y });

      if (lastTouchCenter.current && isDragging.current) {
        const dx = touch.clientX - lastTouchCenter.current.x;
        const dy = touch.clientY - lastTouchCenter.current.y;

        if (state === 'FORMED') {
          // FORMED: 水平滑动旋转
          setRotationBoost(prev => {
            const newBoost = prev + dx * 0.015;
            return Math.max(-3, Math.min(newBoost, 3));
          });
        } else {
          // CHAOS: 滑动平移
          setPanOffset(prev => ({
            x: prev.x + dx * 0.015,
            y: prev.y - dy * 0.015
          }));
        }
      }

      lastTouchCenter.current = { x: touch.clientX, y: touch.clientY };

    } else if (e.touches.length === 2) {
      // 双指缩放和平移
      const currentDistance = getDistance(e.touches);
      const currentCenter = getCenter(e.touches);

      // 缩放
      if (touchStartDistance.current !== null) {
        const scale = currentDistance / touchStartDistance.current;
        const deltaZoom = (1 - scale) * 20;

        setZoomOffset(prev => {
          const next = prev + deltaZoom * 0.1;
          return Math.max(-20, Math.min(next, 40));
        });

        touchStartDistance.current = currentDistance;
      }

      // 双指平移
      if (lastTouchCenter.current) {
        const dx = currentCenter.x - lastTouchCenter.current.x;
        const dy = currentCenter.y - lastTouchCenter.current.y;

        setPanOffset(prev => ({
          x: prev.x + dx * 0.02,
          y: prev.y - dy * 0.02
        }));
      }

      lastTouchCenter.current = currentCenter;
    }
  }, [state, setPointer, setPanOffset, setZoomOffset, setRotationBoost]);

  // 触摸结束
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) {
      // 检查是否是点击
      if (dragStartPos.current && isDragging.current && !isTwoFingerTouch.current) {
        const lastTouch = e.changedTouches[0];
        const dx = lastTouch.clientX - dragStartPos.current.x;
        const dy = lastTouch.clientY - dragStartPos.current.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 20) {
          const now = Date.now();

          // 双击检测
          if (now - lastClickTime.current < 300) {
            clickCount.current++;
            if (clickCount.current >= 2) {
              setState(state === 'CHAOS' ? 'FORMED' : 'CHAOS');
              clickCount.current = 0;
            }
          } else {
            clickCount.current = 1;
            setClickTrigger(now);
          }
          lastClickTime.current = now;
        }
      }

      isDragging.current = false;
      isTwoFingerTouch.current = false;
      touchStartDistance.current = null;
      lastTouchCenter.current = null;
      dragStartPos.current = null;

      // 旋转惯性
      if (state === 'FORMED') {
        const decay = () => {
          setRotationBoost(prev => {
            const newBoost = prev * 0.92;
            if (Math.abs(newBoost) > 0.01) {
              requestAnimationFrame(decay);
            }
            return newBoost;
          });
        };
        decay();
      }
    } else if (e.touches.length === 1) {
      // 从双指变单指
      isTwoFingerTouch.current = false;
      touchStartDistance.current = null;
      const touch = e.touches[0];
      lastTouchCenter.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [state, setState, setClickTrigger, setRotationBoost]);

  // 鼠标离开
  const handleMouseLeave = useCallback(() => {
    setPointer(null);
    setHoverProgress(0);
    isDragging.current = false;
  }, [setPointer, setHoverProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 鼠标事件
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 触摸事件
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleMouseLeave, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[5] cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    />
  );
};

export default MouseTouchInput;

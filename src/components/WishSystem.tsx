import React, { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeContext, TreeContextType } from '../types';

// 许愿弹窗组件
export const WishModal: React.FC = () => {
  const { showWishModal, setShowWishModal, addWish, setWishEffectTrigger } = useContext(TreeContext) as TreeContextType;
  const [wishText, setWishText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showWishModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [showWishModal]);

  const handleSubmit = () => {
    if (!wishText.trim()) return;

    setIsSubmitting(true);

    // 延迟关闭，显示提交动画
    setTimeout(() => {
      addWish(wishText.trim());
      setWishEffectTrigger(Date.now());
      setWishText('');
      setIsSubmitting(false);
      setShowWishModal(false);
    }, 800);
  };

  const handleClose = () => {
    setWishText('');
    setShowWishModal(false);
  };

  return (
    <AnimatePresence>
      {showWishModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* 星光粒子背景 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-200 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* 弹窗内容 */}
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 shadow-[0_0_60px_rgba(255,215,0,0.3)] border border-yellow-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部星星装饰 */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="text-5xl"
              >
                ⭐
              </motion.div>
            </div>

            {/* 标题 */}
            <h2 className="text-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-2 mt-4 cinzel">
              Make a Wish
            </h2>
            <p className="text-center text-yellow-100/60 text-sm mb-6">
              写下你的圣诞愿望，让星星帮你实现 ✨
            </p>

            {/* 输入框 */}
            <div className="relative mb-6">
              <textarea
                ref={inputRef}
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="许下你的愿望..."
                maxLength={200}
                className="w-full h-32 bg-black/30 border border-yellow-500/30 rounded-xl p-4 text-white placeholder-yellow-100/40 resize-none focus:outline-none focus:border-yellow-400/60 focus:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all"
              />
              <span className="absolute bottom-2 right-3 text-yellow-100/40 text-xs">
                {wishText.length}/200
              </span>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!wishText.trim() || isSubmitting}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  wishText.trim() && !isSubmitting
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    许愿中...
                  </motion.span>
                ) : (
                  '🌟 许愿'
                )}
              </motion.button>
            </div>

            {/* 底部提示 */}
            <p className="text-center text-yellow-100/30 text-xs mt-4">
              愿望将随流星飞向天空 🌠
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 流星雨特效组件
export const ShootingStarsEffect: React.FC = () => {
  const { wishEffectTrigger } = useContext(TreeContext) as TreeContextType;
  const [stars, setStars] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (wishEffectTrigger > 0) {
      // 生成流星
      const newStars = Array.from({ length: 15 }, (_, i) => ({
        id: wishEffectTrigger + i,
        x: Math.random() * 100,
        delay: Math.random() * 1.5
      }));
      setStars(newStars);

      // 清除流星
      const timer = setTimeout(() => {
        setStars([]);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [wishEffectTrigger]);

  return (
    <div className="fixed inset-0 z-[140] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{
              x: `${star.x}vw`,
              y: '-10vh',
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: `${star.x - 30}vw`,
              y: '110vh',
              opacity: [1, 1, 0],
              scale: [1, 0.5]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5 + Math.random() * 0.5,
              delay: star.delay,
              ease: "easeIn"
            }}
            className="absolute"
          >
            {/* 流星头部 */}
            <div className="relative">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff,0_0_20px_#ffd700,0_0_30px_#ffd700]" />
              {/* 流星尾巴 */}
              <div
                className="absolute top-0 left-0 w-1 bg-gradient-to-b from-white via-yellow-200 to-transparent"
                style={{
                  height: '80px',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top left',
                  opacity: 0.8
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 中心爆发光效 */}
      <AnimatePresence>
        {wishEffectTrigger > 0 && stars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 2, 3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-radial from-yellow-200/50 via-yellow-400/20 to-transparent"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.1) 40%, transparent 70%)'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WishModal;

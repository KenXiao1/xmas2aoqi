import React, { useState, Suspense, useContext, useEffect, useRef, useCallback } from 'react';
import { TreeContextType, AppState, TreeContext, PointerCoords, InputMode, WishData } from './types';
import Experience from './components/Experience';
import GestureInput from './components/GestureInput';
import MouseTouchInput from './components/MouseTouchInput';
import TechEffects from './components/TechEffects';
import { WishModal, ShootingStarsEffect } from './components/WishSystem';
import { AnimatePresence, motion } from 'framer-motion';


// --- 梦幻光标组件 ---
const DreamyCursor: React.FC<{ pointer: PointerCoords | null, progress: number }> = ({ pointer, progress }) => {
    if (!pointer) return null;
    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[200]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: 1,
                scale: 1,
                left: `${pointer.x * 100}%`,
                top: `${pointer.y * 100}%`
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{ x: "-50%", y: "-50%" }}
        >
            {/* 核心光点 */}
            <div className={`rounded-full transition-all duration-300 ${progress > 0.8 ? 'w-4 h-4 bg-emerald-400 shadow-[0_0_20px_#34d399]' : 'w-2 h-2 bg-amber-200 shadow-[0_0_15px_#fcd34d]'}`} />

            {/* 进度光环 - 魔法符文风格 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20 animate-spin-slow"></div>

            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 -rotate-90 overflow-visible">
                <defs>
                    <linearGradient id="magicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                {/* 倒计时圆环 */}
                <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="url(#magicGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 * (1 - progress)}
                    filter="url(#glow)"
                    className="transition-[stroke-dashoffset] duration-75 ease-linear"
                />
            </svg>

            {/* 粒子拖尾装饰 (CSS 动画) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 rounded-full blur-xl animate-pulse"></div>
        </motion.div>
    );
};

// --- 照片弹窗 ---
const PhotoModal: React.FC<{ url: string | null, onClose: () => void }> = ({ url, onClose }) => {
    if (!url) return null;
    return (
        <motion.div
            id="photo-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50, rotate: -5 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 100 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative max-w-4xl max-h-full bg-white p-3 rounded shadow-[0_0_50px_rgba(255,215,0,0.3)] border-8 border-white"
                onClick={(e) => e.stopPropagation()}
            >
                <img src={url} alt="Memory" className="max-h-[80vh] object-contain rounded shadow-inner" />
                <div className="absolute -bottom-12 w-full text-center text-red-300/70 cinzel text-sm">
                    ❄️ Precious Moment ❄️
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- 输入模式切换按钮 ---
const InputModeToggle: React.FC = () => {
    const { inputMode, setInputMode, webcamEnabled, setWebcamEnabled } = useContext(TreeContext) as TreeContextType;

    const toggleMode = () => {
        if (inputMode === 'mouse') {
            setInputMode('gesture');
            setWebcamEnabled(true);
        } else {
            setInputMode('mouse');
            setWebcamEnabled(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMode}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all"
        >
            {inputMode === 'gesture' ? (
                <>
                    <span className="text-lg">✋</span>
                    <span className="text-sm">手势控制</span>
                </>
            ) : (
                <>
                    <span className="text-lg">🖱️</span>
                    <span className="text-sm">鼠标/触屏</span>
                </>
            )}
        </motion.button>
    );
};

// --- 操作提示 ---
const ControlsHint: React.FC = () => {
    const { inputMode, state } = useContext(TreeContext) as TreeContextType;
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 8000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-none text-center"
        >
            <div className="inline-block px-6 py-3 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
                {inputMode === 'mouse' ? (
                    <div className="text-white/70 text-sm space-y-1">
                        <p>🖱️ <span className="text-white/90">拖拽</span> 旋转/平移 · <span className="text-white/90">滚轮</span> 缩放</p>
                        <p>👆 <span className="text-white/90">双击</span> 切换模式 · <span className="text-white/90">点击星星</span> 许愿</p>
                    </div>
                ) : (
                    <div className="text-white/70 text-sm space-y-1">
                        <p>✋ <span className="text-white/90">张开手掌</span> 旋转 · <span className="text-white/90">握拳</span> 聚合</p>
                        <p>☝️ <span className="text-white/90">单指悬停</span> 选择照片 · <span className="text-white/90">✌️两指</span> 平移</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const AppContent: React.FC = () => {
    const { state, setState, webcamEnabled, setWebcamEnabled, inputMode, pointer, hoverProgress, selectedPhotoUrl, setSelectedPhotoUrl, clickTrigger } = useContext(TreeContext) as TreeContextType;

    useEffect(() => {
        if (selectedPhotoUrl && pointer) {
            const x = pointer.x * window.innerWidth;
            const y = pointer.y * window.innerHeight;
            const element = document.elementFromPoint(x, y);
            if (element) {
                const isImage = element.tagName === 'IMG';
                const isBackdrop = element.id === 'photo-modal-backdrop';
                if (isBackdrop || isImage) setSelectedPhotoUrl(null);
            }
        }
    }, [clickTrigger]);

    return (
        <main className="relative w-full h-screen bg-black text-white overflow-hidden">
            {/* 摄像头背景层 (z-0) - 仅在手势模式下显示 */}
            {webcamEnabled && inputMode === 'gesture' && <GestureInput />}

            {/* 鼠标/触屏输入层 (z-5) */}
            {inputMode === 'mouse' && <MouseTouchInput />}

            {/* 3D 场景层 (z-10) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-red-400 cinzel animate-pulse text-2xl">🎄 Loading Christmas Magic... ❄️</div>}>
                    <Experience />
                </Suspense>
            </div>

            {/* 科技感特效层 (z-20) */}
            {webcamEnabled && inputMode === 'gesture' && <TechEffects />}

            {/* UI 层 (z-30) */}
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4">
                {/* 顶部控制区 */}
                <header className="flex justify-between items-start">
                    <InputModeToggle />
                    <div className="text-right">
                        <h1 className="text-lg font-light text-white/60 cinzel tracking-wider">
                            Christmas Memories
                        </h1>
                        <p className="text-xs text-white/40">
                            {state === 'FORMED' ? '🎄 Timeline Mode' : '✨ Explore Mode'}
                        </p>
                    </div>
                </header>

                {/* 中间提示区 */}
                <div className="flex-1 flex items-end justify-center pb-20">
                    <ControlsHint />
                </div>

                {/* 底部 */}
                <footer className="flex justify-between items-end">
                    <div className="text-white/40 text-xs">
                        ⭐ 点击树顶星星许愿
                    </div>
                    <a
                        href="https://kenxiao.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pointer-events-auto text-white/50 hover:text-white/80 transition-colors text-sm cinzel tracking-wide"
                    >
                        by KenXiao
                    </a>
                </footer>
            </div>

            {/* 光标层 (z-200) - 仅在手势模式下显示 */}
            {inputMode === 'gesture' && <DreamyCursor pointer={pointer} progress={hoverProgress} />}

            {/* 弹窗层 (z-100) */}
            <AnimatePresence>
                {selectedPhotoUrl && <PhotoModal url={selectedPhotoUrl} onClose={() => setSelectedPhotoUrl(null)} />}
            </AnimatePresence>

            {/* 许愿系统 (z-150) */}
            <WishModal />
            <ShootingStarsEffect />
        </main>
    );
};

const App: React.FC = () => {
    const [state, setState] = useState<AppState>('CHAOS');
    const [rotationSpeed, setRotationSpeed] = useState<number>(0.3);
    const [rotationBoost, setRotationBoost] = useState<number>(0);
    const [webcamEnabled, setWebcamEnabled] = useState<boolean>(false); // 默认关闭手势
    const [inputMode, setInputMode] = useState<InputMode>('mouse'); // 默认鼠标模式
    const [pointer, setPointer] = useState<PointerCoords | null>(null);
    const [hoverProgress, setHoverProgress] = useState<number>(0);
    const [clickTrigger, setClickTrigger] = useState<number>(0);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
    const [panOffset, setPanOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [zoomOffset, setZoomOffset] = useState<number>(0);

    // 许愿系统状态
    const [showWishModal, setShowWishModal] = useState<boolean>(false);
    const [wishes, setWishes] = useState<WishData[]>(() => {
        // 从 localStorage 读取
        const saved = localStorage.getItem('christmas-wishes');
        return saved ? JSON.parse(saved) : [];
    });
    const [wishEffectTrigger, setWishEffectTrigger] = useState<number>(0);

    // 添加许愿
    const addWish = useCallback((content: string) => {
        const newWish: WishData = {
            id: Date.now().toString(),
            content,
            timestamp: Date.now()
        };
        setWishes(prev => {
            const updated = [...prev, newWish];
            localStorage.setItem('christmas-wishes', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <TreeContext.Provider value={{
            state, setState,
            rotationSpeed, setRotationSpeed,
            webcamEnabled, setWebcamEnabled,
            inputMode, setInputMode,
            pointer, setPointer,
            hoverProgress, setHoverProgress,
            clickTrigger, setClickTrigger,
            selectedPhotoUrl, setSelectedPhotoUrl,
            panOffset, setPanOffset,
            rotationBoost, setRotationBoost,
            zoomOffset, setZoomOffset,
            showWishModal, setShowWishModal,
            wishes, addWish,
            wishEffectTrigger, setWishEffectTrigger
        }}>
            <AppContent />
        </TreeContext.Provider>
    );
};

export default App;

import { createContext, Dispatch, SetStateAction } from 'react';

export type AppState = 'CHAOS' | 'FORMED';
export type InputMode = 'gesture' | 'mouse';

// 指针坐标接口 (归一化 0-1)
export interface PointerCoords {
  x: number;
  y: number;
}

// 许愿数据接口
export interface WishData {
  id: string;
  content: string;
  timestamp: number;
}

export interface TreeContextType {
  state: AppState;
  setState: (state: AppState) => void;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;
  webcamEnabled: boolean;
  setWebcamEnabled: (enabled: boolean) => void;

  // --- 输入模式 ---
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;

  // --- 交互状态 ---
  pointer: PointerCoords | null;   // 指针位置
  setPointer: (coords: PointerCoords | null) => void;

  hoverProgress: number;           // 悬停进度 0.0 ~ 1.0 (用于 UI 圈圈动画)
  setHoverProgress: (progress: number) => void;

  clickTrigger: number;            // 点击信号 (每次点击更新为当前时间戳)
  setClickTrigger: (time: number) => void;

  selectedPhotoUrl: string | null; // 当前选中的照片
  setSelectedPhotoUrl: (url: string | null) => void;

  // 新增：五指平移偏移量
  panOffset: { x: number, y: number };
  setPanOffset: Dispatch<SetStateAction<{ x: number, y: number }>>;

  // 新增：旋转加速度（FORMED状态下的额外速度）
  rotationBoost: number;
  setRotationBoost: Dispatch<SetStateAction<number>>;

  // 新增：缩放偏移量 (双手手势控制)
  zoomOffset: number;
  setZoomOffset: Dispatch<SetStateAction<number>>;

  // --- 许愿系统 ---
  showWishModal: boolean;
  setShowWishModal: (show: boolean) => void;
  wishes: WishData[];
  addWish: (content: string) => void;
  wishEffectTrigger: number;
  setWishEffectTrigger: (trigger: number) => void;
}

export interface ParticleData {
  id: string;
  chaosPos: [number, number, number];
  treePos: [number, number, number];
  chaosRot: [number, number, number];
  treeRot: [number, number, number];
  scale: number;
  color: string;
  image?: string;
  year?: number; // 新增：照片年份
  month?: string;
  type: 'LEAF' | 'ORNAMENT' | 'PHOTO';
}

export const TreeContext = createContext<TreeContextType>({} as TreeContextType);
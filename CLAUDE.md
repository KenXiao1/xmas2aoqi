# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Christmas Memories Tree - A 3D interactive Christmas tree photo gallery with AI gesture recognition. Users can explore memories scattered in space (CHAOS mode) or arranged as a tree timeline (FORMED mode) using hand gestures captured via webcam.

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server on localhost:3000
npm run build   # Production build
npm run preview # Preview production build
```

## Architecture

### State Management
Global state is managed via `TreeContext` (src/types.ts) providing:
- `state`: Current view mode ('CHAOS' | 'FORMED')
- Gesture-derived values: `pointer`, `hoverProgress`, `clickTrigger`, `panOffset`, `zoomOffset`, `rotationBoost`
- Photo selection: `selectedPhotoUrl`

### Component Hierarchy
```
App.tsx                    # Context provider + UI layers (cursor, modals, header)
├── GestureInput.tsx       # MediaPipe hand tracking, gesture classification
├── Experience.tsx         # R3F Canvas, lighting, post-processing, camera rig
│   ├── TreeSystem.tsx     # Photo spheres + particle system with CHAOS/FORMED positions
│   └── CrystalOrnaments.tsx # Decorative 3D elements
└── TechEffects.tsx        # Overlay visual effects (scanning lines, etc.)
```

### Key Patterns
- **Dual position system**: Each particle has `chaosPos/treePos` and `chaosRot/treeRot` - interpolated based on state
- **Gesture → State flow**: GestureInput detects hands → updates context values → components react
- **Hover-to-click**: 1-second hover triggers click via `clickTrigger` timestamp

### Gesture Controls (GestureInput.tsx)
| Gesture | Action |
|---------|--------|
| Open palm | Pointer control (hover 1s = click) |
| Fist | Rotate scene |
| Single finger (index) | Zoom (hand distance) |
| Two open palms | Pan view |
| Two pinch gestures | Zoom |
| Two fists | Toggle CHAOS/FORMED |

## Photo System

Photos placed in `public/photos/` with naming format `YYYY_MM_N.jpg` (e.g., `2024_12_1.jpg`) are auto-discovered and arranged chronologically in TREE mode.

## Tech Stack
- React 18 + TypeScript + Vite
- Three.js via @react-three/fiber and @react-three/drei
- @react-three/postprocessing for Bloom/Vignette effects
- @mediapipe/tasks-vision for hand gesture recognition
- Tailwind CSS 4 + framer-motion for UI

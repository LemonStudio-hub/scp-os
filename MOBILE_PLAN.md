# Mobile GUI Plan — iOS Style + SCP Foundation Theme

## Design Philosophy

**iOS-Inspired, SCP-Themed, Full Feature Parity with PC**

The mobile experience will feel like a native iOS app running on a jailbroken Foundation terminal:
- **Full-screen panels** instead of floating windows (iOS navigation paradigm)
- **Bottom sheet modals** for secondary actions (iOS sheet presentation)
- **iOS-style dock** at the bottom with frosted glass effect
- **Spring-based transitions** matching iOS animation curves
- **Swipe gestures**: swipe down to dismiss, swipe between tools
- **Safe area insets** for iPhone notch / Dynamic Island / home indicator
- **Haptic feedback** via `navigator.vibrate()` on supported devices

**Visual design remains unchanged** — the flat, modern SCP theme from the desktop redesign is preserved. Only the interaction model and layout adapt to iOS conventions.

---

## Task Breakdown

### Phase M1: Mobile Infrastructure

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M1.1 | **Mobile Detection Consolidation** | Create single `useMobile()` composable replacing all duplicated `isMobile` checks | One source of truth, reactive to resize |
| M1.2 | **Safe Area Support** | Add `viewport-fit=cover` to index.html, `env(safe-area-inset-*)` to all fixed elements | No content under notch/home bar |
| M1.3 | **Mobile Composable** | `useMobile.ts` with screen size breakpoints, orientation detection | Exports `isMobile`, `isTablet`, `isDesktop`, `safeArea` |

### Phase M2: iOS-Style Mobile Components

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M2.1 | **MobileWindow** | Full-screen panel with iOS-style slide transition, top nav bar with back/close button, swipe-down-to-dismiss gesture | Opens/closes with spring animation |
| M2.2 | **MobileNavBar** | iOS-style top navigation bar with title, back button, action buttons, blur effect | Matches iOS UINavigationBar aesthetic |
| M2.3 | **MobileBottomSheet** | Draggable bottom sheet for context menus, file operations, settings | Drag up to expand, swipe down to dismiss |
| M2.4 | **MobileDock** | iOS home screen-style dock with frosted glass, icon grid, label on long-press | Floating above safe area, tap to launch |
| M2.5 | **MobileToolbar** | iOS-style inline toolbar for text editing (bold, italic, etc.) and terminal keys | Appears above virtual keyboard |

### Phase M3: Mobile File Manager

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M3.1 | **Mobile File List** | iOS Settings-style list: icon + name + chevron, full-width rows, swipe actions | Swipe left for delete, tap to navigate |
| M3.2 | **Mobile File Grid** | iOS Photos-style square grid with rounded corners, 3-column on phone, 4 on tablet | Tap to select, double-tap to open |
| M3.3 | **Mobile File Actions** | Bottom sheet for file operations (rename, delete, share, info) | Sheet slides up with options |
| M3.4 | **Mobile Breadcrumbs** | iOS-style navigation title in NavBar (shows current path, tap for folder picker) | Tapping shows folder list in bottom sheet |

### Phase M4: Mobile Text Editor

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M4.1 | **Mobile Editor** | Full-screen textarea with iOS-style NavBar (title = filename, Save button) | Keyboard doesn't cover text area |
| M4.2 | **Mobile Keyboard Toolbar** | iOS-style input accessory: Done, cursor left/right, tab size toggle | Sits above system keyboard |
| M4.3 | **Mobile Tab Bar** | iOS segmented control for switching between open files | Horizontal scrollable segmented pill |
| M4.4 | **Dirty Indicator** | Unsaved dot in NavBar title, confirmation alert on close | Prevents accidental data loss |

### Phase M5: Mobile Terminal Panel

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M5.1 | **Mobile Terminal** | Full-screen terminal with iOS-style NavBar (Clear, Restart buttons) | xterm fits above virtual keyboard |
| M5.2 | **Mobile Virtual Keyboard** | Redesigned to match iOS aesthetic: rounded keys, haptic feedback, dismiss button | Replaces current flat keyboard |
| M5.3 | **Keyboard Toggle** | Show/hide virtual keyboard toggle in NavBar | Smooth transition, no layout jump |

### Phase M6: iOS Transitions & Gestures

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M6.1 | **Spring Transitions** | iOS-style spring curves for all open/close/dismiss animations (`cubic-bezier(0.32, 0.72, 0, 1)`) | All transitions feel "iOS-native" |
| M6.2 | **Swipe to Dismiss** | Swipe down from top of mobile window to close (like iOS cards) | Gesture triggers close animation |
| M6.3 | **Haptic Feedback** | `navigator.vibrate(10)` on button tap, `vibrate(20)` on window open/close (where supported) | Subtle tactile feedback |
| M6.4 | **Viewport Resize Handling** | Proper handling of iOS virtual keyboard opening/closing (viewport height changes) | No content jump or blank space |

### Phase M7: App.vue Mobile Integration

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M7.1 | **Mobile Layout** | Conditional rendering: PC shows floating windows + dock, mobile shows full-screen panels + iOS dock | Layout adapts at 768px breakpoint |
| M7.2 | **Mobile Window Router** | Simple window router that shows one tool at a time in fullscreen, with slide transitions | Only active tool visible on mobile |
| M7.3 | **Gesture System** | Replace App.vue raw touch handlers with proper gesture delegation (no conflicts) | Swipe, tap, long-press all work |

### Phase M8: Testing & Polish

| # | Task | Details | Acceptance |
|---|------|---------|------------|
| M8.1 | **Type Check** | Zero TypeScript errors | `pnpm run lint` passes |
| M8.2 | **Test Suite** | All existing tests pass, new mobile component tests added | 199+ tests passing |
| M8.3 | **Mobile Browser Testing** | Test on iOS Safari and Chrome Android | No layout issues, no overlaps |
| M8.4 | **Performance** | Mobile animations at 60fps, no jank on open/close | `requestAnimationFrame` used |

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Mobile layout** | Full-screen panels (not floating windows) | iOS convention, better UX on small screens |
| **Animations** | CSS `cubic-bezier(0.32, 0.72, 0, 1)` (iOS spring curve) | Native iOS feel without JS animation library |
| **Gesture library** | Native touch events (no Hammer.js dependency for GUI) | Lighter, more control, consistent with existing code |
| **Safe area** | CSS `env(safe-area-inset-*)` + `viewport-fit=cover` | Standard iOS approach, no JS needed |
| **Haptic** | `navigator.vibrate()` with graceful degradation | Works on Android, noop on iOS (acceptable) |
| **Keyboard handling** | CSS `dvh` units + `visualViewport` API | Proper iOS Safari keyboard height detection |

---

## File Plan

```
src/gui/
├── composables/
│   ├── useMobile.ts              # NEW: Mobile detection, safe area, orientation
│   └── useSwipeGesture.ts        # NEW: Swipe-to-dismiss, swipe navigation
├── components/
│   ├── MobileWindow.vue          # NEW: iOS-style full-screen panel
│   ├── MobileNavBar.vue          # NEW: iOS top navigation bar
│   ├── MobileBottomSheet.vue     # NEW: Draggable bottom sheet
│   └── MobileDock.vue            # NEW: iOS-style app dock
├── tools/
│   ├── filemanager/
│   │   └── MobileFileManager.vue # NEW: Mobile-optimized file manager
│   ├── editor/
│   │   └── MobileEditor.vue      # NEW: Mobile-optimized text editor
│   └── terminal/
│       └── MobileTerminal.vue    # NEW: Mobile-optimized terminal
└── mobile/
    └── MobileApp.vue             # NEW: Mobile layout router
```

---

## Quality Gates

1. **TypeScript strict mode** — zero `any` types
2. **No regressions** — existing 199 tests continue to pass
3. **Visual consistency** — same SCP flat theme, only layout changes
4. **Performance** — animations use GPU-accelerated `transform` + `opacity` only
5. **Accessibility** — proper `aria-*` attributes on mobile components
6. **Graceful degradation** — works on browsers without `navigator.vibrate`, `visualViewport`, etc.

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Track {
  title: string;
  artist: string;
  duration: number;
  elapsed: number;
  lyrics: string[];
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  time?: string;
  repeat?: string;
}

const TRACKS: Track[] = [
  {
    title: 'Paper Sky',
    artist: 'Lumen Coast - Summer Flows',
    duration: 256,
    elapsed: 179,
    lyrics: [
      'and send them through the sky',
      'to find you by the sea',
      'every wing a little song',
      'that carries us along',
    ],
  },
  {
    title: 'Midnight Harbor',
    artist: 'Lumen Coast - Summer Flows',
    duration: 214,
    elapsed: 84,
    lyrics: [
      'lanterns reflect on quiet waves',
      'tracing the coastline after rain',
      'softly the tide pulls us home',
      'beneath the silver harbor glow',
    ],
  },
  {
    title: 'Glass Horizon',
    artist: 'Aetheris - Daylight Tapes',
    duration: 198,
    elapsed: 45,
    lyrics: [
      'morning breaks through frosted glass',
      'shadows dissolve as clouds drift past',
      'golden reflections fill the room',
      'awaking gently into bloom',
    ],
  },
];

const COMPANION_MODES = ['Resting', 'Waving', 'Sleeping', 'Vibing', 'Surprised'] as const;
const EXPANDED_MODES = [
  'Music',
  'Focus timer',
  'Water',
  'Shelf',
  'Clipboard',
  'To-do',
  'Widgets',
] as const;

const ROW_1_MODES = [
  'Resting',
  'Waving',
  'Sleeping',
  'Vibing',
  'Surprised',
  'Closed',
  'Music',
  'Lyrics',
  'Focus timer',
  'Notification',
  'Water',
  'Shelf',
  'Clipboard',
  'To-do',
];

const ROW_2_MODES = ['Widgets', 'Headphones', 'Charging', 'AI Usage'];

interface AIUsageModel {
  id: 'claude' | 'openai' | 'gemini';
  name: string;
  sessionPct: number;
  sessionColor: string;
  sessionReset: string;
  allModelsPct: number;
  allModelsColor: string;
  allModelsReset: string;
  dockOffsetY: number;
}

const AI_USAGE_MODELS: AIUsageModel[] = [
  {
    id: 'claude',
    name: 'Claude Usage',
    sessionPct: 73,
    sessionColor: '#E84D1C',
    sessionReset: 'Resets in 51 min',
    allModelsPct: 7,
    allModelsColor: '#22C55E',
    allModelsReset: 'Resets Thu 12:00 AM',
    dockOffsetY: 0,
  },
  {
    id: 'openai',
    name: 'ChatGPT Usage',
    sessionPct: 21,
    sessionColor: '#22C55E',
    sessionReset: 'Resets in 2 hr 14 min',
    allModelsPct: 18,
    allModelsColor: '#22C55E',
    allModelsReset: 'Resets Fri 12:00 AM',
    dockOffsetY: 66,
  },
  {
    id: 'gemini',
    name: 'Gemini Usage',
    sessionPct: 52,
    sessionColor: '#EAB308',
    sessionReset: 'Resets in 38 min',
    allModelsPct: 34,
    allModelsColor: '#22C55E',
    allModelsReset: 'Resets Thu 12:00 AM',
    dockOffsetY: 132,
  },
];

const HOURLY_WATER_BARS = [62, 46, 36, 36, 46, 46, 46];

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const WEEK_DOT_COLORS = ['#2B82D9', '', '', '#30D158', '#FF453A', '', '#FF9F0A'];

function formatLiveDate(d: Date): string {
  const dayName = SHORT_WEEKDAYS[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

function formatLiveClock(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getCurrentWeekDays(d: Date) {
  const currentDay = d.getDay(); // 0 (Sun) - 6 (Sat)
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + mondayOffset);
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return letters.map((letter, idx) => {
    const cellDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const isToday =
      cellDate.getDate() === d.getDate() &&
      cellDate.getMonth() === d.getMonth() &&
      cellDate.getFullYear() === d.getFullYear();
    return {
      day: letter,
      date: String(cellDate.getDate()),
      dot: isToday ? '#30D158' : WEEK_DOT_COLORS[idx],
      active: isToday,
    };
  });
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function AlbumArtSVG({ size = 50 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="rounded-[11px] shrink-0 shadow-md"
    >
      <rect width="64" height="64" rx="11" fill="#DCE6F7" />
      <line x1="0" y1="11" x2="64" y2="11" stroke="#B7C9EA" strokeWidth="1" />
      <line x1="0" y1="20" x2="64" y2="20" stroke="#B7C9EA" strokeWidth="1" />
      <line x1="0" y1="29" x2="64" y2="29" stroke="#B7C9EA" strokeWidth="1" />
      <line x1="0" y1="38" x2="64" y2="38" stroke="#B7C9EA" strokeWidth="1" />
      <line x1="0" y1="47" x2="64" y2="47" stroke="#B7C9EA" strokeWidth="1" />
      <line x1="0" y1="56" x2="64" y2="56" stroke="#B7C9EA" strokeWidth="1" />
      <circle
        cx="23"
        cy="37"
        r="18.5"
        stroke="#5A8DEE"
        strokeWidth="1.5"
        fill="rgba(255,255,255,0.22)"
      />
      <circle cx="22.5" cy="37.5" r="12.5" fill="#2A75E8" />
      <line x1="36" y1="0" x2="12" y2="64" stroke="#FFFFFF" strokeWidth="1.7" />
    </svg>
  );
}

function AIModelLogo({ id, size = 18 }: { id: AIUsageModel['id']; size?: number }) {
  if (id === 'claude') {
    // 12-ray starburst Claude logo
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="12"
            y1="3.4"
            x2="12"
            y2="9.1"
            stroke="#FFFFFF"
            strokeWidth="2.05"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 12 12)`}
          />
        ))}
      </svg>
    );
  }
  if (id === 'openai') {
    // Interlocking 6-petal ChatGPT knot logo
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x="9.1"
            y="4.2"
            width="5.8"
            height="9.6"
            rx="2.9"
            stroke="#FFFFFF"
            strokeWidth="1.55"
            transform={`rotate(${i * 60} 12 12)`}
          />
        ))}
      </svg>
    );
  }
  // 4-color Google Gemini sparkle star with top-left blue accent sparkle
  const clipId = `gemini-star-clip-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <clipPath id={clipId}>
          <path d="M12.5 2.2 C12.5 8.6 15.8 11.9 22.2 11.9 C15.8 11.9 12.5 15.2 12.5 21.6 C12.5 15.2 9.2 11.9 2.8 11.9 C9.2 11.9 12.5 8.6 12.5 2.2 Z" />
        </clipPath>
      </defs>
      {/* Top-left small blue/indigo sparkle */}
      <path
        d="M5.6 3.5 C5.6 5.2 6.5 6.1 8.2 6.1 C6.5 6.1 5.6 7.0 5.6 8.7 C5.6 7.0 4.7 6.1 3.0 6.1 C4.7 6.1 5.6 5.2 5.6 3.5 Z"
        fill="#60A5FA"
      />
      {/* Main 4-color Gemini star */}
      <g clipPath={`url(#${clipId})`}>
        {/* Base Google Blue fill covering the right body & right point */}
        <rect x="2" y="2" width="21" height="20" fill="#3B82F6" />
        {/* Top point Red facet */}
        <polygon points="12.5,1.5 5.5,11.9 12.5,11.9 15.6,7.2" fill="#EA4335" />
        {/* Bottom point Green facet */}
        <polygon points="12.5,22.2 6.2,11.9 12.5,11.9 15.6,16.6" fill="#10B981" />
        {/* Left point Yellow facet */}
        <polygon points="2.2,11.9 10.6,7.6 11.4,11.9 10.6,16.2" fill="#FBBC04" />
      </g>
    </svg>
  );
}

export default function App() {
  const [scale, setScale] = useState(0.5);
  const [now, setNow] = useState<Date>(() => new Date());
  const [mode, setMode] = useState<string>('Music');
  const [displayMode, setDisplayMode] = useState<string>('Music');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(TRACKS[0].elapsed);
  const [waterGlasses, setWaterGlasses] = useState<number>(5);
  const [focusSeconds, setFocusSeconds] = useState<number>(24 * 60 + 18);
  const [focusRunning, setFocusRunning] = useState<boolean>(true);

  const [todoSubMode, setTodoSubMode] = useState<'list' | 'add' | 'edit'>('list');
  const [todoCompact, setTodoCompact] = useState<boolean>(false);
  const [todoDraftTitle, setTodoDraftTitle] = useState<string>('');
  const [todoDraftTime, setTodoDraftTime] = useState<string>('');
  const [todoDraftRepeat, setTodoDraftRepeat] = useState<string>('Daily');
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 'todo-1', text: 'Revise the report', done: true, time: '09:30' },
    { id: 'todo-2', text: 'Reply to Dina', done: true, time: '11:00' },
    { id: 'todo-3', text: 'Prepare release notes', done: false, time: '14:00 - 15:30', repeat: 'Daily' },
    { id: 'todo-4', text: 'Review design tokens', done: false, time: '16:30' },
  ]);

  const [shelfStatus, setShelfStatus] = useState<{ title: string; sub: string }>({
    title: 'Drop files here',
    sub: 'Drag out anytime · click to open',
  });

  // Right-edge AI Usage Dock state: shown when cursor hovers near the dock gauges (or pinned by click)
  const [hoveredUsageModelId, setHoveredUsageModelId] = useState<AIUsageModel['id'] | null>(null);
  const [pinnedUsageModelId, setPinnedUsageModelId] = useState<AIUsageModel['id'] | null>(null);
  const activeUsageModelId = hoveredUsageModelId ?? pinnedUsageModelId;
  const sideDockBodyRef = useRef<HTMLDivElement>(null);
  const usagePopoverRef = useRef<HTMLDivElement>(null);
  const usageGaugeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [caption, setCaption] = useState<string>(
    'Page 1/7 · Music Player — Use Left/Right Arrow Keys (← / →) to cycle smoothly through all 7 expanded widgets'
  );

  // Morph & animation states
  const [morphHidden, setMorphHidden] = useState<boolean>(false);
  const [persistentHeaderHidden, setPersistentHeaderHidden] = useState<boolean>(false);
  const [slideX, setSlideX] = useState<string>('0px');
  const [slideY, setSlideY] = useState<string>('-4px');
  const [chargingPct, setChargingPct] = useState<number>(70);
  const [widgetBatteryPct, setWidgetBatteryPct] = useState<number>(82);
  const [chargeAnimKey, setChargeAnimKey] = useState<number>(0);

  // Companion tracking states
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const notchBodyRef = useRef<HTMLDivElement>(null);
  const companionStageRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const todoDraftInputRef = useRef<HTMLInputElement>(null);
  const todoListScrollRef = useRef<HTMLDivElement>(null);
  const [todoScrollMetrics, setTodoScrollMetrics] = useState<{
    thumbHeightPct: number;
    thumbTopPct: number;
  }>({ thumbHeightPct: 65, thumbTopPct: 0 });

  const autoSleepingRef = useRef<boolean>(false);
  const proximityWavingRef = useRef<boolean>(false);
  const modeRef = useRef<string>(mode);
  modeRef.current = mode;

  const morphSwapTimerRef = useRef<number | null>(null);
  const morphRevealTimerRef = useRef<number | null>(null);
  const inactivitySleepTimerRef = useRef<number | null>(null);
  const trackingReleaseTimerRef = useRef<number | null>(null);
  const proximityWaveResetTimerRef = useRef<number | null>(null);
  const lastAutoWaveTimeRef = useRef<number>(0);

  // Fit laptop frame inside viewport
  useEffect(() => {
    function fitDisplay() {
      const k = Math.min((window.innerWidth * 0.96) / 1964, (window.innerHeight - 190) / 1124, 1);
      setScale(Math.max(0.2, k));
    }
    fitDisplay();
    window.addEventListener('resize', fitDisplay);
    return () => window.removeEventListener('resize', fitDisplay);
  }, []);

  // Percentage counter animation helper
  const runPercentageCounter = useCallback((target: number, setter: (val: number) => void, duration = 880) => {
    const startTime = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setter(Math.round(target * eased));
      if (progress >= 1) window.clearInterval(timer);
    }, 16);
  }, []);

  const resetInactivitySleepTimer = useCallback((activeMode: string, switchFn: (m: string, auto?: boolean) => void) => {
    if (inactivitySleepTimerRef.current) window.clearTimeout(inactivitySleepTimerRef.current);
    if (activeMode === 'Resting') {
      inactivitySleepTimerRef.current = window.setTimeout(() => {
        if (modeRef.current === 'Resting') {
          autoSleepingRef.current = true;
          switchFn('Sleeping', true);
          setCaption(
            'Auto-Sleep (∪ ∪ zZ) · Companion fell asleep after 14s of inactivity — move mouse to wake!'
          );
        }
      }, 14000);
    }
  }, []);

  const switchMode = useCallback(
    (newMode: string, isAutoTrigger = false, explicitDirection: number | null = null) => {
      const prevMode = modeRef.current;
      const changed = prevMode !== newMode;
      const isCompanionMorph =
        (COMPANION_MODES as readonly string[]).includes(prevMode) &&
        (COMPANION_MODES as readonly string[]).includes(newMode);
      const isSameExpandedSize =
        (EXPANDED_MODES as readonly string[]).includes(prevMode) &&
        (EXPANDED_MODES as readonly string[]).includes(newMode);

      const isMusicToLyrics =
        (prevMode === 'Music' && newMode === 'Lyrics') ||
        (prevMode === 'Lyrics' && newMode === 'Music');

      let slideDir = explicitDirection;
      if (slideDir === null && isSameExpandedSize && changed) {
        const prevIdx = (EXPANDED_MODES as readonly string[]).indexOf(prevMode);
        const nextIdx = (EXPANDED_MODES as readonly string[]).indexOf(newMode);
        slideDir = nextIdx > prevIdx ? 1 : -1;
      }

      if (!isAutoTrigger) {
        autoSleepingRef.current = false;
        proximityWavingRef.current = false;
      }

      setMode(newMode);
      modeRef.current = newMode;

      const pageIdx = (EXPANDED_MODES as readonly string[]).indexOf(newMode);
      const pagePrefix = pageIdx !== -1 ? `Page ${pageIdx + 1}/${EXPANDED_MODES.length} · ` : '';
      const captions: Record<string, string> = {
        Resting:
          'Resting AI · Watch autonomous saccades, double-blinks & 3D head-tilt, or move cursor to track',
        Waving: 'Waving (^ ^ 👋) · Friendly greeting triggered! Click notch or wait to cycle',
        Sleeping:
          'Sleeping (∪ ∪ zZ) · Peaceful nap mode · Move mouse if auto-sleeping to wake up',
        Vibing: 'Vibing (^ ^ 🎵) · Bouncing to the background music beat',
        Surprised: 'Surprised (O O !) · Wide-eyed alert expression',
        Lyrics:
          'Lyrics Split-View (138px height) · Synchronized live lyrics with ocean-blue ambient bottom glow',
        Charging:
          'Charging Animation · Green ring sweeps 0% → 70% with pulsing energy glow & breathing lightning bolt',
      };
      setCaption(
        captions[newMode] ||
          `${pagePrefix}${newMode} — Use Left/Right Arrow Keys (← / →) to cycle widget pages`
      );

      if (morphSwapTimerRef.current) window.clearTimeout(morphSwapTimerRef.current);
      if (morphRevealTimerRef.current) window.clearTimeout(morphRevealTimerRef.current);

      if (newMode === 'AI Usage') {
        setPinnedUsageModelId((prev) => prev || 'claude');
        setCaption(
          'AI Usage Side Dock · Hover your cursor near Claude (73%), ChatGPT (21%), or Gemini (52%) on the right edge to inspect live usage'
        );
        return;
      }

      if (newMode === 'Charging') {
        setChargeAnimKey((k) => k + 1);
        runPercentageCounter(70, setChargingPct, 880);
      } else if (newMode === 'Widgets') {
        setChargeAnimKey((k) => k + 1);
        runPercentageCounter(82, setWidgetBatteryPct, 880);
      }

      if (isMusicToLyrics || !changed || isCompanionMorph) {
        setMorphHidden(false);
        setPersistentHeaderHidden(false);
        setDisplayMode(newMode);
        resetInactivitySleepTimer(newMode, switchMode);
        return;
      }

      const dir = slideDir || 0;
      const exitX = dir > 0 ? '-14px' : dir < 0 ? '14px' : '0px';
      const enterX = dir > 0 ? '14px' : dir < 0 ? '-14px' : '0px';
      const sY = dir !== 0 ? '0px' : '-4px';

      setSlideX(exitX);
      setSlideY(sY);
      setMorphHidden(true);

      if (!isSameExpandedSize) {
        setPersistentHeaderHidden(true);
      }

      morphSwapTimerRef.current = window.setTimeout(() => {
        setSlideX(enterX);
        setDisplayMode(newMode);
        requestAnimationFrame(() => {
          morphRevealTimerRef.current = window.setTimeout(() => {
            setMorphHidden(false);
            setPersistentHeaderHidden(false);
          }, 45);
        });
      }, 85);

      resetInactivitySleepTimer(newMode, switchMode);
    },
    [resetInactivitySleepTimer, runPercentageCounter]
  );

  const cycleExpandedPage = useCallback(
    (direction = 1) => {
      const currentIdx = (EXPANDED_MODES as readonly string[]).indexOf(modeRef.current);
      const nextIdx =
        currentIdx === -1
          ? direction > 0
            ? 0
            : EXPANDED_MODES.length - 1
          : (currentIdx + direction + EXPANDED_MODES.length) % EXPANDED_MODES.length;
      switchMode(EXPANDED_MODES[nextIdx], false, direction);
    },
    [switchMode]
  );

  // Playback, Focus, and Live Real-Time Clock 1-second tick
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
      setElapsed((prev) => {
        if (isPlaying && (modeRef.current === 'Music' || modeRef.current === 'Lyrics')) {
          const currentDuration = TRACKS[trackIndex].duration;
          return prev < currentDuration ? prev + 1 : prev;
        }
        return prev;
      });
      setFocusSeconds((prev) => {
        if (focusRunning && prev > 0) {
          return prev - 1;
        }
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, trackIndex, focusRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        cycleExpandedPage(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cycleExpandedPage(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        switchMode('Resting');
      } else if (e.key === ' ') {
        if (modeRef.current === 'Music' || modeRef.current === 'Lyrics') {
          e.preventDefault();
          setIsPlaying((p) => !p);
        } else if (modeRef.current === 'Focus timer') {
          e.preventDefault();
          setFocusRunning((r) => !r);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleExpandedPage, switchMode]);

  // Cursor eye-tracking, proximity auto-wave, and right-edge AI Usage dock proximity hover
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Check cursor proximity to right-edge AI Usage Dock & its floating popover
      const dockEl = sideDockBodyRef.current;
      if (dockEl) {
        const dockRect = dockEl.getBoundingClientRect();
        const popRect = usagePopoverRef.current?.getBoundingClientRect();
        // Expand proximity zone around the right-edge dock (55px left/top/bottom in viewport coordinates)
        const proximityPadX = 56 * Math.max(0.55, scale);
        const proximityPadY = 34 * Math.max(0.55, scale);

        const isNearDock =
          e.clientX >= dockRect.left - proximityPadX &&
          e.clientX <= dockRect.right + 24 &&
          e.clientY >= dockRect.top - proximityPadY &&
          e.clientY <= dockRect.bottom + proximityPadY;

        const isInsideOrBridgeToPopover =
          popRect != null &&
          e.clientX >= popRect.left - 18 &&
          e.clientX <= dockRect.right + 16 &&
          e.clientY >= Math.min(popRect.top, dockRect.top) - 18 &&
          e.clientY <= Math.max(popRect.bottom, dockRect.bottom) + 18;

        if (isNearDock) {
          // Find which of the 3 model gauges is closest vertically to the cursor
          let closestId: AIUsageModel['id'] = 'claude';
          let minDistance = Infinity;
          for (const model of AI_USAGE_MODELS) {
            const btn = usageGaugeRefs.current[model.id];
            if (btn) {
              const r = btn.getBoundingClientRect();
              const centerY = r.top + r.height / 2;
              const d = Math.abs(e.clientY - centerY);
              if (d < minDistance) {
                minDistance = d;
                closestId = model.id;
              }
            }
          }
          setHoveredUsageModelId(closestId);
        } else if (!isInsideOrBridgeToPopover) {
          setHoveredUsageModelId((prev) => (prev !== null ? null : prev));
        }
      }

      const currentMode = modeRef.current;
      if (autoSleepingRef.current && currentMode === 'Sleeping') {
        autoSleepingRef.current = false;
        switchMode('Surprised', true);
        setCaption('Woke up! (O O !) · Startled awake by cursor movement');
        window.setTimeout(() => {
          if (modeRef.current === 'Surprised') switchMode('Resting', true);
        }, 750);
        return;
      }

      resetInactivitySleepTimer(currentMode, switchMode);

      const stage = companionStageRef.current;
      const body = notchBodyRef.current;
      if (!stage || !body || !(COMPANION_MODES as readonly string[]).includes(currentMode)) return;

      const rect = body.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      const now = Date.now();

      if (currentMode === 'Resting' && dist < 130 && now - lastAutoWaveTimeRef.current > 4200) {
        lastAutoWaveTimeRef.current = now;
        proximityWavingRef.current = true;
        switchMode('Waving', true);
        setCaption('Proximity Auto-Wave (^ ^ 👋) · Companion noticed your cursor nearby!');
        if (proximityWaveResetTimerRef.current)
          window.clearTimeout(proximityWaveResetTimerRef.current);
        proximityWaveResetTimerRef.current = window.setTimeout(() => {
          if (proximityWavingRef.current && modeRef.current === 'Waving') {
            proximityWavingRef.current = false;
            switchMode('Resting', true);
          }
        }, 1850);
        return;
      }

      if (currentMode === 'Resting' || currentMode === 'Surprised') {
        const normX = Math.max(-1, Math.min(1, dx / 340));
        const normY = Math.max(-0.5, Math.min(1, dy / 260));
        setIsTracking(true);
        stage.style.setProperty('--look-x', `${(normX * 6.5).toFixed(2)}px`);
        stage.style.setProperty('--look-y', `${(normY * 3.2).toFixed(2)}px`);
        stage.style.setProperty('--look-tilt', `${(normX * 3.8).toFixed(2)}deg`);
        stage.style.setProperty('--left-persp', (1 - normX * 0.08).toFixed(3));
        stage.style.setProperty('--right-persp', (1 + normX * 0.08).toFixed(3));
        body.style.setProperty('--glow-shift', `${(normX * 8).toFixed(1)}%`);

        if (trackingReleaseTimerRef.current) window.clearTimeout(trackingReleaseTimerRef.current);
        trackingReleaseTimerRef.current = window.setTimeout(() => {
          setIsTracking(false);
          if (companionStageRef.current) {
            companionStageRef.current.style.setProperty('--look-x', '0px');
            companionStageRef.current.style.setProperty('--look-y', '0px');
            companionStageRef.current.style.setProperty('--look-tilt', '0deg');
            companionStageRef.current.style.setProperty('--left-persp', '1');
            companionStageRef.current.style.setProperty('--right-persp', '1');
          }
          if (notchBodyRef.current) {
            notchBodyRef.current.style.setProperty('--glow-shift', '0%');
          }
        }, 1800);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [resetInactivitySleepTimer, switchMode, scale]);

  // Focus input when opening To-do Add mode
  useEffect(() => {
    if (todoSubMode === 'add') {
      const t = window.setTimeout(() => {
        todoDraftInputRef.current?.focus();
      }, 25);
      return () => window.clearTimeout(t);
    }
  }, [todoSubMode, todoCompact]);

  // Sync To-do scrollbar thumb size and vertical offset with scroll position
  const updateTodoScrollMetrics = useCallback(() => {
    const el = todoListScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      setTodoScrollMetrics({ thumbHeightPct: 100, thumbTopPct: 0 });
      return;
    }
    const rawThumbPct = (clientHeight / scrollHeight) * 100;
    const thumbHeightPct = Math.max(24, Math.min(92, rawThumbPct));
    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = Math.max(0, Math.min(1, scrollTop / maxScroll));
    const thumbTopPct = scrollRatio * (100 - thumbHeightPct);
    setTodoScrollMetrics({ thumbHeightPct, thumbTopPct });
  }, []);

  useEffect(() => {
    const t = window.setTimeout(updateTodoScrollMetrics, 40);
    return () => window.clearTimeout(t);
  }, [todos, todoCompact, todoSubMode, displayMode, updateTodoScrollMetrics]);

  // Compute notchBody state classes
  const getNotchStateClass = (m: string) => {
    if (m === 'Closed') return 'state-closed';
    if (m === 'Resting') return 'state-resting';
    if (m === 'Waving') return 'state-waving';
    if (m === 'Sleeping') return 'state-sleeping';
    if (m === 'Vibing') return 'state-vibing';
    if (m === 'Surprised') return 'state-surprised';
    if (m === 'Notification') return 'state-notification';
    if (m === 'Charging') return 'state-charging';
    if (m === 'Headphones') return 'state-headphones';
    if (m === 'Lyrics') return 'state-lyrics';
    return 'state-expanded';
  };

  const activeStateClass = getNotchStateClass(displayMode);
  const isExpandedOrLyrics =
    (EXPANDED_MODES as readonly string[]).includes(displayMode) || displayMode === 'Lyrics';
  const isShelfOrClipboard = displayMode === 'Shelf' || displayMode === 'Clipboard';
  const showEq = !isShelfOrClipboard && displayMode !== 'Lyrics';
  const liveDateLabel = formatLiveDate(now);
  const liveTimeLabel = formatLiveClock(now);
  const liveWeekDays = getCurrentWeekDays(now);

  const activePaginationPage = mode === 'Lyrics' ? 'Music' : mode;

  // Actions
  const nextTrack = () => {
    const nextIdx = (trackIndex + 1) % TRACKS.length;
    setTrackIndex(nextIdx);
    setElapsed(TRACKS[nextIdx].elapsed);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    const prevIdx = (trackIndex - 1 + TRACKS.length) % TRACKS.length;
    setTrackIndex(prevIdx);
    setElapsed(0);
    setIsPlaying(true);
  };

  const seekTrack = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressTrackRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setElapsed(Math.floor(ratio * TRACKS[trackIndex].duration));
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const openTodoAdd = () => {
    setTodoSubMode((prev) => (prev === 'add' ? 'list' : 'add'));
    setTodoDraftTitle('');
    setTodoDraftTime('');
  };

  const cancelTodoDraft = () => {
    setTodoSubMode('list');
    setTodoDraftTitle('');
    setTodoDraftTime('');
  };

  const saveTodoDraft = () => {
    const sampleTasks = ['Sync Figma tokens', 'Ship v1.2 build', 'Clean up shelf'];
    const title = todoDraftTitle.trim() || sampleTasks[todos.length % sampleTasks.length];
    const trimmedTime = todoDraftTime.trim();
    const newItem: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: title,
      done: false,
      time: trimmedTime || undefined,
      repeat: todoDraftRepeat,
    };
    setTodos((prev) => [newItem, ...prev]);
    setTodoSubMode('list');
    setTodoDraftTitle('');
    setTodoDraftTime('');
  };

  const cycleTodoRepeat = () => {
    const options = ['Daily', 'Once', 'Weekdays'];
    setTodoDraftRepeat((prev) => options[(options.indexOf(prev) + 1) % options.length]);
  };

  const moveTodo = (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= todos.length) return;
    setTodos((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) setTodoSubMode('list');
      return next;
    });
  };

  const handleShelfFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setShelfStatus({
      title: files.length === 1 ? files[0].name : `${files.length} files staged on Shelf`,
      sub: 'Ready to drag out · click to add more',
    });
  };

  // Render Header helper
  const renderTopHeader = (leftNode: React.ReactNode) => (
    <div className="flex items-center justify-between w-full mb-0.5 h-[14px] -mt-[4px]">
      <div className="w-28 flex items-center justify-start whitespace-nowrap leading-none">
        {leftNode ? (
          <span className="text-[12.5px] font-semibold text-white tracking-[-0.01em] leading-none">
            {leftNode}
          </span>
        ) : null}
      </div>
    </div>
  );

  // Render View Content based on displayMode
  const renderContent = () => {
    if (displayMode === 'Closed') {
      return (
        <div
          onClick={() => switchMode('Music')}
          className="w-full h-[32px] flex items-center justify-between cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" className="-rotate-90 shrink-0">
            <circle
              cx="9"
              cy="9"
              r="6.8"
              stroke="rgba(48, 209, 88, 0.25)"
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="9"
              cy="9"
              r="6.8"
              stroke="#30D158"
              strokeWidth="2.5"
              strokeDasharray="42.7"
              strokeDashoffset="11"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="text-[13.5px] font-bold text-white tracking-[-0.01em] tabular-nums leading-none">
            {liveTimeLabel}
          </span>
          <div className="flex items-center gap-[2px] h-3.5 shrink-0">
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
          </div>
        </div>
      );
    }

    if ((COMPANION_MODES as readonly string[]).includes(displayMode)) {
      const nextCompanion =
        COMPANION_MODES[
          (COMPANION_MODES.indexOf(displayMode as (typeof COMPANION_MODES)[number]) + 1) %
            COMPANION_MODES.length
        ];
      const stageClass = [
        'companion-stage',
        displayMode === 'Waving' ? 'is-waving' : '',
        displayMode === 'Sleeping' ? 'is-sleeping' : '',
        displayMode === 'Vibing' ? 'is-vibing' : '',
        displayMode === 'Surprised' ? 'is-surprised' : '',
        isTracking && (displayMode === 'Resting' || displayMode === 'Surprised')
          ? 'is-tracking'
          : '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div
          onClick={() => switchMode(nextCompanion)}
          title={`Click to cycle companion expression (${nextCompanion})`}
          className="w-full h-[32px] flex items-center justify-center cursor-pointer"
        >
          <div ref={companionStageRef} className={stageClass}>
            <div className="eye-look-tracker">
              <div className="resting-eyes-group">
                <span className="notch-eye-wrap">
                  <span className="notch-eye-pill" />
                  <svg className="notch-eye-arch" viewBox="0 0 14 9" fill="none">
                    <path
                      d="M2 7.2 Q7 1.2 12 7.2"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg className="notch-eye-sleep" viewBox="0 0 14 9" fill="none">
                    <path
                      d="M2 2.4 Q7 7.8 12 2.4"
                      stroke="#FFFFFF"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="notch-eye-wrap">
                  <span className="notch-eye-pill" />
                  <svg className="notch-eye-arch" viewBox="0 0 14 9" fill="none">
                    <path
                      d="M2 7.2 Q7 1.2 12 7.2"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg className="notch-eye-sleep" viewBox="0 0 14 9" fill="none">
                    <path
                      d="M2 2.4 Q7 7.8 12 2.4"
                      stroke="#FFFFFF"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
            <div className="companion-hand-wrap">
              <svg className="wave-hand-svg" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M18.5 7.5C17.8 7.5 17.2 8 17.1 8.7L16.3 12.2L15.9 5.5C15.8 4.7 15.1 4 14.3 4C13.5 4 12.8 4.7 12.7 5.5L12.3 11.2V3.6C12.3 2.7 11.6 2 10.7 2C9.8 2 9.1 2.7 9.1 3.6V11.2L8.4 5.2C8.3 4.3 7.6 3.7 6.7 3.8C5.8 3.9 5.2 4.7 5.3 5.5L6.2 13.6L4.6 11.6C4 10.9 3 10.8 2.3 11.4C1.6 12 1.5 13 2.1 13.7L5.8 18.8C7.3 20.8 9.6 22 12.2 22C16.5 22 19.8 18.8 20.3 14.5L21 9.3C21.1 8.3 20.3 7.5 19.3 7.5H18.5Z" />
              </svg>
            </div>
            <div className="companion-zzz-wrap">
              <span className="zzz-char z-1">z</span>
              <span className="zzz-char z-2">Z</span>
            </div>
            <div className="companion-notes-wrap">
              <span className="note-char n-1">♪</span>
              <span className="note-char n-2">♫</span>
            </div>
            <div className="companion-alert-wrap">
              <span className="alert-char">!</span>
            </div>
          </div>
        </div>
      );
    }

    if (displayMode === 'Notification') {
      return (
        <div
          onClick={() => switchMode('Music')}
          className="flex items-center gap-3 w-full h-full cursor-pointer"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#30D158] flex items-center justify-center shrink-0 shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C6.48 3 2 6.92 2 11.75c0 2.75 1.46 5.2 3.74 6.8-.18 1.25-.72 2.42-1.48 3.22-.2.21-.05.56.24.53 1.83-.19 3.63-.91 4.92-1.85.83.19 1.7.3 2.58.3 5.52 0 10-3.92 10-8.75S17.52 3 12 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[10.5px] text-[#8e9099] leading-none">
              <span className="font-medium">Messages</span>
              <span>now</span>
            </div>
            <div className="text-[13px] font-bold text-white leading-tight mt-0.5 truncate">Nusa</div>
            <div className="text-[11.5px] text-[#d2d3d8] leading-tight mt-0.5 truncate">
              Hello, Nusa 1.2!
            </div>
          </div>
        </div>
      );
    }

    if (displayMode === 'Charging') {
      return (
        <div
          key={chargeAnimKey}
          onClick={() => switchMode('Charging')}
          title="Click to replay charging animation"
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 overflow-visible">
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  stroke="rgba(48, 209, 88, 0.2)"
                  strokeWidth="3.2"
                  fill="none"
                />
                <circle
                  className="charge-ring-arc-70"
                  cx="18"
                  cy="18"
                  r="14.5"
                  stroke="#30D158"
                  strokeWidth="3.2"
                  strokeDasharray="91.1"
                  strokeDashoffset="91.1"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="#ffffff"
                className="absolute charge-bolt-icon"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[13.5px] font-semibold text-white leading-tight">Charging</span>
              <span className="text-[11px] text-[#8e9099] leading-tight mt-0.5">
                Charger connected
              </span>
            </div>
          </div>
          <span className="text-[22px] font-normal text-white tracking-[-0.02em] tabular-nums">
            {chargingPct}%
          </span>
        </div>
      );
    }

    if (displayMode === 'Headphones') {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 overflow-visible">
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  stroke="rgba(56, 189, 248, 0.22)"
                  strokeWidth="3.2"
                  fill="none"
                />
                <circle
                  className="bt-ring-arc-70"
                  cx="18"
                  cy="18"
                  r="14.5"
                  stroke="#38BDF8"
                  strokeWidth="3.2"
                  strokeDasharray="91.1"
                  strokeDashoffset="91.1"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute"
              >
                <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[13.5px] font-semibold text-white leading-tight">
                AirBuds Pro
              </span>
              <span className="text-[11px] text-[#8e9099] leading-tight mt-0.5">
                Connected · 70%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#131824] border border-[#38BDF8]/30 flex items-center justify-center shadow-[0_0_16px_rgba(56,189,248,0.22)] shrink-0">
            <div className="w-7 h-7 rounded-full border border-[#38BDF8]/45 flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (displayMode === 'Music' || displayMode === 'Lyrics') {
      const isLyrics = displayMode === 'Lyrics';
      const track = TRACKS[trackIndex];
      const remaining = Math.max(0, track.duration - elapsed);
      const progressPct = Math.min(100, Math.max(0, (elapsed / track.duration) * 100));

      return (
        <div className={`music-lyrics-shell ${isLyrics ? 'is-lyrics-open' : ''}`}>
          <div className="music-primary-pane">
            <div className="flex items-stretch justify-between gap-3">
              <div className="shrink-0">
                <AlbumArtSVG size={50} />
              </div>
              <div className="music-meta-column">
                <div className="flex items-end justify-between gap-1.5">
                  <div className="flex flex-col min-w-0">
                    <div className="text-[13.5px] font-semibold text-white leading-tight truncate tracking-[-0.01em]">
                      {track.title}
                    </div>
                    <div className="text-[10.5px] text-[#8e9099] font-normal mt-0.5 truncate">
                      {track.artist}
                    </div>
                  </div>
                  <button
                    onClick={() => cycleExpandedPage(1)}
                    title="Next Widget Page (→)"
                    className="music-next-arrow-btn w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] shrink-0 cursor-pointer mb-[-2px]"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-[10.5px] font-medium text-[#e2e3e8] tabular-nums leading-none">
                {formatTime(elapsed)}
              </span>
              <div
                ref={progressTrackRef}
                className="progress-track"
                style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.24)' }}
                onClick={seekTrack}
              >
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-[10.5px] font-medium text-[#e2e3e8] tabular-nums leading-none">
                -{formatTime(remaining)}
              </span>
            </div>
            <div className="music-transport-row">
              <button
                onClick={() => switchMode(isLyrics ? 'Music' : 'Lyrics')}
                title="Toggle Lyrics"
                className={`absolute left-4 hover:opacity-85 transition cursor-pointer ${
                  isLyrics ? 'text-white' : 'text-[#8e9099] hover:text-white'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                    fill="currentColor"
                  />
                  <circle cx="9.2" cy="11" r="1.35" fill="#08080a" />
                  <circle cx="14.8" cy="11" r="1.35" fill="#08080a" />
                </svg>
              </button>
              <div className="music-transport-buttons">
                <button
                  onClick={prevTrack}
                  className="text-white hover:opacity-80 active:scale-90 transition cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className="text-white hover:opacity-80 active:scale-90 transition cursor-pointer"
                >
                  {isPlaying ? (
                    <svg width="14.5" height="14.5" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="3.8" height="14" rx="0.9" />
                      <rect x="14.2" y="5" width="3.8" height="14" rx="0.9" />
                    </svg>
                  ) : (
                    <svg width="14.5" height="14.5" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={nextTrack}
                  className="text-white hover:opacity-80 active:scale-90 transition cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="lyrics-secondary-pane">
            <div className="w-[1px] h-[86px] bg-white/[0.13] shrink-0" />
            <div className="flex flex-col justify-center text-left select-none overflow-hidden min-w-0 flex-1">
              <p className="text-[12px] leading-[1.2] text-white/25 font-bold tracking-[-0.01em] truncate">
                {track.lyrics[0]}
              </p>
              <p className="text-[13.5px] leading-[1.22] text-white font-bold tracking-[-0.015em] mt-1.5 truncate">
                {track.lyrics[1]}
              </p>
              <p className="text-[12px] leading-[1.22] text-[#8d99ae]/75 font-bold tracking-[-0.01em] mt-1.5 truncate">
                {track.lyrics[2]}
              </p>
              <p className="text-[12px] leading-[1.18] text-[#7a8ca8]/30 font-bold tracking-[-0.01em] mt-1.5 truncate">
                {track.lyrics[3]}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (displayMode === 'Focus timer') {
      return (
        <div className="pt-2">
          {renderTopHeader('Focus')}
          <div className="flex items-center gap-2.5 h-[70px] mt-1.5">
            <button
              onClick={() => cycleExpandedPage(-1)}
              title="Previous (←)"
              className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 flex flex-col justify-between h-[66px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-emerald-400 font-semibold leading-none">
                    Deep Work Session
                  </div>
                  <div className="text-[23px] font-bold tracking-tight tabular-nums leading-none mt-1">
                    {formatTime(focusSeconds)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFocusRunning((r) => !r)}
                    className="px-3 py-1 rounded-full bg-white text-black text-[10.5px] font-semibold hover:opacity-90 cursor-pointer"
                  >
                    {focusRunning ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setFocusSeconds(25 * 60)}
                    className="px-2.5 py-1 rounded-full bg-[#222328] text-white text-[10.5px] font-medium hover:bg-[#2e3038] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${(focusSeconds / (25 * 60)) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => cycleExpandedPage(1)}
              title="Next (→)"
              className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    if (displayMode === 'Water') {
      const currentLiters = Math.min(1.5, Number((waterGlasses * 0.3).toFixed(1)));
      const pct = Math.min(100, Math.round((currentLiters / 1.5) * 100));
      return (
        <div className="pt-2">
          {renderTopHeader(
            <>
              Water <span className="text-[#3898EC] font-medium">Reminder</span>
            </>
          )}
          <div className="flex items-center gap-2.5 h-[70px] mt-1.5">
            <button
              onClick={() => cycleExpandedPage(-1)}
              title="Previous (←)"
              className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 flex flex-col justify-between h-[68px] min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-[19px] font-bold text-white leading-none tracking-[-0.02em] tabular-nums">
                    {currentLiters.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#8e9099] font-medium">/ 1.5 L</span>
                </div>
                <div className="w-7 h-4 rounded-full bg-[#2B82D9] p-0.5 flex items-center justify-end">
                  <span className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="#2B82D9">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-[#8e9099] leading-none">
                Today · <span className="text-[#3898EC] font-semibold">{pct}%</span> ·{' '}
                {pct >= 100 ? 'Goal reached' : 'Keep hydrating'}
              </div>
              <div className="w-full h-[3px] rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#2B82D9] rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWaterGlasses((g) => (g < 12 ? g + 1 : g))}
                  className="h-[19px] px-2.5 rounded-full bg-[#132942] hover:bg-[#193657] active:scale-95 text-[#58A6FF] text-[9.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  <span>Drink</span>
                </button>
                <button
                  onClick={() => setWaterGlasses(0)}
                  className="h-[19px] px-2.5 rounded-full bg-[#1C1D22] hover:bg-[#272930] active:scale-95 text-[#d2d3d8] text-[9.5px] font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Reset</span>
                </button>
              </div>
            </div>
            <div className="w-[1px] h-[62px] bg-white/10 shrink-0" />
            <div className="flex items-end gap-1.5 h-[62px] pr-0.5 shrink-0">
              <div className="flex items-end gap-1.5 h-[46px]">
                {HOURLY_WATER_BARS.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-[5px] h-[34px] rounded-full bg-white/10 flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-[#2563EB] to-[#60A5FA]"
                        style={{ height: `${val}%` }}
                      />
                    </div>
                    <span className="text-[7.5px] text-[#7e8089] leading-none tabular-nums">
                      {idx === 0 ? '09' : idx === 3 ? '12' : idx === 6 ? '15' : '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-between h-[38px] text-[7.5px] text-[#6e7079] leading-none pb-1 tabular-nums">
                <span>400</span>
                <span>200</span>
                <span>0 ml</span>
              </div>
            </div>
            <button
              onClick={() => cycleExpandedPage(1)}
              title="Next (→)"
              className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    if (displayMode === 'Shelf') {
      return (
        <div className="pt-2">
          {renderTopHeader('Shelf')}
          <div className="flex items-center gap-2 mt-2.5 px-0.5">
            <button
              onClick={() => cycleExpandedPage(-1)}
              title="Previous (←)"
              className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <label className="group relative flex-1 h-[64px] rounded-[15px] bg-white/[0.015] hover:bg-white/[0.035] transition flex flex-col items-center justify-center cursor-pointer px-3">
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <rect
                  x="0.75"
                  y="0.75"
                  rx="14.25"
                  ry="14.25"
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="0.1 5.4"
                  style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)' }}
                  className="stroke-white/35 group-hover:stroke-white/60 transition"
                />
              </svg>
              <input type="file" multiple className="hidden" onChange={handleShelfFiles} />
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className="mb-0.5">
                <path
                  d="M12 3v9m0 0l-3.2-3.2M12 12l3.2-3.2"
                  stroke="#8e9099"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 13.5l2.2-3.5h9.6l2.2 3.5H15.5l-1.2 1.8h-4.6l-1.2-1.8H5z"
                  fill="#8e9099"
                />
                <path
                  d="M5 13.5h3.5l1.2 1.8h4.6l1.2-1.8H19v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18v-4.5z"
                  fill="#d2d3d8"
                />
              </svg>
              <div className="text-[12.5px] font-medium text-white leading-tight">
                {shelfStatus.title}
              </div>
              <div className="text-[10px] text-[#7e8089] mt-0.5 leading-tight">
                {shelfStatus.sub}
              </div>
            </label>
            <button
              onClick={() => cycleExpandedPage(1)}
              title="Next (→)"
              className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    if (displayMode === 'To-do') {
      const doneCount = todos.filter((t) => t.done).length;
      const totalCount = todos.length;
      const pctDone = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      const ringCircumference = 2 * Math.PI * 11.5; // r = 11.5 -> ~72.26
      const ringDashOffset = ringCircumference - (pctDone / 100) * ringCircumference;
      const isAdd = todoSubMode === 'add';
      const isEdit = todoSubMode === 'edit';

      return (
        <div className="pt-2">
          {renderTopHeader(
            <div className="flex items-center gap-1.5">
              <span>
                Todo<span className="text-[#30D158] font-medium">List</span>
              </span>
              {todoCompact && (
                <span className="px-1.5 py-[1px] rounded-full bg-[#132A1B] border border-[#1E462C] text-[#30D158] text-[8.5px] font-semibold tabular-nums">
                  {doneCount}/{totalCount}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 h-[72px] mt-1.5 px-0.5">
            {/* Previous Widget Arrow */}
            <button
              onClick={() => cycleExpandedPage(-1)}
              title="Previous (←)"
              className="nav-arrow w-5 h-5 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Unified Animated Left Column (Smoothly morphs between 150px Standard Summary & 30px Compact Rail) */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 430, damping: 34 }}
              className={`flex flex-col justify-between h-[68px] shrink-0 overflow-hidden ${
                todoCompact ? 'w-[30px]' : 'w-[150px]'
              }`}
            >
              {todoCompact ? (
                <motion.div
                  key="compact-rail"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col items-center justify-between h-full py-0.5"
                >
                  <button
                    onClick={() => setTodoCompact(false)}
                    title="Expand summary panel"
                    className="relative w-6 h-6 rounded-full bg-[#182235] border border-[#3B82F6]/40 hover:bg-[#21304b] active:scale-95 flex items-center justify-center text-[#60A5FA] transition cursor-pointer"
                  >
                    <svg
                      width="10.5"
                      height="10.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#30D158] ring-2 ring-[#08080a]" />
                  </button>

                  <button
                    onClick={openTodoAdd}
                    title="Add Task"
                    className={`w-6 h-6 rounded-full ${
                      isAdd
                        ? 'bg-[#0F2E1A] border border-[#1D4E2E]'
                        : 'bg-[#1C1D22] hover:bg-[#272930]'
                    } active:scale-95 flex items-center justify-center transition cursor-pointer`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        isAdd ? 'bg-[#30D158] text-[#071A0E]' : 'bg-white text-black'
                      } flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isAdd ? 'rotate-45' : ''
                      }`}
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      >
                        <line x1="6" y1="2.2" x2="6" y2="9.8" />
                        <line x1="2.2" y1="6" x2="9.8" y2="6" />
                      </svg>
                    </span>
                  </button>

                  <button
                    onClick={() => setTodoSubMode((m) => (m === 'edit' ? 'list' : 'edit'))}
                    title="Edit Tasks"
                    className={`w-6 h-6 rounded-full ${
                      isEdit
                        ? 'bg-[#0F2E1A] border border-[#1D4E2E] text-[#30D158]'
                        : 'bg-[#1C1D22] hover:bg-[#272930] text-[#d2d3d8]'
                    } active:scale-95 flex items-center justify-center transition cursor-pointer`}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded-summary"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col justify-between h-full w-[150px]"
                >
                  <div className="flex items-center justify-between pr-1">
                    <div className="flex items-center gap-2">
                      {/* Animated Radial Progress Ring */}
                      <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
                          <circle
                            cx="14"
                            cy="14"
                            r="11.5"
                            stroke="rgba(48, 209, 88, 0.18)"
                            strokeWidth="2.6"
                            fill="none"
                          />
                          <circle
                            className="todo-progress-arc"
                            cx="14"
                            cy="14"
                            r="11.5"
                            stroke="#30D158"
                            strokeWidth="2.6"
                            strokeDasharray={ringCircumference}
                            strokeDashoffset={ringDashOffset}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <span className="absolute text-[7.5px] font-bold text-[#30D158] tabular-nums">
                          {pctDone}%
                        </span>
                      </div>
                      <div>
                        <div className="text-[19px] font-bold text-white leading-none tracking-[-0.02em] tabular-nums">
                          {doneCount}
                          <span className="text-[#6e7079] text-[13px] font-semibold">
                            /{totalCount}
                          </span>
                        </div>
                        <div className="text-[8.5px] text-[#8e9099] mt-0.5 leading-none">
                          {doneCount === totalCount && totalCount > 0
                            ? 'All tasks done!'
                            : 'Tasks Done'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setTodoCompact(true)}
                      title="Expand full task list"
                      className="relative w-6 h-6 rounded-full bg-[#1C1D22] hover:bg-[#272930] active:scale-95 flex items-center justify-center text-[#9ea0aa] hover:text-white transition cursor-pointer"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#08080a]" />
                    </button>
                  </div>

                  {/* Segmented Action Pill Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={openTodoAdd}
                      className={`h-[22px] pl-[4px] pr-2.5 rounded-full ${
                        isAdd
                          ? 'bg-[#0F2E1A] border border-[#1D4E2E] text-[#30D158] shadow-[0_0_10px_rgba(48,209,88,0.18)]'
                          : 'bg-[#1C1D22] hover:bg-[#272930] text-white border border-transparent'
                      } active:scale-95 text-[9px] font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${
                          isAdd ? 'bg-[#30D158] text-[#071A0E]' : 'bg-white text-black'
                        } flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isAdd ? 'rotate-45' : ''
                        }`}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        >
                          <line x1="6" y1="2.2" x2="6" y2="9.8" />
                          <line x1="2.2" y1="6" x2="9.8" y2="6" />
                        </svg>
                      </span>
                      <span>{isAdd ? 'Close' : 'Add Task'}</span>
                    </button>
                    <button
                      onClick={() => setTodoSubMode((m) => (m === 'edit' ? 'list' : 'edit'))}
                      className={`h-[22px] px-2 rounded-full ${
                        isEdit
                          ? 'bg-[#0F2E1A] border border-[#1D4E2E] text-[#30D158] shadow-[0_0_10px_rgba(48,209,88,0.18)]'
                          : 'bg-[#1C1D22] hover:bg-[#272930] text-[#d2d3d8] border border-transparent'
                      } active:scale-95 text-[9px] font-medium flex items-center gap-1 transition-all duration-200 cursor-pointer whitespace-nowrap`}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{isEdit ? 'Done' : 'Edit'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right Interactive Content Pane with Spring Sub-mode Transitions */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="flex-1 min-w-0 h-[72px] flex items-stretch"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isAdd ? (
                  <motion.div
                    key="todo-add-panel"
                    initial={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, scale: 0.96, filter: 'blur(3px)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="w-full h-[72px] rounded-[13px] bg-[#121318] border border-white/[0.08] px-2.5 py-[5px] flex flex-col justify-between gap-[4px] min-w-0 shadow-inner"
                  >
                    <div className="h-[19px] px-2.5 rounded-full bg-[#090A0D] border border-[#30D158]/60 focus-within:border-[#30D158] flex items-center gap-2 transition-colors shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_6px_#30D158] shrink-0" />
                      <input
                        ref={todoDraftInputRef}
                        type="text"
                        value={todoDraftTitle}
                        onChange={(e) => setTodoDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTodoDraft();
                          else if (e.key === 'Escape') cancelTodoDraft();
                        }}
                        placeholder="New task title..."
                        className="w-full bg-transparent text-[9.5px] text-white placeholder-[#6e7079] focus:outline-none leading-none"
                      />
                    </div>

                    <div className="h-[18px] pl-2.5 pr-1.5 rounded-full bg-[#1A1B21] border border-white/[0.04] flex items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <svg
                          width="9.5"
                          height="9.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ea0aa"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <polyline points="12 7 12 12 15 14" />
                        </svg>
                        <input
                          type="text"
                          value={todoDraftTime}
                          onChange={(e) => setTodoDraftTime(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTodoDraft();
                            else if (e.key === 'Escape') cancelTodoDraft();
                          }}
                          placeholder="09:00 - 10:30"
                          className="w-full bg-transparent text-[8.5px] text-[#e2e3e8] placeholder-[#686a73] focus:outline-none tabular-nums leading-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={cycleTodoRepeat}
                        title="Cycle repeat schedule"
                        className="px-2 py-[2px] rounded-full bg-[#262830] hover:bg-[#323540] active:scale-95 text-[7.5px] font-semibold text-[#30D158] leading-none cursor-pointer shrink-0 transition"
                      >
                        {todoDraftRepeat}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={cancelTodoDraft}
                        className="h-[16px] rounded-full bg-[#1E2027] hover:bg-[#2A2D36] active:scale-95 text-[#d2d3d8] text-[8.5px] font-medium flex items-center justify-center transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveTodoDraft}
                        className="h-[16px] rounded-full bg-[#30D158] hover:bg-[#38E062] active:scale-95 text-[#051A0B] text-[8.5px] font-bold flex items-center justify-center transition shadow-[0_0_10px_rgba(48,209,88,0.3)] cursor-pointer"
                      >
                        Save Task
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="todo-list-panel"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    className="w-full h-[68px] flex items-stretch gap-1.5 min-w-0"
                  >
                    <div
                      ref={todoListScrollRef}
                      onScroll={updateTodoScrollMetrics}
                      className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar pr-0.5 min-w-0"
                    >
                      <AnimatePresence initial={false}>
                        {todos.length === 0 ? (
                          <motion.div
                            key="empty-todos"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            className="h-full rounded-[10px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-2"
                          >
                            <span className="text-[10px] font-semibold text-[#d2d3d8]">
                              All clear for today
                            </span>
                            <button
                              onClick={openTodoAdd}
                              className="mt-1 text-[8.5px] text-[#30D158] hover:underline font-medium cursor-pointer"
                            >
                              + Add a new task
                            </button>
                          </motion.div>
                        ) : (
                          todos.map((todo, idx) => (
                            <motion.div
                              layout
                              key={todo.id}
                              initial={{ opacity: 0, x: 14, scale: 0.94 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -16, scale: 0.88 }}
                              transition={{
                                layout: { type: 'spring', stiffness: 520, damping: 35 },
                                opacity: { duration: 0.18 },
                                scale: { duration: 0.18 },
                              }}
                              className={`todo-item-row w-full ${
                                todoCompact ? 'min-h-[22px] py-0.5' : 'min-h-[20px] py-[2px]'
                              } pl-2 pr-1.5 rounded-[7.5px] ${
                                todo.done
                                  ? 'bg-[#0E2617]/95 border border-[#1B462A]'
                                  : 'bg-[#16171C] border border-white/[0.08] hover:border-white/[0.16]'
                              } flex items-center justify-between gap-1.5 shrink-0`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleTodo(todo.id)}
                                className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer"
                              >
                                <span
                                  className={`todo-check-circle w-3.5 h-3.5 rounded-full ${
                                    todo.done
                                      ? 'is-checked bg-[#30D158] text-[#061A0C] border-transparent'
                                      : 'border border-white/35 hover:border-[#30D158]'
                                  } flex items-center justify-center shrink-0`}
                                >
                                  {todo.done && (
                                    <svg
                                      width="8"
                                      height="8"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>

                                <span
                                  className={`text-[9.5px] font-medium truncate transition-colors duration-200 ${
                                    todo.done
                                      ? 'text-[#9ec5aa] line-through decoration-[#6a9e7b]/80'
                                      : 'text-white'
                                  }`}
                                >
                                  {todo.text}
                                </span>
                              </button>

                              {/* Right side: either Edit controls (Move Up/Down/Delete) or Time Badge */}
                              <AnimatePresence mode="wait" initial={false}>
                                {isEdit ? (
                                  <motion.div
                                    key="edit-actions"
                                    initial={{ opacity: 0, scale: 0.85, x: 6 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, x: 6 }}
                                    transition={{ duration: 0.14 }}
                                    className="flex items-center gap-0.5 shrink-0"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => moveTodo(idx, -1)}
                                      title="Move up"
                                      className={`w-3.5 h-3.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center text-[#e2e3e8] transition cursor-pointer ${
                                        idx === 0 ? 'opacity-25 pointer-events-none' : ''
                                      }`}
                                    >
                                      <svg
                                        width="7.5"
                                        height="7.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="18 15 12 9 6 15" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveTodo(idx, 1)}
                                      title="Move down"
                                      className={`w-3.5 h-3.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center text-[#e2e3e8] transition cursor-pointer ${
                                        idx === todos.length - 1
                                          ? 'opacity-25 pointer-events-none'
                                          : ''
                                      }`}
                                    >
                                      <svg
                                        width="7.5"
                                        height="7.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="6 9 12 15 18 9" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteTodo(todo.id)}
                                      title="Delete task"
                                      className="w-3.5 h-3.5 rounded-full bg-[#FF453A]/90 hover:bg-[#FF453A] active:scale-90 flex items-center justify-center text-white transition cursor-pointer"
                                    >
                                      <svg
                                        width="7"
                                        height="7"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </motion.div>
                                ) : todo.time ? (
                                  <motion.span
                                    key="time-pill"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`px-1.5 py-[1px] rounded text-[7.5px] tabular-nums font-medium shrink-0 ${
                                      todo.done
                                        ? 'text-[#73a983] bg-[#143520]/70'
                                        : 'text-[#8e9099] bg-white/[0.05]'
                                    }`}
                                  >
                                    {todo.time}
                                  </motion.span>
                                ) : null}
                              </AnimatePresence>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Interactive Live Scroll Indicator Track */}
                    <div
                      onClick={(e) => {
                        const el = todoListScrollRef.current;
                        if (!el) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickRatio = Math.max(
                          0,
                          Math.min(1, (e.clientY - rect.top) / rect.height)
                        );
                        el.scrollTo({
                          top: clickRatio * (el.scrollHeight - el.clientHeight),
                          behavior: 'smooth',
                        });
                      }}
                      title="Scroll indicator (click to jump)"
                      className="relative w-[3px] rounded-full bg-white/15 my-0.5 overflow-hidden shrink-0 cursor-pointer"
                    >
                      <div
                        className="absolute left-0 right-0 rounded-full bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.65)] transition-[top,height] duration-75 ease-out"
                        style={{
                          height: `${todoScrollMetrics.thumbHeightPct}%`,
                          top: `${todoScrollMetrics.thumbTopPct}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Next Widget Arrow */}
            <button
              onClick={() => cycleExpandedPage(1)}
              title="Next (→)"
              className="nav-arrow w-5 h-5 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    if (displayMode === 'Widgets') {
      return (
        <div key={chargeAnimKey} className="pt-2">
          {renderTopHeader('Widgets')}
          <div className="flex items-center gap-2 h-[72px] mt-1.5">
            <button
              onClick={() => cycleExpandedPage(-1)}
              title="Previous (←)"
              className="nav-arrow w-5 h-5 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 grid grid-cols-[1.15fr_1fr] gap-2 min-w-0">
              <div className="h-[72px] rounded-[12px] bg-[#131418] border border-white/[0.06] px-2.5 py-1.5 flex flex-col justify-between min-w-0">
                <div className="text-[8px] font-semibold tracking-wider text-[#7e8089] uppercase leading-none">
                  THIS WEEK
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {liveWeekDays.map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span
                        className={`text-[7px] font-medium ${
                          d.active ? 'text-[#3898EC]' : 'text-[#6e7079]'
                        } leading-none mb-0.5`}
                      >
                        {d.day}
                      </span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${
                          d.active
                            ? 'bg-[#1A73E8] text-white font-bold'
                            : 'text-[#e2e3e8] font-semibold'
                        } text-[8.5px] flex items-center justify-center leading-none tabular-nums`}
                      >
                        {d.date}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full mt-0.5"
                        style={{ backgroundColor: d.dot || 'transparent' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] mt-1 shrink-0" />
                  <div className="min-w-0 leading-tight">
                    <div className="text-[9px] font-semibold text-white truncate">
                      {todos.filter((t) => !t.done).length || todos.length} tasks today
                    </div>
                    <div className="text-[7.5px] text-[#7e8089] truncate">
                      Next: {todos.find((t) => !t.done)?.text || 'All caught up'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[72px] rounded-[12px] bg-[#131418] border border-white/[0.06] px-3 py-1.5 flex flex-col justify-between min-w-0">
                <div className="text-[8px] font-semibold tracking-wider text-[#7e8089] uppercase leading-none">
                  BATTERY
                </div>
                <div className="flex items-center gap-2.5 my-auto">
                  <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 44 44"
                      className="-rotate-90 overflow-visible"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r="17.5"
                        stroke="rgba(48, 209, 88, 0.2)"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        className="charge-ring-arc-82"
                        cx="22"
                        cy="22"
                        r="17.5"
                        stroke="#30D158"
                        strokeWidth="4"
                        strokeDasharray="110"
                        strokeDashoffset="110"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="#ffffff"
                      className="absolute charge-bolt-icon"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[17px] font-bold text-white leading-none tracking-[-0.02em] tabular-nums">
                      {widgetBatteryPct}%
                    </span>
                    <span className="text-[9px] font-semibold text-[#30D158] leading-tight mt-0.5">
                      Charging
                    </span>
                    <span className="text-[7.5px] text-[#7e8089] leading-tight">Plugged in</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => cycleExpandedPage(1)}
              title="Next (→)"
              className="nav-arrow w-5 h-5 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    // Clipboard view
    return (
      <div className="pt-2">
        {renderTopHeader('Shelf')}
        <div className="flex items-center gap-2 h-[70px] mt-1.5 px-0.5">
          <button
            onClick={() => cycleExpandedPage(-1)}
            title="Previous (←)"
            className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-1 -mt-1">
            <div className="text-[13px] font-semibold text-white leading-tight tracking-[-0.01em]">
              Copy some text
            </div>
            <div className="text-[10.5px] text-[#7e8089] mt-1 leading-tight">
              It will wait here, ready to paste again
            </div>
          </div>
          <button
            onClick={() => cycleExpandedPage(1)}
            title="Next (→)"
            className="nav-arrow w-6 h-6 rounded-full bg-[#242529] hover:bg-[#32343a] active:scale-95 flex items-center justify-center text-[#d4d5da] transition shrink-0 cursor-pointer"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div
        className="stage-box"
        style={{
          width: `${1964 * scale}px`,
          height: `${1124 * scale}px`,
        }}
      >
        <div
          className="laptop-frame"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <div className="screen-display">
            <div className="wallpaper-petals">
              <div className="wallpaper-art">
                <div className="petal petal-left-outer" />
                <div className="petal petal-right-outer" />
                <div className="petal petal-left-inner" />
                <div className="petal petal-right-inner" />
                <div className="petal petal-center" />
                <div className="wallpaper-horizon" />
              </div>
            </div>

            <div className="notch-wrapper">
              <div
                ref={notchBodyRef}
                className={`notch-body ${activeStateClass} ${isPlaying ? 'playing' : 'paused'}`}
              >
                <div className="resting-glow-layer" />
                <div className="notch-ear-left" />
                <div className="notch-ear-right" />

                <div className="notch-inner-clip">
                  {/* Persistent Expanded Top Bar */}
                  <div
                    className={`persistent-top-bar ${
                      persistentHeaderHidden ? 'morphing-hidden' : ''
                    }`}
                  >
                    <div className="w-28 h-full flex items-center" />
                    <div className="h-full flex items-center gap-2 shrink-0">
                      <svg width="15" height="15" viewBox="0 0 18 18" className="-rotate-90 shrink-0">
                        <circle
                          cx="9"
                          cy="9"
                          r="6.8"
                          stroke="rgba(48, 209, 88, 0.25)"
                          strokeWidth="2.4"
                          fill="none"
                        />
                        <circle
                          cx="9"
                          cy="9"
                          r="6.8"
                          stroke="#30D158"
                          strokeWidth="2.4"
                          strokeDasharray="42.7"
                          strokeDashoffset="11"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <div className="text-[11.5px] tracking-[-0.01em] leading-none whitespace-nowrap">
                        <span className="text-[#d2d3d8] font-normal">{liveDateLabel}</span>
                        <span className="text-white font-semibold ml-1 tabular-nums">
                          {liveTimeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="w-28 h-full flex items-center justify-end pointer-events-auto">
                      {/* Default Music Equalizer */}
                      <div className={`${showEq ? 'flex' : 'hidden'} items-center gap-[2px] h-3.5`}>
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                      </div>
                      {/* Shelf / Clipboard Segmented Pill Switcher */}
                      <div
                        className={`${
                          isShelfOrClipboard ? 'flex' : 'hidden'
                        } items-center bg-[#1C1D21] border border-white/[0.06] rounded-full p-[2px]`}
                      >
                        <button
                          onClick={() => switchMode('Shelf')}
                          title="Shelf"
                          className={`px-2 py-[2px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            displayMode === 'Shelf'
                              ? 'bg-[#5B5CE6] text-white shadow-sm'
                              : 'text-[#8e9099] hover:text-white'
                          }`}
                        >
                          <svg
                            width="10.5"
                            height="10.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => switchMode('Clipboard')}
                          title="Clipboard"
                          className={`px-2 py-[2px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            displayMode === 'Clipboard'
                              ? 'bg-[#5B5CE6] text-white shadow-sm'
                              : 'text-[#8e9099] hover:text-white'
                          }`}
                        >
                          <svg
                            width="10.5"
                            height="10.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic View Container */}
                  <div
                    className={`notch-content-view ${morphHidden ? 'morphing-hidden' : ''}`}
                    style={
                      {
                        '--slide-x': slideX,
                        '--slide-y': slideY,
                      } as React.CSSProperties
                    }
                  >
                    {renderContent()}
                  </div>

                  {/* Persistent Sliding Pagination Bar across all 7 Expanded Pages */}
                  <div
                    className={`persistent-pagination-bar ${
                      persistentHeaderHidden ? 'morphing-hidden' : ''
                    }`}
                  >
                    <div className="pagination-track">
                      {EXPANDED_MODES.map((page, i) => (
                        <button
                          key={page}
                          onClick={(e) => {
                            e.stopPropagation();
                            switchMode(page);
                          }}
                          className={`page-dot-btn ${
                            activePaginationPage === page ? 'active' : ''
                          }`}
                          title={`${i + 1} · ${page}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right-Edge Vertical AI Usage Dynamic Dock & Floating Usage Popover */}
            <div className="side-dock-wrapper">
              {/* Floating Usage Popover Card — Single persistent shell that glides fluidly between gauges */}
              <AnimatePresence>
                {activeUsageModelId &&
                  (() => {
                    const activeModel =
                      AI_USAGE_MODELS.find((m) => m.id === activeUsageModelId) ||
                      AI_USAGE_MODELS[0];
                    return (
                      <motion.div
                        ref={usagePopoverRef}
                        key="fluid-usage-popover-shell"
                        initial={{
                          opacity: 0,
                          x: 24,
                          scaleX: 0.42,
                          scaleY: 0.68,
                          y: activeModel.dockOffsetY,
                          filter: 'blur(6px)',
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scaleX: 1,
                          scaleY: 1,
                          y: activeModel.dockOffsetY,
                          filter: 'blur(0px)',
                        }}
                        exit={{
                          opacity: 0,
                          x: 22,
                          scaleX: 0.48,
                          scaleY: 0.72,
                          filter: 'blur(5px)',
                          transition: {
                            duration: 0.28,
                            ease: [0.32, 0, 0.67, 0],
                          },
                        }}
                        transition={{
                          y: { type: 'spring', stiffness: 290, damping: 28, mass: 0.85 },
                          x: { type: 'spring', stiffness: 320, damping: 28, mass: 0.8 },
                          scaleX: { type: 'spring', stiffness: 310, damping: 26, mass: 0.8 },
                          scaleY: { type: 'spring', stiffness: 310, damping: 26, mass: 0.8 },
                          opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                          filter: { duration: 0.24, ease: 'easeOut' },
                        }}
                        className="usage-popover-card mr-[14px] -mt-[3px]"
                      >
                        {/* Curved Speech Bubble Pointer Beak pointing to active circular gauge */}
                        <svg
                          className="usage-popover-beak"
                          viewBox="0 0 14 22"
                          fill="none"
                        >
                          <path
                            d="M0 0 C3.5 5.5 7.5 8.5 14 11 C7.5 13.5 3.5 16.5 0 22 Z"
                            fill="#050507"
                          />
                        </svg>

                        {/* Header: Model Icon + Name with subtle crossfade */}
                        <div className="flex items-center justify-between">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div
                              key={activeModel.id}
                              initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
                              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, y: -3, filter: 'blur(2px)' }}
                              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                              className="flex items-center gap-1.5"
                            >
                              <AIModelLogo id={activeModel.id} size={14} />
                              <span className="text-[11.5px] font-semibold text-white tracking-[-0.01em] leading-none">
                                {activeModel.name}
                              </span>
                            </motion.div>
                          </AnimatePresence>
                          <button
                            onClick={() => {
                              setHoveredUsageModelId(null);
                              setPinnedUsageModelId(null);
                            }}
                            title="Hide popover"
                            className="w-4 h-4 rounded-full hover:bg-white/10 flex items-center justify-center text-[#7e8089] hover:text-white transition cursor-pointer"
                          >
                            <svg
                              width="7.5"
                              height="7.5"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
                              <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
                            </svg>
                          </button>
                        </div>

                        {/* Section 1: Current session */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[9px] leading-none">
                            <span className="text-[#e2e3e8] font-medium">Current session</span>
                            <motion.span
                              key={`s-reset-${activeModel.id}`}
                              initial={{ opacity: 0.35 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.22 }}
                              className="text-[#7e8089] font-normal"
                            >
                              {activeModel.sessionReset}
                            </motion.span>
                          </div>
                          <div className="w-full h-[4px] rounded-full bg-[#242529] mt-1.5 overflow-hidden">
                            <motion.div
                              initial={false}
                              animate={{
                                width: `${activeModel.sessionPct}%`,
                                backgroundColor: activeModel.sessionColor,
                              }}
                              transition={{
                                width: { type: 'spring', stiffness: 240, damping: 28 },
                                backgroundColor: { duration: 0.28, ease: 'easeInOut' },
                              }}
                              className="h-full rounded-full"
                            />
                          </div>
                          <div className="text-[9px] text-[#d2d3d8] font-normal mt-1 leading-none tabular-nums">
                            {activeModel.sessionPct}% Used
                          </div>
                        </div>

                        {/* Section 2: All models */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[9px] leading-none">
                            <span className="text-[#e2e3e8] font-medium">All models</span>
                            <motion.span
                              key={`a-reset-${activeModel.id}`}
                              initial={{ opacity: 0.35 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.22 }}
                              className="text-[#7e8089] font-normal"
                            >
                              {activeModel.allModelsReset}
                            </motion.span>
                          </div>
                          <div className="w-full h-[4px] rounded-full bg-[#242529] mt-1.5 overflow-hidden">
                            <motion.div
                              initial={false}
                              animate={{
                                width: `${activeModel.allModelsPct}%`,
                                backgroundColor: activeModel.allModelsColor,
                              }}
                              transition={{
                                width: { type: 'spring', stiffness: 240, damping: 28 },
                                backgroundColor: { duration: 0.28, ease: 'easeInOut' },
                              }}
                              className="h-full rounded-full"
                            />
                          </div>
                          <div className="text-[9px] text-[#d2d3d8] font-normal mt-1 leading-none tabular-nums">
                            {activeModel.allModelsPct}% Used
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
              </AnimatePresence>

              {/* Vertical Black Edge Notch Pill */}
              <div ref={sideDockBodyRef} className="side-dock-body">
                <div className="side-dock-ear-top" />
                <div className="side-dock-ear-bottom" />

                {AI_USAGE_MODELS.map((item) => {
                  const r = 15;
                  const circ = 2 * Math.PI * r; // ~94.25
                  const dashOffset = circ - (item.sessionPct / 100) * circ;
                  const isSelected = activeUsageModelId === item.id;

                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        usageGaugeRefs.current[item.id] = el;
                      }}
                      onMouseEnter={() => setHoveredUsageModelId(item.id)}
                      onClick={() =>
                        setPinnedUsageModelId((prev) => (prev === item.id ? null : item.id))
                      }
                      title={`${item.name} (${item.sessionPct}%) — Hover or click to inspect usage`}
                      className="group flex flex-col items-center gap-1 focus:outline-none cursor-pointer"
                    >
                      <div
                        className={`relative w-[36px] h-[36px] flex items-center justify-center rounded-full transition-transform duration-200 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                      >
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 36 36"
                          className="-rotate-90 overflow-visible"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r={r}
                            stroke="#232429"
                            strokeWidth="2.8"
                            fill="none"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r={r}
                            stroke={item.sessionColor}
                            strokeWidth="2.8"
                            strokeDasharray={circ}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            fill="none"
                            style={{
                              filter: isSelected
                                ? `drop-shadow(0 0 5px ${item.sessionColor}88)`
                                : undefined,
                              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <AIModelLogo id={item.id} size={15} />
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium tracking-[-0.01em] leading-none tabular-nums transition-colors ${
                          isSelected ? 'text-white font-semibold' : 'text-[#e2e3e8]'
                        }`}
                      >
                        {item.sessionPct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="spec-label">
        15.6&Prime; display &middot; Press{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10.5px]">
          &larr;
        </kbd>{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10.5px]">
          &rarr;
        </kbd>{' '}
        Arrow Keys to cycle widget pages &middot;{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10.5px]">
          Space
        </kbd>{' '}
        Play/Pause &middot;{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10.5px]">
          Esc
        </kbd>{' '}
        Resting
      </div>

      <div className="w-full max-w-4xl px-4 mt-2 z-30 flex flex-col items-center gap-2.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ROW_1_MODES.map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`mode-pill ${mode === m ? 'active' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 opacity-85">
          {ROW_2_MODES.map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`mode-pill ${mode === m ? 'active' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-[#9ea0aa] mt-0.5 tracking-[-0.01em] text-center min-h-[18px]">
          {caption}
        </p>
      </div>
    </div>
  );
}

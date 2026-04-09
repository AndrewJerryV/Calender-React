import { CSSProperties, ReactNode, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import "./InteractiveWallCalendar.css";

type MonthTheme = {
  accent: string;
  accentSoft: string;
  accentMuted: string;
  ink: string;
  subtitle: string;
  heroUrl: string;
};

type TurnDirection = "next" | "prev";

type TurnPagesState = {
  firstMonth: Date;
  secondMonth: Date;
  startPage: 1 | 2;
  command: "next" | "previous";
};

type HolidayIconName =
  | "spark"
  | "heart"
  | "clover"
  | "leaf"
  | "flag"
  | "pumpkin"
  | "gift";

type HolidayDefinition = {
  label: string;
  icon: HolidayIconName;
  tone: "gold" | "rose" | "green" | "blue" | "orange";
};

type DayCell = {
  date: Date;
  key: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  holiday?: HolidayDefinition;
};

type InteractiveWallCalendarProps = {
  themeToggle?: ReactNode;
};

const MONTH_THEMES: MonthTheme[] = [
  {
    accent: "#1a4fa8",
    accentSoft: "#4a87e8",
    accentMuted: "#d0e0f8",
    ink: "#0a1628",
    subtitle: "A blank page awaits",
    heroUrl: "https://cdn.pixabay.com/animation/2023/05/01/21/13/21-13-03-72_512.gif"
  },
  {
    accent: "#b83a6a",
    accentSoft: "#e06090",
    accentMuted: "#fce0eb",
    ink: "#35101f",
    subtitle: "Love is in the details",
    heroUrl: "https://i.pinimg.com/originals/12/ea/73/12ea73a39c688ace20479d4806c11ff4.gif"
  },
  {
    accent: "#1a7a55",
    accentSoft: "#3ab882",
    accentMuted: "#d0f0e4",
    ink: "#0d2e1f",
    subtitle: "Momentum climbs with daylight",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/8559734e-tumblr_ng88k4nd8u1tv1qiho1_1280.gif"
  },
  {
    accent: "#6b3fa0",
    accentSoft: "#a070e0",
    accentMuted: "#ecddf8",
    ink: "#1e0e30",
    subtitle: "Fresh air and new beginnings",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/c553b1b1-tumblr_njzjlss9h71tv1qiho1_1280.gif"
  },
  {
    accent: "#c24b1a",
    accentSoft: "#f07040",
    accentMuted: "#fde0d4",
    ink: "#35130a",
    subtitle: "Long days, bigger milestones",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/696417d3-giphy.gif"
  },
  {
    accent: "#0e8a7a",
    accentSoft: "#28c4aa",
    accentMuted: "#cdf4ee",
    ink: "#072e28",
    subtitle: "Peak season for ambitious goals",
    heroUrl: "https://i.pinimg.com/originals/1e/b4/0e/1eb40e8f6c568d75f45bcb41ad97bdf9.gif"
  },
  {
    accent: "#1055a8",
    accentSoft: "#3484e8",
    accentMuted: "#d4e6f8",
    ink: "#0a1e38",
    subtitle: "Fast trails, clear skies",
    heroUrl: "https://cdn.pixabay.com/animation/2023/05/01/21/13/21-13-03-72_512.gif"
  },
  {
    accent: "#a06010",
    accentSoft: "#e09030",
    accentMuted: "#faecd4",
    ink: "#2e1a04",
    subtitle: "Golden hours, focused routines",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/1a7ea362-tumblr_nbvjod9sci1tv1qiho1_1280.gif"
  },
  {
    accent: "#8a2a2a",
    accentSoft: "#c85050",
    accentMuted: "#f8dada",
    ink: "#2a0c0c",
    subtitle: "Crisp air, measured progress",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/b6a58d41-tumblr_inline_naqd6dfw4e1sbo4ov.gif"
  },
  {
    accent: "#7a4a10",
    accentSoft: "#c07820",
    accentMuted: "#f8ead4",
    ink: "#241604",
    subtitle: "Warm tones, intentional pacing",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/966f5604-tumblr_ndt129bbhm1tv1qiho1_1280.gif"
  },
  {
    accent: "#3a5a7a",
    accentSoft: "#6090b8",
    accentMuted: "#d8e8f4",
    ink: "#101c28",
    subtitle: "Last climb before winter reset",
    heroUrl: "https://i.pinimg.com/originals/1e/b4/0e/1eb40e8f6c568d75f45bcb41ad97bdf9.gif"
  },
  {
    accent: "#1a3a6a",
    accentSoft: "#4070b8",
    accentMuted: "#d0dcf4",
    ink: "#08121e",
    subtitle: "Wrap up strong, reflect deeper",
    heroUrl: "https://www.greenpeace.org.au/static/planet4-australiapacific-stateless/2024/02/1a7ea362-tumblr_nbvjod9sci1tv1qiho1_1280.gif"
  }
];

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const HOLIDAY_BY_MONTH_DAY: Record<string, HolidayDefinition> = {
  "01-01": { label: "New Year", icon: "spark", tone: "gold" },
  "02-14": { label: "Valentine's", icon: "heart", tone: "rose" },
  "03-17": { label: "St. Patrick's", icon: "clover", tone: "green" },
  "04-22": { label: "Earth Day", icon: "leaf", tone: "green" },
  "07-04": { label: "Independence", icon: "flag", tone: "blue" },
  "10-31": { label: "Halloween", icon: "pumpkin", tone: "orange" },
  "12-25": { label: "Christmas", icon: "gift", tone: "gold" }
};

const STORAGE_MONTH_NOTES = "wall-calendar-month-notes-v1";
const STORAGE_RANGE_NOTES = "wall-calendar-range-notes-v1";
const PAGE_TURN_DURATION_MS = 700;
const HERO_CROSSFADE_MS = 620;
const MOBILE_TURN_BREAKPOINT = 980;
const USE_TURN_JS = false;
const DEFAULT_HERO_IMAGE = "/calendar-default-hero.svg";
const JQUERY_SCRIPT_ID = "wall-calendar-jquery";
const TURNJS_SCRIPT_ID = "wall-calendar-turnjs";
const JQUERY_SRC = "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js";
const TURNJS_SOURCES = [
  "https://cdn.jsdelivr.net/gh/blasten/turn.js@master/turn.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js"
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shiftMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatShortDate(key: string): string {
  return dateFromKey(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function formatLongDate(key: string): string {
  return dateFromKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function normalizeRange(first: string, second: string): { from: string; to: string } {
  return first <= second ? { from: first, to: second } : { from: second, to: first };
}

function createSelectionKey(from: string, to: string): string {
  return from === to ? from : `${from}__${to}`;
}

function dayCountInclusive(from: string, to: string): number {
  const start = dateFromKey(from).getTime();
  const end = dateFromKey(to).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function loadRecord(storageKey: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sanitized: Record<string, string> = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === "string") sanitized[key] = value;
    });
    return sanitized;
  } catch {
    return {};
  }
}

function getThemeForMonth(date: Date): MonthTheme {
  return MONTH_THEMES[date.getMonth()];
}

function getHeroUrlFromMonth(date: Date): string {
  return getThemeForMonth(date).heroUrl;
}

function patchBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (!img.src.endsWith(DEFAULT_HERO_IMAGE)) img.src = DEFAULT_HERO_IMAGE;
}

async function loadExternalScript(scriptId: string, sourceUrl: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (document.getElementById(scriptId)) return;
  await new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.id = scriptId;
    tag.src = sourceUrl;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => { tag.remove(); reject(new Error(`Failed: ${sourceUrl}`)); };
    document.head.appendChild(tag);
  });
}

function HolidayIcon({ name }: { name: HolidayIconName }) {
  if (name === "heart") return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21c-.3 0-.7-.1-.9-.3l-6-5.6A5.6 5.6 0 0 1 4 7.3a5.2 5.2 0 0 1 7.8-.9l.2.2.2-.2a5.2 5.2 0 0 1 7.8.9 5.6 5.6 0 0 1-1.1 7.8l-6 5.6c-.2.2-.6.3-.9.3Z" />
    </svg>
  );
  if (name === "clover") return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="9" r="4" /><circle cx="15" cy="9" r="4" />
      <circle cx="9" cy="15" r="4" /><circle cx="15" cy="15" r="4" />
      <path d="M12 12h1.3c1.8 0 3.4 1.4 3.4 3.2v.3h-3.1c-1.3 0-2.3 1-2.3 2.3V21h-1.5v-3.8c0-2.9 2.3-5.2 5.2-5.2H12Z" />
    </svg>
  );
  if (name === "leaf") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 4c-8.2 0-14 4-14 10 0 3.5 2.5 6 6 6 5.5 0 8-5.8 8-16Z" />
      <path d="M8 14c2.5-.3 4.4-1.6 6.4-4" />
    </svg>
  );
  if (name === "flag") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 3v18" /><path d="M6 4h11l-2.6 3L17 10H6" />
    </svg>
  );
  if (name === "pumpkin") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 6c-4.6 0-8 2.8-8 6.8C4 17 7.4 20 12 20s8-3 8-7.2C20 8.8 16.6 6 12 6Z" />
      <path d="M12 4c0 1.5-.7 2.2-2 3" />
      <path d="M8.5 8.8c.6 2.3.6 6.2 0 9.5M12 8c0 2.3 0 7.8 0 11.7M15.5 8.8c-.6 2.3-.6 6.2 0 9.5" />
    </svg>
  );
  if (name === "gift") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="9" width="18" height="12" rx="2" />
      <path d="M3 13h18M12 9v12" />
      <path d="M12 9h4a2.2 2.2 0 0 0 0-4c-2.2 0-4 1.8-4 4ZM12 9H8a2.2 2.2 0 1 1 0-4c2.2 0 4 1.8 4 4Z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 2.5 2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 8.8l6-.9L12 2.5Z" />
    </svg>
  );
}

function buildMonthCells(currentMonth: Date): DayCell[] {
  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const monthDayKey = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return {
      date,
      key: toDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      holiday: HOLIDAY_BY_MONTH_DAY[monthDayKey]
    };
  });
}

export function InteractiveWallCalendar({ themeToggle }: InteractiveWallCalendarProps) {
  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(now), [now]);
  const fitTargetRef = useRef<HTMLElement | null>(null);
  const turnBookRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_TURN_BREAKPOINT : false
  );
  const [turnViewport, setTurnViewport] = useState<{ width: number; height: number } | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [heroSource, setHeroSource] = useState<string>(() => getHeroUrlFromMonth(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [heroPrevSource, setHeroPrevSource] = useState<string | null>(null);
  const [isHeroCrossfading, setIsHeroCrossfading] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  const [flipDirection, setFlipDirection] = useState<TurnDirection | null>(null);
  const [pendingMonth, setPendingMonth] = useState<Date | null>(null);
  const [turnDirection, setTurnDirection] = useState<TurnDirection | null>(null);
  const [turnFromMonth, setTurnFromMonth] = useState<Date | null>(null);
  const [turnToMonth, setTurnToMonth] = useState<Date | null>(null);
  const [turnJsReady, setTurnJsReady] = useState(false);
  const [monthNotes, setMonthNotes] = useState<Record<string, string>>(() => loadRecord(STORAGE_MONTH_NOTES));
  const [rangeNotes, setRangeNotes] = useState<Record<string, string>>(() => loadRecord(STORAGE_RANGE_NOTES));
  const heroFadeTimerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);


  const monthKey = toMonthKey(currentMonth);
  const theme = getThemeForMonth(currentMonth);
  const dayCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);
  const canUseTurnJs = USE_TURN_JS && turnJsReady && !isMobileView;
  const isAnimatingTurn = flipDirection !== null || turnDirection !== null;

  const turnPages = useMemo<TurnPagesState | null>(() => {
    if (!turnDirection || !turnFromMonth || !turnToMonth) return null;
    if (turnDirection === "next") return { firstMonth: turnFromMonth, secondMonth: turnToMonth, startPage: 1, command: "next" };
    return { firstMonth: turnToMonth, secondMonth: turnFromMonth, startPage: 2, command: "previous" };
  }, [turnDirection, turnFromMonth, turnToMonth]);

  const selectedRange = useMemo(() => {
    if (!selectionStart) return null;
    return normalizeRange(selectionStart, selectionEnd ?? selectionStart);
  }, [selectionStart, selectionEnd]);

  const previewRange = useMemo(() => {
    if (!selectionStart || selectionEnd || !hoverDay) return null;
    return normalizeRange(selectionStart, hoverDay);
  }, [selectionStart, selectionEnd, hoverDay]);

  const selectionNoteKey = selectedRange ? createSelectionKey(selectedRange.from, selectedRange.to) : null;

  const selectedSummary = useMemo(() => {
    if (!selectedRange) return "Pick a start day, then choose an end day.";
    if (!selectionEnd) return `Start: ${formatShortDate(selectedRange.from)} — select end day.`;
    const days = dayCountInclusive(selectedRange.from, selectedRange.to);
    if (days === 1) return `${formatShortDate(selectedRange.from)} selected.`;
    return `${formatShortDate(selectedRange.from)} → ${formatShortDate(selectedRange.to)} · ${days} days`;
  }, [selectedRange, selectionEnd]);

  const gridHint = useMemo(() => {
    if (!selectionStart) return null;
    if (!selectionEnd) return "Click end day to complete range";
    if (!selectedRange) return null;
    return `${dayCountInclusive(selectedRange.from, selectedRange.to)} days selected`;
  }, [selectionStart, selectionEnd, selectedRange]);

  const savedMonthRangeNotes = useMemo(() => {
    return Object.entries(rangeNotes)
      .filter(([, t]) => t.trim().length > 0)
      .filter(([k]) => k.startsWith(monthKey))
      .slice(0, 5)
      .map(([key, text]) => {
        const [from, to] = key.includes("__") ? (key.split("__") as [string, string]) : [key, key];
        return { key, from, to, preview: text.trim().slice(0, 56) };
      });
  }, [rangeNotes, monthKey]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_MONTH_NOTES, JSON.stringify(monthNotes));
  }, [monthNotes]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_RANGE_NOTES, JSON.stringify(rangeNotes));
  }, [rangeNotes]);

  useEffect(() => {
    const nextHero = getHeroUrlFromMonth(currentMonth);
    if (nextHero === heroSource) return;
    if (heroFadeTimerRef.current !== null) {
      window.clearTimeout(heroFadeTimerRef.current);
      heroFadeTimerRef.current = null;
    }
    setHeroPrevSource(heroSource);
    setHeroSource(nextHero);
    setIsHeroCrossfading(true);
    heroFadeTimerRef.current = window.setTimeout(() => {
      setHeroPrevSource(null);
      setIsHeroCrossfading(false);
      heroFadeTimerRef.current = null;
    }, HERO_CROSSFADE_MS);
  }, [currentMonth, heroSource]);

  useEffect(() => {
    return () => {
      if (heroFadeTimerRef.current !== null) {
        window.clearTimeout(heroFadeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !USE_TURN_JS) return;
    let cancelled = false;
    const init = async () => {
      try {
        const w = window as Window & { jQuery?: { fn?: { turn?: (...a: unknown[]) => unknown } } };
        if (!w.jQuery) await loadExternalScript(JQUERY_SCRIPT_ID, JQUERY_SRC);
        if (!w.jQuery?.fn?.turn) {
          let loaded = false;
          for (const src of TURNJS_SOURCES) {
            try { await loadExternalScript(TURNJS_SCRIPT_ID, src); loaded = true; break; } catch { /* try next */ }
          }
          if (!loaded) throw new Error("Turn.js failed");
        }
        if (!cancelled && w.jQuery?.fn?.turn) setTurnJsReady(true);
      } catch { if (!cancelled) setTurnJsReady(false); }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!canUseTurnJs || !turnPages || !turnToMonth || !turnBookRef.current) return;
    const w = window as Window & {
      jQuery?: ((n: unknown) => { data: (k: string) => unknown; turn: (...a: unknown[]) => unknown }) & { fn?: { turn?: (...a: unknown[]) => unknown } };
    };
    if (!w.jQuery?.fn?.turn) return;
    const node = turnBookRef.current;
    const rect = node.getBoundingClientRect();
    const $book = w.jQuery(node);
    try { if ($book.data("turn")) $book.turn("destroy"); } catch { /* ignore */ }
    let raf = 0, timeout = 0;
    try {
      $book.turn({ width: Math.max(1, Math.round(rect.height)), height: Math.max(1, Math.round(rect.width)), display: "single", autoCenter: false, duration: PAGE_TURN_DURATION_MS, gradients: true, elevation: 28, acceleration: true });
      $book.turn("display", "single");
      $book.turn("page", turnPages.startPage);
      raf = window.requestAnimationFrame(() => { $book.turn(turnPages.command); });
      timeout = window.setTimeout(() => {
        setCurrentMonth(turnToMonth); setTurnDirection(null); setTurnFromMonth(null); setTurnToMonth(null); setTurnViewport(null);
      }, PAGE_TURN_DURATION_MS + 60);
    } catch {
      setFlipDirection(turnDirection); setCurrentMonth(turnToMonth); setTurnDirection(null); setTurnFromMonth(null); setTurnToMonth(null); setTurnViewport(null);
    }
    return () => {
      window.cancelAnimationFrame(raf); window.clearTimeout(timeout);
      try { if ($book.data("turn")) $book.turn("destroy"); } catch { /* ignore */ }
    };
  }, [canUseTurnJs, turnDirection, turnPages, turnToMonth]);

  useEffect(() => {
    if (canUseTurnJs || !turnDirection || !turnToMonth) return;
    setTurnDirection(null); setTurnFromMonth(null); setTurnToMonth(null); setTurnViewport(null); setCurrentMonth(turnToMonth);
  }, [canUseTurnJs, turnDirection, turnToMonth]);

  useEffect(() => {
    if (!flipDirection) return;
    const monthSwapDelay = Math.round(PAGE_TURN_DURATION_MS * 0.46);
    const swapTimer = window.setTimeout(() => {
      if (pendingMonth) setCurrentMonth(pendingMonth);
    }, monthSwapDelay);
    const finishTimer = window.setTimeout(() => {
      setFlipDirection(null);
      setPendingMonth(null);
    }, PAGE_TURN_DURATION_MS);
    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(finishTimer);
    };
  }, [flipDirection, pendingMonth]);

  useEffect(() => {
    if (typeof window === "undefined" || !fitTargetRef.current) return;
    const node = fitTargetRef.current;
    const compute = () => {
      const w = node.offsetWidth, h = node.offsetHeight;
      if (!w || !h) return;
      const mobile = window.innerWidth <= MOBILE_TURN_BREAKPOINT;
      setIsMobileView(mobile);
      if (mobile) { setFitScale(1); return; }
      const aw = Math.max(window.innerWidth - 20, 240);
      const ah = Math.max(window.innerHeight - 20, 240);
      const raw = Math.min(1, aw / w, ah / h);
      const rounded = Math.floor(raw * 1000) / 1000;
      setFitScale(prev => Math.abs(prev - rounded) > 0.003 ? rounded : prev);
    };
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(node);
    window.addEventListener("resize", compute);
    return () => { obs.disconnect(); window.removeEventListener("resize", compute); };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    if (!isMobileView) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isMobileView || touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Reset refs
    touchStartX.current = null;
    touchStartY.current = null;

    // Only trigger if it's primarily a horizontal swipe
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40) {
      if (deltaX > 0) {
        handleMonthShift(-1); // Swipe Right -> Previous Month
      } else {
        handleMonthShift(1); // Swipe Left -> Next Month
      }
    }
  }


  function handleMonthShift(amount: number) {
    if (isAnimatingTurn) return;
    const direction: TurnDirection = amount > 0 ? "next" : "prev";
    const target = shiftMonth(currentMonth, amount);
    setSelectionStart(null); setSelectionEnd(null); setHoverDay(null);
    if (canUseTurnJs) {
      const rect = fitTargetRef.current?.getBoundingClientRect();
      if (rect) setTurnViewport({ width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) });
      setTurnFromMonth(currentMonth); setTurnToMonth(target); setTurnDirection(direction);
      return;
    }
    setPendingMonth(target);
    setFlipDirection(direction);
  }

  function handleDayClick(day: DayCell) {
    if (!day.isCurrentMonth) return;
    if (!selectionStart) {
      setSelectionStart(day.key); setSelectionEnd(null); setHoverDay(null);
      return;
    }

    if (!selectionEnd) {
      if (day.key === selectionStart) {
        clearSelection();
        return;
      }
      const norm = normalizeRange(selectionStart, day.key);
      setSelectionStart(norm.from); setSelectionEnd(norm.to); setHoverDay(null);
      return;
    }

    if (selectionStart === selectionEnd && day.key === selectionStart) {
      clearSelection();
      return;
    }

    setSelectionStart(day.key); setSelectionEnd(null); setHoverDay(null);
  }

  function clearSelection() {
    setSelectionStart(null); setSelectionEnd(null); setHoverDay(null);
  }

  function removeRangeNote(noteKey: string) {
    setRangeNotes(prev => {
      if (!(noteKey in prev)) return prev;
      const next = { ...prev };
      delete next[noteKey];
      return next;
    });
    if (selectionNoteKey === noteKey) {
      setSelectionStart(null);
      setSelectionEnd(null);
      setHoverDay(null);
    }
  }

  function clearMonthSavedNotes() {
    setRangeNotes(prev => {
      const keysToRemove = Object.keys(prev).filter(key => key.startsWith(monthKey));
      if (keysToRemove.length === 0) return prev;
      const next = { ...prev };
      keysToRemove.forEach(key => { delete next[key]; });
      return next;
    });
    if (selectionNoteKey?.startsWith(monthKey)) {
      setSelectionStart(null);
      setSelectionEnd(null);
      setHoverDay(null);
    }
  }

  function jumpToToday() {
    const today = new Date();
    const key = toDateKey(today);
    if (!isAnimatingTurn) setFlipDirection("next");
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectionStart(key); setSelectionEnd(key); setHoverDay(null);
  }

  function renderTurnPreview(month: Date) {
    const t = getThemeForMonth(month);
    const days = buildMonthCells(month);
    const style = { "--turn-accent": t.accent, "--turn-accent-soft": t.accentSoft } as CSSProperties;
    return (
      <div className="turnjs-page-face is-vertical-turn" style={style}>
        <div className="turnjs-preview-hero">
          <img className="turnjs-page-image" src={getHeroUrlFromMonth(month)} alt="" onError={patchBrokenImage} />
          <div className="turnjs-page-image-shade" />
          <div className="turnjs-page-ribbon" />
          <div className="turnjs-page-label">
            <span>{month.getFullYear()}</span>
            <strong>{month.toLocaleDateString("en-US", { month: "long" }).toUpperCase()}</strong>
          </div>
        </div>
        <div className="turnjs-preview-body">
          <div className="turnjs-preview-notes">
            <h4>Notes</h4>
            {Array.from({ length: 10 }, (_, i) => <span key={i} className="turnjs-preview-note-line" />)}
          </div>
          <div className="turnjs-preview-grid">
            <p>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            <div className="turnjs-preview-weekdays">
              {WEEKDAY_LABELS.map((l, i) => <span key={l} className={i >= 5 ? "is-weekend" : undefined}>{l}</span>)}
            </div>
            <div className="turnjs-preview-days">
              {days.map(day => {
                const dow = day.date.getDay();
                const className = ["turnjs-preview-day", !day.isCurrentMonth ? "is-outside" : "", (dow === 0 || dow === 6) ? "is-weekend" : ""].filter(Boolean).join(" ");
                return <span key={toDateKey(day.date)} className={className}>{day.dayNumber}</span>;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const styleVars = {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--accent-muted": theme.accentMuted,
    "--hero-fade-duration": `${HERO_CROSSFADE_MS}ms`,
    "--ink-900": theme.ink,
    "--turn-duration": `${PAGE_TURN_DURATION_MS}ms`,
    "--fit-scale": `${fitScale}`
  } as CSSProperties;

  return (
    <section className="wall-calendar" style={styleVars}>
      {themeToggle ? <div className="calendar-theme-toggle-slot">{themeToggle}</div> : null}
      <div className="calendar-fit-frame">
        <div className="calendar-fit-content">
          <article
            ref={fitTargetRef}
            className={`calendar-sheet ${flipDirection ? `is-flipping-${flipDirection}` : ""}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {canUseTurnJs && turnPages ? (
              <div
                className={`turnjs-overlay is-active is-${turnDirection}`}
                aria-hidden="true"
                style={turnViewport ? ({
                  "--turn-preview-width": `${turnViewport.width}px`,
                  "--turn-preview-height": `${turnViewport.height}px`
                } as CSSProperties) : undefined}
              >
                <div ref={turnBookRef} className="turnjs-book is-vertical-turn">
                  <div className="turnjs-page">{renderTurnPreview(turnPages.firstMonth)}</div>
                  <div className="turnjs-page">{renderTurnPreview(turnPages.secondMonth)}</div>
                </div>
              </div>
            ) : null}

            {/* Hero Panel */}
            <header className="hero-panel">
              <div className={`hero-image-stack ${isHeroCrossfading ? "is-crossfading" : ""}`}>
                {heroPrevSource ? (
                  <img
                    className="hero-image hero-image-prev"
                    src={heroPrevSource}
                    alt=""
                    aria-hidden="true"
                    onError={patchBrokenImage}
                  />
                ) : null}
              <img
                className="hero-image hero-image-current"
                src={heroSource}
                alt={`${monthLabel} landscape`}
                onError={(e) => {
                  if (!e.currentTarget.src.endsWith(DEFAULT_HERO_IMAGE)) setHeroSource(DEFAULT_HERO_IMAGE);
                }}
              />
              </div>
              <div className="hero-gradient" />
              <div className="hero-scallop" aria-hidden="true" />

              {/* Month Navigation */}
              <div className="month-controls" aria-label="Month navigation">
                <button type="button" onClick={() => handleMonthShift(-1)} aria-label="Previous month" disabled={isAnimatingTurn} className="nav-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button type="button" onClick={() => handleMonthShift(1)} aria-label="Next month" disabled={isAnimatingTurn} className="nav-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Month Title on Hero */}
              <div className="hero-title-block">
                <span className="hero-year">{currentMonth.getFullYear()}</span>
                <h1 className="hero-month-name">
                  {currentMonth.toLocaleDateString("en-US", { month: "long" })}
                </h1>
                <p className="hero-subtitle">{theme.subtitle}</p>
              </div>
            </header>

            {/* Calendar Body */}
            <div className="calendar-main">
              {/* Notes Column */}
              <aside className="notes-column">
                <div className="notes-header">
                  <svg className="notes-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="12" y2="17" />
                  </svg>
                  <h2>Notes</h2>
                </div>
                <p className="notes-sub">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

                <textarea
                  className="lined-textarea"
                  value={monthNotes[monthKey] ?? ""}
                  onChange={(e) => setMonthNotes(prev => ({ ...prev, [monthKey]: e.target.value }))}
                  placeholder="Goals, reminders, ideas for this month..."
                  aria-label="Monthly notes"
                />

                <div className="selection-card">
                  <div className="selection-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h3>Range Memo</h3>
                  </div>
                  <p className="selection-summary">{selectedSummary}</p>

                  <textarea
                    className={`lined-textarea range-memo-textarea ${savedMonthRangeNotes.length > 0 ? "is-compact" : ""}`}
                    value={selectionNoteKey ? rangeNotes[selectionNoteKey] ?? "" : ""}
                    onChange={(e) => {
                      if (!selectionNoteKey) return;
                      setRangeNotes(prev => ({ ...prev, [selectionNoteKey]: e.target.value }));
                    }}
                    placeholder={selectionNoteKey ? "Attach a note to this range..." : "Select a date or range first."}
                    disabled={!selectionNoteKey}
                    aria-label="Date range note"
                  />

                  <div className="selection-actions">
                    <button type="button" className="btn-ghost" onClick={clearSelection}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Clear
                    </button>
                    <button type="button" className="btn-primary" onClick={jumpToToday}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Today
                    </button>
                  </div>
                </div>

                {savedMonthRangeNotes.length > 0 && (
                  <div className="saved-notes">
                    <div className="saved-notes-header-row">
                      <h3 className="saved-notes-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                        Saved This Month
                      </h3>
                      <button type="button" className="saved-notes-clear" onClick={clearMonthSavedNotes}>
                        Clear Month
                      </button>
                    </div>
                    <ul>
                      {savedMonthRangeNotes.map(item => {
                        const label = item.from === item.to
                          ? formatShortDate(item.from)
                          : `${formatShortDate(item.from)} – ${formatShortDate(item.to)}`;
                        return (
                          <li key={item.key} className="saved-note-item">
                            <button
                              type="button"
                              className="saved-note-open"
                              onClick={() => { setSelectionStart(item.from); setSelectionEnd(item.to); }}
                            >
                              <strong>{label}</strong>
                              <span>{item.preview || "Open saved note"}</span>
                            </button>
                            <button
                              type="button"
                              className="saved-note-delete"
                              onClick={() => removeRangeNote(item.key)}
                              aria-label={`Delete saved note for ${label}`}
                              title="Delete saved note"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <rect x="6" y="6" width="12" height="14" rx="2" />
                                <line x1="10" y1="10" x2="10" y2="16" />
                                <line x1="14" y1="10" x2="14" y2="16" />
                              </svg>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </aside>

              {/* Grid Column */}
              <section className="grid-column" aria-label="Calendar date grid">
                <div className="grid-header">
                  <h2 className="grid-month-label">{currentMonth.toLocaleDateString("en-US", { month: "long" })}</h2>
                  {gridHint ? <p className="grid-hint">{gridHint}</p> : null}
                </div>

                <div className="weekday-row">
                  {WEEKDAY_LABELS.map((label, i) => (
                    <span key={label} className={i === 6 ? "is-sunday-header" : i === 5 ? "is-weekend-header" : undefined}>
                      {label}
                    </span>
                  ))}
                </div>

                <div className="day-grid">
                  {dayCells.map(day => {
                    const dow = day.date.getDay();
                    const isSat = dow === 6, isSun = dow === 0;
                    const inSelected = selectedRange && day.key >= selectedRange.from && day.key <= selectedRange.to;
                    const inPreview = previewRange && day.key >= previewRange.from && day.key <= previewRange.to;
                    const isStart = selectedRange && day.key === selectedRange.from;
                    const isEnd = selectedRange && day.key === selectedRange.to;
                    const isToday = day.key === todayKey;

                    const cls = [
                      "day-cell",
                      !day.isCurrentMonth ? "is-outside" : "",
                      day.isCurrentMonth && isSat ? "is-saturday" : "",
                      day.isCurrentMonth && isSun ? "is-sunday" : "",
                      day.holiday ? "is-holiday" : "",
                      inPreview && !inSelected ? "is-preview" : "",
                      inSelected ? "is-in-range" : "",
                      isStart ? "is-start" : "",
                      isEnd ? "is-end" : "",
                      isToday ? "is-today" : ""
                    ].filter(Boolean).join(" ");

                    return (
                      <button
                        key={day.key}
                        type="button"
                        className={cls}
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={() => { if (day.isCurrentMonth) setHoverDay(day.key); }}
                        onMouseLeave={() => setHoverDay(null)}
                        disabled={!day.isCurrentMonth}
                        title={day.holiday ? `${formatLongDate(day.key)} — ${day.holiday.label}` : formatLongDate(day.key)}
                        aria-label={day.holiday ? `${formatLongDate(day.key)}, ${day.holiday.label}` : formatLongDate(day.key)}
                      >
                        <span className="day-number">{day.dayNumber}</span>
                        {isToday && <span className="today-dot" aria-hidden="true" />}
                        {day.holiday && (
                          <>
                            <span className={`holiday-badge tone-${day.holiday.tone}`} aria-hidden="true">
                              <HolidayIcon name={day.holiday.icon} />
                            </span>
                            <span className={`holiday-label tone-${day.holiday.tone}`} aria-hidden="true">
                              {day.holiday.label}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
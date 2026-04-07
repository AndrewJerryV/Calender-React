import { CSSProperties, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import "./InteractiveWallCalendar.css";

type MonthTheme = {
  accent: string;
  accentSoft: string;
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

const MONTH_THEMES: MonthTheme[] = [
  {
    accent: "#0b88bd",
    accentSoft: "#24b3e3",
    ink: "#10293f",
    subtitle: "High altitude planning season",
    heroUrl:
      "https://images.unsplash.com/photo-1549888834-7c9815a98f36?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#157090",
    accentSoft: "#34a8c9",
    ink: "#0f2d3d",
    subtitle: "Cold mornings, clear focus",
    heroUrl:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#0a7f8a",
    accentSoft: "#32b6bd",
    ink: "#103138",
    subtitle: "Momentum climbs with daylight",
    heroUrl:
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#177f6a",
    accentSoft: "#43bf95",
    ink: "#12352f",
    subtitle: "Fresh air and sharper execution",
    heroUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#2c8a49",
    accentSoft: "#66cb7f",
    ink: "#1f3a2a",
    subtitle: "Long days, bigger milestones",
    heroUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#3fae86",
    accentSoft: "#5cc7a4",
    ink: "#1c3a31",
    subtitle: "Peak season for ambitious goals",
    heroUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#1f7e95",
    accentSoft: "#3eb3c7",
    ink: "#183341",
    subtitle: "Fast trails, clean execution",
    heroUrl:
      "https://images.unsplash.com/photo-1455218873509-8097305ee378?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#216d97",
    accentSoft: "#48a4ce",
    ink: "#173146",
    subtitle: "Blue skies and focused routines",
    heroUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#3b7f67",
    accentSoft: "#6db997",
    ink: "#22382f",
    subtitle: "Crips air, measured progress",
    heroUrl:
      "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#8f6b2d",
    accentSoft: "#d09f4b",
    ink: "#3e311b",
    subtitle: "Warm tones, intentional pacing",
    heroUrl:
      "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#8a5a3a",
    accentSoft: "#d28756",
    ink: "#3c2619",
    subtitle: "Last climb before winter reset",
    heroUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80"
  },
  {
    accent: "#385e84",
    accentSoft: "#6694c7",
    ink: "#1d2f44",
    subtitle: "Wrap up strong and reflect",
    heroUrl:
      "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1600&q=80"
  }
];

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const HOLIDAY_BY_MONTH_DAY: Record<string, HolidayDefinition> = {
  "01-01": { label: "New Year", icon: "spark", tone: "gold" },
  "02-14": { label: "Valentine", icon: "heart", tone: "rose" },
  "03-17": { label: "St Patrick", icon: "clover", tone: "green" },
  "04-22": { label: "Earth Day", icon: "leaf", tone: "green" },
  "07-04": { label: "Independence Day", icon: "flag", tone: "blue" },
  "10-31": { label: "Halloween", icon: "pumpkin", tone: "orange" },
  "12-25": { label: "Christmas", icon: "gift", tone: "gold" }
};

const STORAGE_MONTH_NOTES = "wall-calendar-month-notes-v1";
const STORAGE_RANGE_NOTES = "wall-calendar-range-notes-v1";
const PAGE_TURN_DURATION_MS = 700;
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
  if (first <= second) {
    return { from: first, to: second };
  }

  return { from: second, to: first };
}

function createSelectionKey(from: string, to: string): string {
  if (from === to) {
    return from;
  }

  return `${from}__${to}`;
}

function dayCountInclusive(from: string, to: string): number {
  const start = dateFromKey(from).getTime();
  const end = dateFromKey(to).getTime();
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return diff + 1;
}

function loadRecord(storageKey: string): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sanitized: Record<string, string> = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === "string") {
        sanitized[key] = value;
      }
    });

    return sanitized;
  } catch {
    return {};
  }
}

function getThemeForMonth(date: Date): MonthTheme {
  return MONTH_THEMES[date.getMonth()];
}

function monthLabelUpper(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
}

function getHeroUrlFromMonth(date: Date): string {
  return getThemeForMonth(date).heroUrl;
}

function patchBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  const imageElement = event.currentTarget;

  if (!imageElement.src.endsWith(DEFAULT_HERO_IMAGE)) {
    imageElement.src = DEFAULT_HERO_IMAGE;
  }
}

async function loadExternalScript(scriptId: string, sourceUrl: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (document.getElementById(scriptId)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const scriptTag = document.createElement("script");
    scriptTag.id = scriptId;
    scriptTag.src = sourceUrl;
    scriptTag.async = true;
    scriptTag.onload = () => resolve();
    scriptTag.onerror = () => {
      scriptTag.remove();
      reject(new Error(`Failed to load script ${sourceUrl}`));
    };
    document.head.appendChild(scriptTag);
  });
}

function HolidayIcon({ name }: { name: HolidayIconName }) {
  if (name === "heart") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21c-.3 0-.7-.1-.9-.3l-6-5.6A5.6 5.6 0 0 1 4 7.3a5.2 5.2 0 0 1 7.8-.9l.2.2.2-.2a5.2 5.2 0 0 1 7.8.9 5.6 5.6 0 0 1-1.1 7.8l-6 5.6c-.2.2-.6.3-.9.3Z" />
      </svg>
    );
  }

  if (name === "clover") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="9" r="4" />
        <circle cx="15" cy="9" r="4" />
        <circle cx="9" cy="15" r="4" />
        <circle cx="15" cy="15" r="4" />
        <path d="M12 12h1.3c1.8 0 3.4 1.4 3.4 3.2v.3h-3.1c-1.3 0-2.3 1-2.3 2.3V21h-1.5v-3.8c0-2.9 2.3-5.2 5.2-5.2H12Z" />
      </svg>
    );
  }

  if (name === "leaf") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20 4c-8.2 0-14 4-14 10 0 3.5 2.5 6 6 6 5.5 0 8-5.8 8-16Z" />
        <path d="M8 14c2.5-.3 4.4-1.6 6.4-4" />
      </svg>
    );
  }

  if (name === "flag") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 3v18" />
        <path d="M6 4h11l-2.6 3L17 10H6" />
      </svg>
    );
  }

  if (name === "pumpkin") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 6c-4.6 0-8 2.8-8 6.8C4 17 7.4 20 12 20s8-3 8-7.2C20 8.8 16.6 6 12 6Z" />
        <path d="M12 4c0 1.5-.7 2.2-2 3" />
        <path d="M8.5 8.8c.6 2.3.6 6.2 0 9.5M12 8c0 2.3 0 7.8 0 11.7M15.5 8.8c-.6 2.3-.6 6.2 0 9.5" />
      </svg>
    );
  }

  if (name === "gift") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="9" width="18" height="12" rx="2" />
        <path d="M3 13h18M12 9v12" />
        <path d="M12 9h4a2.2 2.2 0 0 0 0-4c-2.2 0-4 1.8-4 4ZM12 9H8a2.2 2.2 0 1 1 0-4c2.2 0 4 1.8 4 4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 2.5 2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 8.8l6-.9L12 2.5Z" />
    </svg>
  );
}

function buildMonthCells(currentMonth: Date): DayCell[] {
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

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

export function InteractiveWallCalendar() {
  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(now), [now]);
  const fitTargetRef = useRef<HTMLElement | null>(null);
  const turnBookRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_TURN_BREAKPOINT : false
  );
  const [turnViewport, setTurnViewport] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [heroSource, setHeroSource] = useState<string>(() =>
    getHeroUrlFromMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  const [flipDirection, setFlipDirection] = useState<TurnDirection | null>(null);
  const [turnDirection, setTurnDirection] = useState<TurnDirection | null>(null);
  const [turnFromMonth, setTurnFromMonth] = useState<Date | null>(null);
  const [turnToMonth, setTurnToMonth] = useState<Date | null>(null);
  const [turnJsReady, setTurnJsReady] = useState(false);

  const [monthNotes, setMonthNotes] = useState<Record<string, string>>(() =>
    loadRecord(STORAGE_MONTH_NOTES)
  );
  const [rangeNotes, setRangeNotes] = useState<Record<string, string>>(() =>
    loadRecord(STORAGE_RANGE_NOTES)
  );

  const monthKey = toMonthKey(currentMonth);
  const theme = getThemeForMonth(currentMonth);
  const dayCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);
  const canUseTurnJs = USE_TURN_JS && turnJsReady && !isMobileView;
  const isAnimatingTurn = flipDirection !== null || turnDirection !== null;

  const turnPages = useMemo<TurnPagesState | null>(() => {
    if (!turnDirection || !turnFromMonth || !turnToMonth) {
      return null;
    }

    if (turnDirection === "next") {
      return {
        firstMonth: turnFromMonth,
        secondMonth: turnToMonth,
        startPage: 1,
        command: "next"
      };
    }

    return {
      firstMonth: turnToMonth,
      secondMonth: turnFromMonth,
      startPage: 2,
      command: "previous"
    };
  }, [turnDirection, turnFromMonth, turnToMonth]);

  const selectedRange = useMemo(() => {
    if (!selectionStart) {
      return null;
    }

    const endKey = selectionEnd ?? selectionStart;
    return normalizeRange(selectionStart, endKey);
  }, [selectionStart, selectionEnd]);

  const previewRange = useMemo(() => {
    if (!selectionStart || selectionEnd || !hoverDay) {
      return null;
    }

    return normalizeRange(selectionStart, hoverDay);
  }, [selectionStart, selectionEnd, hoverDay]);

  const selectionNoteKey = selectedRange
    ? createSelectionKey(selectedRange.from, selectedRange.to)
    : null;

  const selectedSummary = useMemo(() => {
    if (!selectedRange) {
      return "Pick a start day, then choose an end day.";
    }

    if (!selectionEnd) {
      return `Start: ${formatShortDate(selectedRange.from)}. Select the end day.`;
    }

    const totalDays = dayCountInclusive(selectedRange.from, selectedRange.to);

    if (totalDays === 1) {
      return `${formatShortDate(selectedRange.from)} selected.`;
    }

    return `${formatShortDate(selectedRange.from)} to ${formatShortDate(
      selectedRange.to
    )} (${totalDays} days).`;
  }, [selectedRange, selectionEnd]);

  const savedMonthRangeNotes = useMemo(() => {
    return Object.entries(rangeNotes)
      .filter(([, text]) => text.trim().length > 0)
      .filter(([key]) => key.startsWith(monthKey))
      .slice(0, 5)
      .map(([key, text]) => {
        const [from, to] = key.includes("__")
          ? (key.split("__") as [string, string])
          : [key, key];

        return {
          key,
          from,
          to,
          preview: text.trim().slice(0, 56)
        };
      });
  }, [rangeNotes, monthKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_MONTH_NOTES, JSON.stringify(monthNotes));
  }, [monthNotes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_RANGE_NOTES, JSON.stringify(rangeNotes));
  }, [rangeNotes]);

  useEffect(() => {
    setHeroSource(getHeroUrlFromMonth(currentMonth));
  }, [currentMonth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!USE_TURN_JS) {
      return;
    }

    let cancelled = false;

    const initializeTurnJs = async () => {
      try {
        const runtimeWindow = window as Window & {
          jQuery?: {
            fn?: {
              turn?: (...args: unknown[]) => unknown;
            };
          };
        };

        if (!runtimeWindow.jQuery) {
          await loadExternalScript(JQUERY_SCRIPT_ID, JQUERY_SRC);
        }

        if (!runtimeWindow.jQuery?.fn?.turn) {
          let loaded = false;

          for (const turnSource of TURNJS_SOURCES) {
            try {
              await loadExternalScript(TURNJS_SCRIPT_ID, turnSource);
              loaded = true;
              break;
            } catch {
              // Try alternate Turn.js source URL.
            }
          }

          if (!loaded) {
            throw new Error("Turn.js failed to load from all sources");
          }
        }

        if (!cancelled && runtimeWindow.jQuery?.fn?.turn) {
          setTurnJsReady(true);
        }
      } catch {
        if (!cancelled) {
          setTurnJsReady(false);
        }
      }
    };

    initializeTurnJs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !canUseTurnJs ||
      !turnPages ||
      !turnToMonth ||
      !turnBookRef.current
    ) {
      return;
    }

    const runtimeWindow = window as Window & {
      jQuery?: ((input: unknown) => {
        data: (key: string) => unknown;
        turn: (...args: unknown[]) => unknown;
      }) & {
        fn?: {
          turn?: (...args: unknown[]) => unknown;
        };
      };
    };

    if (!runtimeWindow.jQuery?.fn?.turn) {
      return;
    }

    const node = turnBookRef.current;
    const rect = node.getBoundingClientRect();
    const $book = runtimeWindow.jQuery(node);
    const turnWidth = Math.max(1, Math.round(rect.height));
    const turnHeight = Math.max(1, Math.round(rect.width));

    try {
      if ($book.data("turn")) {
        $book.turn("destroy");
      }
    } catch {
      // Ignore previous instance cleanup errors.
    }

    let rafHandle = 0;
    let timeoutHandle = 0;

    try {
      $book.turn({
        width: turnWidth,
        height: turnHeight,
        display: "single",
        autoCenter: false,
        duration: PAGE_TURN_DURATION_MS,
        gradients: true,
        elevation: 28,
        acceleration: true
      });

      $book.turn("display", "single");

      $book.turn("page", turnPages.startPage);

      rafHandle = window.requestAnimationFrame(() => {
        $book.turn(turnPages.command);
      });

      timeoutHandle = window.setTimeout(() => {
        setCurrentMonth(turnToMonth);
        setTurnDirection(null);
        setTurnFromMonth(null);
        setTurnToMonth(null);
        setTurnViewport(null);
      }, PAGE_TURN_DURATION_MS + 60);
    } catch {
      setFlipDirection(turnDirection);
      setCurrentMonth(turnToMonth);
      setTurnDirection(null);
      setTurnFromMonth(null);
      setTurnToMonth(null);
      setTurnViewport(null);
    }

    return () => {
      window.cancelAnimationFrame(rafHandle);
      window.clearTimeout(timeoutHandle);

      try {
        if ($book.data("turn")) {
          $book.turn("destroy");
        }
      } catch {
        // Ignore teardown errors from plugin internals.
      }
    };
  }, [canUseTurnJs, turnDirection, turnPages, turnToMonth]);

  useEffect(() => {
    if (canUseTurnJs || !turnDirection || !turnToMonth) {
      return;
    }

    setTurnDirection(null);
    setTurnFromMonth(null);
    setTurnToMonth(null);
    setTurnViewport(null);
    setCurrentMonth(turnToMonth);
  }, [canUseTurnJs, turnDirection, turnToMonth]);

  useEffect(() => {
    if (!flipDirection) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFlipDirection(null);
    }, PAGE_TURN_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [flipDirection]);

  useEffect(() => {
    if (typeof window === "undefined" || !fitTargetRef.current) {
      return;
    }

    const node = fitTargetRef.current;

    const computeScale = () => {
      const width = node.offsetWidth;
      const height = node.offsetHeight;

      if (!width || !height) {
        return;
      }

      const isMobile = window.innerWidth <= MOBILE_TURN_BREAKPOINT;
      setIsMobileView(isMobile);

      if (isMobile) {
        setFitScale(1);
        return;
      }

      const availableWidth = Math.max(window.innerWidth - 20, 240);
      const availableHeight = Math.max(window.innerHeight - 20, 240);
      const rawScale = Math.min(1, availableWidth / width, availableHeight / height);
      const roundedScale = Math.floor(rawScale * 1000) / 1000;

      setFitScale((prev) =>
        Math.abs(prev - roundedScale) > 0.003 ? roundedScale : prev
      );
    };

    computeScale();

    const observer = new ResizeObserver(() => {
      computeScale();
    });

    observer.observe(node);
    window.addEventListener("resize", computeScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", computeScale);
    };
  }, []);

  function handleMonthShift(amount: number) {
    if (isAnimatingTurn) {
      return;
    }

    const direction: TurnDirection = amount > 0 ? "next" : "prev";
    const targetMonth = shiftMonth(currentMonth, amount);

    setSelectionStart(null);
    setSelectionEnd(null);
    setHoverDay(null);

    if (canUseTurnJs) {
      const targetRect = fitTargetRef.current?.getBoundingClientRect();

      if (targetRect) {
        setTurnViewport({
          width: Math.max(1, Math.round(targetRect.width)),
          height: Math.max(1, Math.round(targetRect.height))
        });
      }

      setTurnFromMonth(currentMonth);
      setTurnToMonth(targetMonth);
      setTurnDirection(direction);
      return;
    }

    setFlipDirection(direction);
    setCurrentMonth(targetMonth);
  }

  function handleDayClick(day: DayCell) {
    if (!day.isCurrentMonth) {
      return;
    }

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(day.key);
      setSelectionEnd(null);
      setHoverDay(null);
      return;
    }

    const normalized = normalizeRange(selectionStart, day.key);
    setSelectionStart(normalized.from);
    setSelectionEnd(normalized.to);
    setHoverDay(null);
  }

  function clearSelection() {
    setSelectionStart(null);
    setSelectionEnd(null);
    setHoverDay(null);
  }

  function jumpToToday() {
    const today = new Date();
    const key = toDateKey(today);

    if (!isAnimatingTurn) {
      setFlipDirection("next");
    }

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectionStart(key);
    setSelectionEnd(key);
    setHoverDay(null);
  }

  function renderTurnPreview(month: Date) {
    const turnTheme = getThemeForMonth(month);
    const previewDays = buildMonthCells(month);
    const previewStyle = {
      "--turn-accent": turnTheme.accent,
      "--turn-accent-soft": turnTheme.accentSoft
    } as CSSProperties;

    return (
      <div className="turnjs-page-face is-vertical-turn" style={previewStyle}>
        <div className="turnjs-preview-hero">
          <img
            className="turnjs-page-image"
            src={getHeroUrlFromMonth(month)}
            alt=""
            onError={patchBrokenImage}
          />
          <div className="turnjs-page-image-shade" />
          <div className="turnjs-page-ribbon" />
          <div className="turnjs-page-label">
            <span>{month.getFullYear()}</span>
            <strong>{monthLabelUpper(month)}</strong>
          </div>
        </div>

        <div className="turnjs-preview-body">
          <div className="turnjs-preview-notes">
            <h4>Notes</h4>
            {Array.from({ length: 10 }, (_, index) => (
              <span key={`line-${index}`} className="turnjs-preview-note-line" />
            ))}
          </div>

          <div className="turnjs-preview-grid">
            <p>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            <div className="turnjs-preview-weekdays">
              {WEEKDAY_LABELS.map((label, index) => (
                <span
                  key={`weekday-${label}`}
                  className={index >= 5 ? "is-weekend" : undefined}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="turnjs-preview-days">
              {previewDays.map((day) => {
                const dayOfWeek = day.date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const className = [
                  "turnjs-preview-day",
                  !day.isCurrentMonth ? "is-outside" : "",
                  isWeekend ? "is-weekend" : ""
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <span key={`preview-${toDateKey(day.date)}`} className={className}>
                    {day.dayNumber}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const styleVars = {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--ink-900": theme.ink,
    "--fit-scale": `${fitScale}`
  } as CSSProperties;

  return (
    <section className="wall-calendar" style={styleVars}>
      <div className="calendar-fit-frame">
        <div className="calendar-fit-content">
          <article
            ref={fitTargetRef}
            className={`calendar-sheet ${
              flipDirection ? `is-flipping-${flipDirection}` : ""
            }`}
          >
        {canUseTurnJs && turnPages ? (
          <div
            className={`turnjs-overlay is-active is-${turnDirection}`}
            aria-hidden="true"
            style={
              turnViewport
                ? ({
                    "--turn-preview-width": `${turnViewport.width}px`,
                    "--turn-preview-height": `${turnViewport.height}px`
                  } as CSSProperties)
                : undefined
            }
          >
            <div ref={turnBookRef} className="turnjs-book is-vertical-turn">
              <div className="turnjs-page">{renderTurnPreview(turnPages.firstMonth)}</div>
              <div className="turnjs-page">{renderTurnPreview(turnPages.secondMonth)}</div>
            </div>
          </div>
        ) : null}

        <header className="hero-panel">
          <img
            className="hero-image"
            src={heroSource}
            alt={`${monthLabel} adventure landscape`}
            onError={(event) => {
              if (!event.currentTarget.src.endsWith(DEFAULT_HERO_IMAGE)) {
                setHeroSource(DEFAULT_HERO_IMAGE);
              }
            }}
          />
          <div className="hero-gradient" />
          <div className="hero-ribbon" aria-hidden="true">
            <svg className="hero-ribbon-svg" viewBox="0 0 1000 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroRibbonGradient" x1="320" y1="86" x2="1000" y2="176" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2b8d82" stopOpacity="0.82" />
                  <stop offset="55%" stopColor="#2f9e8d" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#2c7b89" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="heroRibbonHighlight" x1="350" y1="76" x2="1000" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f5ffff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#cdeef2" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              <path
                className="hero-ribbon-right-shape"
                d="M344 168 C485 136 612 92 748 72 C844 58 930 52 1000 50 L1000 176 C900 168 782 166 654 170 C541 174 438 177 344 180 Q330 178 334 170 Q337 167 344 168 Z"
                fill="url(#heroRibbonGradient)"
              />
              <path
                className="hero-ribbon-right-highlight"
                d="M346 172 C500 139 624 98 760 78 C846 66 923 60 997 58"
                fill="none"
                stroke="url(#heroRibbonHighlight)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="hero-ribbon-content">
            <div className="hero-copy">
              <p className="year-label">{currentMonth.getFullYear()}</p>
              <h1>{currentMonth.toLocaleDateString("en-US", { month: "long" }).toUpperCase()}</h1>
            </div>
          </div>

          <div className="month-controls" aria-label="Month navigation">
            <button
              type="button"
              onClick={() => handleMonthShift(-1)}
              aria-label="Previous month"
              disabled={isAnimatingTurn}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => handleMonthShift(1)}
              aria-label="Next month"
              disabled={isAnimatingTurn}
            >
              Next
            </button>
          </div>
        </header>

        <div className="calendar-main">
          <aside className="notes-column">
            <h2>Notes</h2>
            <p className="small-copy">General memo for {monthLabel}.</p>

            <textarea
              className="lined-textarea"
              value={monthNotes[monthKey] ?? ""}
              onChange={(event) => {
                setMonthNotes((previous) => ({
                  ...previous,
                  [monthKey]: event.target.value
                }));
              }}
              placeholder="Plan the month, write reminders, or list goals."
              aria-label="Monthly notes"
            />

            <div className="selection-card">
              <h3>Date Range Memo</h3>
              <p>{selectedSummary}</p>

              <textarea
                className="lined-textarea"
                value={selectionNoteKey ? rangeNotes[selectionNoteKey] ?? "" : ""}
                onChange={(event) => {
                  if (!selectionNoteKey) {
                    return;
                  }

                  setRangeNotes((previous) => ({
                    ...previous,
                    [selectionNoteKey]: event.target.value
                  }));
                }}
                placeholder={
                  selectionNoteKey
                    ? "Attach note to this date or date range."
                    : "Select a date or range first."
                }
                disabled={!selectionNoteKey}
                aria-label="Date range note"
              />

              <div className="selection-actions">
                <button type="button" onClick={clearSelection}>
                  Clear Range
                </button>
                <button type="button" className="primary" onClick={jumpToToday}>
                  Today
                </button>
              </div>
            </div>

            {savedMonthRangeNotes.length > 0 ? (
              <div className="saved-notes">
                <h3>Saved This Month</h3>
                <ul>
                  {savedMonthRangeNotes.map((item) => {
                    const label =
                      item.from === item.to
                        ? formatShortDate(item.from)
                        : `${formatShortDate(item.from)} - ${formatShortDate(item.to)}`;

                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectionStart(item.from);
                            setSelectionEnd(item.to);
                          }}
                        >
                          <strong>{label}</strong>
                          <span>{item.preview || "Open saved note"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </aside>

          <section className="grid-column" aria-label="Calendar date grid">

            <div className="weekday-row">
              {WEEKDAY_LABELS.map((label, index) => (
                <span
                  key={label}
                  className={index === 6 ? "is-sunday-header" : index === 5 ? "is-weekend-header" : undefined}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="day-grid">
              {dayCells.map((day) => {
                const dayOfWeek = day.date.getDay();
                const isSaturday = dayOfWeek === 6;
                const isSunday = dayOfWeek === 0;
                const isInSelectedRange =
                  selectedRange !== null &&
                  day.key >= selectedRange.from &&
                  day.key <= selectedRange.to;

                const isInPreviewRange =
                  previewRange !== null &&
                  day.key >= previewRange.from &&
                  day.key <= previewRange.to;

                const isRangeStart =
                  selectedRange !== null && day.key === selectedRange.from;
                const isRangeEnd = selectedRange !== null && day.key === selectedRange.to;
                const isToday = day.key === todayKey;

                const classList = ["day-cell"];

                if (!day.isCurrentMonth) {
                  classList.push("is-outside");
                }

                if (day.isCurrentMonth && isSaturday) {
                  classList.push("is-saturday");
                }

                if (day.isCurrentMonth && isSunday) {
                  classList.push("is-sunday");
                }

                if (day.holiday) {
                  classList.push("is-holiday");
                }

                if (isInPreviewRange && !isInSelectedRange) {
                  classList.push("is-preview");
                }

                if (isInSelectedRange) {
                  classList.push("is-in-range");
                }

                if (isRangeStart) {
                  classList.push("is-start");
                }

                if (isRangeEnd) {
                  classList.push("is-end");
                }

                if (isToday) {
                  classList.push("is-today");
                }

                return (
                  <button
                    key={day.key}
                    type="button"
                    className={classList.join(" ")}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => {
                      if (day.isCurrentMonth) {
                        setHoverDay(day.key);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoverDay(null);
                    }}
                    disabled={!day.isCurrentMonth}
                    title={
                      day.holiday
                        ? `${formatLongDate(day.key)} - ${day.holiday.label}`
                        : formatLongDate(day.key)
                    }
                    aria-label={
                      day.holiday
                        ? `${formatLongDate(day.key)}, ${day.holiday.label}`
                        : formatLongDate(day.key)
                    }
                  >
                    <span className="day-number">{day.dayNumber}</span>
                    {day.holiday ? (
                      <span
                        className={`holiday-badge tone-${day.holiday.tone}`}
                        aria-hidden="true"
                      >
                        <HolidayIcon name={day.holiday.icon} />
                      </span>
                    ) : null}
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

import { CSSProperties, useEffect, useMemo, useState } from "react";
import "./InteractiveWallCalendar.css";

type MonthTheme = {
  accent: string;
  accentSoft: string;
  ink: string;
  subtitle: string;
  heroUrl: string;
};

type DayCell = {
  date: Date;
  key: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  holidayLabel?: string;
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
    accent: "#2f8f67",
    accentSoft: "#4fc59a",
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

const HOLIDAY_BY_MONTH_DAY: Record<string, string> = {
  "01-01": "New Year",
  "02-14": "Valentine",
  "03-17": "St Patrick",
  "04-22": "Earth Day",
  "07-04": "Independence Day",
  "10-31": "Halloween",
  "12-25": "Christmas"
};

const STORAGE_MONTH_NOTES = "wall-calendar-month-notes-v1";
const STORAGE_RANGE_NOTES = "wall-calendar-range-notes-v1";

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
      holidayLabel: HOLIDAY_BY_MONTH_DAY[monthDayKey]
    };
  });
}

export function InteractiveWallCalendar() {
  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(now), [now]);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(
    null
  );

  const [monthNotes, setMonthNotes] = useState<Record<string, string>>(() =>
    loadRecord(STORAGE_MONTH_NOTES)
  );
  const [rangeNotes, setRangeNotes] = useState<Record<string, string>>(() =>
    loadRecord(STORAGE_RANGE_NOTES)
  );

  const monthKey = toMonthKey(currentMonth);
  const theme = MONTH_THEMES[currentMonth.getMonth()];
  const dayCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);

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
    if (!flipDirection) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFlipDirection(null);
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [flipDirection]);

  function handleMonthShift(amount: number) {
    setFlipDirection(amount > 0 ? "next" : "prev");
    setCurrentMonth((prev) => shiftMonth(prev, amount));
    setSelectionStart(null);
    setSelectionEnd(null);
    setHoverDay(null);
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
    setFlipDirection("next");
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectionStart(key);
    setSelectionEnd(key);
    setHoverDay(null);
  }

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const styleVars = {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--ink-900": theme.ink
  } as CSSProperties;

  return (
    <section className="wall-calendar" style={styleVars}>
      <article
        className={`calendar-sheet ${
          flipDirection ? `is-flipping-${flipDirection}` : ""
        }`}
      >
        <div className="spiral-binding" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={`ring-${index}`} className="ring" />
          ))}
        </div>

        <header className="hero-panel">
          <img
            className="hero-image"
            src={theme.heroUrl}
            alt={`${monthLabel} adventure landscape`}
          />
          <div className="hero-gradient" />
          <div className="hero-angle" />

          <div className="hero-copy">
            <p className="year-label">{currentMonth.getFullYear()}</p>
            <h1>{currentMonth.toLocaleDateString("en-US", { month: "long" }).toUpperCase()}</h1>
            <p className="theme-subtitle">{theme.subtitle}</p>
          </div>

          <div className="month-controls" aria-label="Month navigation">
            <button
              type="button"
              onClick={() => handleMonthShift(-1)}
              aria-label="Previous month"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => handleMonthShift(1)}
              aria-label="Next month"
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
            <div className="calendar-toolbar">
              <p className="month-heading">{monthLabel}</p>
              <p className="legend-text">Blue range, ring for today, star for holidays</p>
            </div>

            <div className="weekday-row">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="day-grid">
              {dayCells.map((day) => {
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
                      day.holidayLabel
                        ? `${formatLongDate(day.key)} - ${day.holidayLabel}`
                        : formatLongDate(day.key)
                    }
                    aria-label={
                      day.holidayLabel
                        ? `${formatLongDate(day.key)}, ${day.holidayLabel}`
                        : formatLongDate(day.key)
                    }
                  >
                    <span className="day-number">{day.dayNumber}</span>
                    {day.holidayLabel ? (
                      <span className="holiday-mark" aria-hidden="true">
                        *
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}

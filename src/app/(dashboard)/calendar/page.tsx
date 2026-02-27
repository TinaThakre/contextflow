"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";

type Platform = "Instagram" | "LinkedIn" | "Twitter";

type Status = "Scheduled" | "Draft";

type ScheduledItem = {
  id: string;
  title: string;
  platform: Platform;
  status: Status;
  date: string;
  time: string;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const platformDotStyles: Record<Platform, string> = {
  Instagram: "bg-pink-500",
  LinkedIn: "bg-blue-500",
  Twitter: "bg-sky-500",
};

const statusStyles: Record<Status, string> = {
  Scheduled: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  Draft: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};

const scheduledItems: ScheduledItem[] = [
  {
    id: "item-1",
    title: "Founder story thread",
    platform: "Twitter",
    status: "Scheduled",
    date: "2026-02-28",
    time: "09:00 AM",
  },
  {
    id: "item-2",
    title: "Product update carousel",
    platform: "Instagram",
    status: "Scheduled",
    date: "2026-03-03",
    time: "12:30 PM",
  },
  {
    id: "item-3",
    title: "Partnership announcement",
    platform: "LinkedIn",
    status: "Draft",
    date: "2026-03-05",
    time: "10:00 AM",
  },
  {
    id: "item-4",
    title: "Behind-the-scenes clip",
    platform: "Instagram",
    status: "Scheduled",
    date: "2026-03-07",
    time: "04:15 PM",
  },
  {
    id: "item-5",
    title: "Weekly growth lesson",
    platform: "LinkedIn",
    status: "Scheduled",
    date: "2026-03-10",
    time: "08:45 AM",
  },
];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildCalendarCells = (baseDate: Date) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;
    const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const displayDay = inCurrentMonth
      ? dayNumber
      : dayNumber <= 0
      ? daysInPrevMonth + dayNumber
      : dayNumber - daysInMonth;
    const cellDate = new Date(
      year,
      month + (dayNumber <= 0 ? -1 : dayNumber > daysInMonth ? 1 : 0),
      displayDay
    );

    return {
      key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
      date: cellDate,
      inCurrentMonth,
    };
  });
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const connectTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (connectTimerRef.current) {
        window.clearTimeout(connectTimerRef.current);
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    scheduledItems.forEach((item) => {
      if (!map.has(item.date)) {
        map.set(item.date, []);
      }
      map.get(item.date)?.push(item);
    });
    return map;
  }, []);

  const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);
  const todayKey = formatDateKey(new Date());

  const handlePrevMonth = () => {
    setSelectedDate(null);
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleConnect = () => {
    if (isConnected || isConnecting) {
      return;
    }

    setIsConnecting(true);

    if (connectTimerRef.current) {
      window.clearTimeout(connectTimerRef.current);
    }

    connectTimerRef.current = window.setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setToastMessage("Connected to Google Calendar");

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    }, 1500);
  };

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null;
  const selectedItems = selectedKey ? eventsByDate.get(selectedKey) ?? [] : [];

  const monthLabel = currentMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Content Calendar</h1>
          <p className="text-[var(--foreground-muted)] max-w-2xl">
            Sync and manage your publishing schedule across platforms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Connected to Google
            </div>
          ) : (
            <Button isLoading={isConnecting} onClick={handleConnect}>
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {toastMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <Card className="border-white/10" padding="lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Monthly overview of your planned content.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[160px] text-center">
                {monthLabel}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-xs text-[var(--foreground-muted)]">
              {weekdayLabels.map((label) => (
                <div key={label} className="text-center uppercase tracking-wide">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {calendarCells.map((cell) => {
                const cellKey = formatDateKey(cell.date);
                const isToday = cellKey === todayKey;
                const hasEvents = eventsByDate.has(cellKey);
                const events = eventsByDate.get(cellKey) ?? [];

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[86px] rounded-xl border border-white/10 p-2 text-left transition-colors hover:border-white/20 ${
                      cell.inCurrentMonth
                        ? "bg-[var(--background-tertiary)]"
                        : "bg-[var(--background-secondary)] opacity-60"
                    } ${isToday ? "ring-2 ring-[var(--primary)]" : ""}`}
                  >
                    <div className="text-xs font-semibold">{cell.date.getDate()}</div>
                    {hasEvents && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {events.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className={`h-2 w-2 rounded-full ${platformDotStyles[event.platform]}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10" padding="lg">
          <CardHeader>
            <CardTitle>Upcoming Content</CardTitle>
            <CardDescription>Next scheduled posts across platforms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduledItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                  <span>{item.platform}</span>
                  <span>
                    {item.date} · {item.time}
                  </span>
                </div>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[var(--background-secondary)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Scheduled items</h2>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-full border border-white/10 p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedItems.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 text-sm text-[var(--foreground-muted)]">
                  No scheduled posts for this date yet.
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.title}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${statusStyles[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                      <span>{item.platform}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <CardFooter className="mt-6 border-t border-white/10 pt-4 justify-end">
              <Button variant="outline" onClick={() => setSelectedDate(null)}>
                Close
              </Button>
            </CardFooter>
          </div>
        </div>
      )}
    </div>
  );
}

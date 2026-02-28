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
import { ChevronLeft, ChevronRight, CheckCircle2, X, Plus } from "lucide-react";
import {
  connectGoogleCalendar,
  fetchCalendarEvents,
  checkCalendarConnection,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  CalendarEvent,
} from "@/lib/google-calendar";
import { Input } from "@/components/ui";

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

// Removed dummy data - now showing only real Google Calendar events

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
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [allUpcomingEvents, setAllUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await checkCalendarConnection();
        setIsConnected(connected);
        
        if (connected) {
          await Promise.all([loadCalendarEvents(), loadAllUpcomingEvents()]);
        }
      } catch (error) {
        console.error("Error checking calendar connection:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    }, []);

  // Load all upcoming events (next 3 months) for sidebar
  const loadAllUpcomingEvents = async () => {
    try {
      const now = new Date();
      const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      
      const events = await fetchCalendarEvents(
        now.toISOString(),
        threeMonthsLater.toISOString()
      );
      
      setAllUpcomingEvents(events);
    } catch (error: any) {
      console.error("Error loading upcoming events:", error);
      // If token expired, mark as disconnected
      if (error.message?.includes('authentication') || error.message?.includes('credentials')) {
        setIsConnected(false);
        setToastMessage("Calendar connection expired. Please reconnect.");
        if (toastTimerRef.current) {
          window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
          setToastMessage(null);
        }, 5000);
      }
    }
  };

  // Load calendar events for current month view
  const loadCalendarEvents = async () => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const events = await fetchCalendarEvents(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      
      setCalendarEvents(events);
    } catch (error: any) {
      console.error("Error loading calendar events:", error);
      // If token expired, mark as disconnected
      if (error.message?.includes('authentication') || error.message?.includes('credentials')) {
        setIsConnected(false);
        setToastMessage("Calendar connection expired. Please reconnect.");
        if (toastTimerRef.current) {
          window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
          setToastMessage(null);
        }, 5000);
      }
    }
  };

  // Reload events when month changes (only for calendar grid)
  useEffect(() => {
    if (isConnected) {
      loadCalendarEvents();
    }
  }, [currentMonth, isConnected]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    
    // Add Google Calendar events
    calendarEvents.forEach((event) => {
      const eventDate = new Date(event.start.dateTime);
      const dateKey = formatDateKey(eventDate);
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      
      // Convert Google Calendar event to ScheduledItem format
      map.get(dateKey)?.push({
        id: event.id,
        title: event.summary,
        platform: "LinkedIn" as Platform, // Default platform for calendar events
        status: "Scheduled" as Status,
        date: dateKey,
        time: eventDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    });
    
    return map;
  }, [calendarEvents]);

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

  const handleConnect = async () => {
    if (isConnected || isConnecting) {
      return;
    }

    setIsConnecting(true);

    try {
      const result = await connectGoogleCalendar();
      
      if (result.success) {
        setIsConnected(true);
        setToastMessage("Connected to Google Calendar");
        
        // Load calendar events after successful connection
        await loadCalendarEvents();
      } else {
        setToastMessage(result.error || "Failed to connect to Google Calendar");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      setToastMessage(error.message || "Failed to connect to Google Calendar");
    } finally {
      setIsConnecting(false);
      
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      setToastMessage("Please fill in all required fields");
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return;
    }

    setIsCreating(true);

    try {
      const startDateTime = `${newEvent.date}T${newEvent.startTime}:00`;
      const endDateTime = `${newEvent.date}T${newEvent.endTime}:00`;

      const result = await createCalendarEvent({
        summary: newEvent.title,
        description: newEvent.description,
        start: startDateTime,
        end: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (result.success) {
        setToastMessage("Event created successfully!");
        setShowCreateModal(false);
        setNewEvent({
          title: "",
          description: "",
          date: "",
          startTime: "",
          endTime: "",
        });
        
        // Reload both calendar views
        await Promise.all([loadCalendarEvents(), loadAllUpcomingEvents()]);
      } else {
        setToastMessage(result.error || "Failed to create event");
      }
    } catch (error: any) {
      console.error("Create event error:", error);
      setToastMessage(error.message || "Failed to create event");
    } finally {
      setIsCreating(false);
      
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null;
  const selectedItems = selectedKey ? eventsByDate.get(selectedKey) ?? [] : [];

  const monthLabel = currentMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get upcoming events (next 5 from the 3-month range)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return allUpcomingEvents
      .filter((event) => new Date(event.start.dateTime) >= now)
      .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
      .slice(0, 5);
  }, [allUpcomingEvents]);

  const handleEditEvent = (eventId: string) => {
    // Look in both calendar events and all upcoming events
    const event = allUpcomingEvents.find((e) => e.id === eventId) || 
                  calendarEvents.find((e) => e.id === eventId);
    if (event) {
      const startDate = new Date(event.start.dateTime);
      const endDate = new Date(event.end.dateTime);
      
      setEditingEvent(event);
      setNewEvent({
        title: event.summary,
        description: event.description || "",
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      setToastMessage("Please fill in all required fields");
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return;
    }

    setIsCreating(true);

    try {
      const startDateTime = `${newEvent.date}T${newEvent.startTime}:00`;
      const endDateTime = `${newEvent.date}T${newEvent.endTime}:00`;

      const result = await updateCalendarEvent(editingEvent.id, {
        summary: newEvent.title,
        description: newEvent.description,
        start: startDateTime,
        end: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (result.success) {
        setToastMessage("Event updated successfully!");
        setShowEditModal(false);
        setEditingEvent(null);
        setNewEvent({
          title: "",
          description: "",
          date: "",
          startTime: "",
          endTime: "",
        });
        
        // Reload both calendar views
        await Promise.all([loadCalendarEvents(), loadAllUpcomingEvents()]);
      } else {
        setToastMessage(result.error || "Failed to update event");
      }
    } catch (error: any) {
      console.error("Update event error:", error);
      setToastMessage(error.message || "Failed to update event");
    } finally {
      setIsCreating(false);
      
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteCalendarEvent(eventId);

      if (result.success) {
        setToastMessage("Event deleted successfully!");
        setSelectedDate(null);
        setShowEditModal(false);
        setEditingEvent(null);
        
        // Reload both calendar views
        await Promise.all([loadCalendarEvents(), loadAllUpcomingEvents()]);
      } else {
        setToastMessage(result.error || "Failed to delete event");
      }
    } catch (error: any) {
      console.error("Delete event error:", error);
      setToastMessage(error.message || "Failed to delete event");
    } finally {
      setIsDeleting(false);
      
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const handleMarkAsCompleted = async (eventId: string) => {
    setIsDeleting(true);

    try {
      const event = allUpcomingEvents.find((e) => e.id === eventId) || 
                    calendarEvents.find((e) => e.id === eventId);
      
      if (!event) {
        throw new Error("Event not found");
      }

      const result = await updateCalendarEvent(eventId, {
        summary: `✓ ${event.summary}`,
        description: event.description || "",
        start: event.start.dateTime,
        end: event.end.dateTime,
        timeZone: event.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "confirmed",
      });

      if (result.success) {
        setToastMessage("Event marked as completed!");
        setSelectedDate(null);
        
        // Reload both calendar views
        await Promise.all([loadCalendarEvents(), loadAllUpcomingEvents()]);
      } else {
        setToastMessage(result.error || "Failed to mark event as completed");
      }
    } catch (error: any) {
      console.error("Mark as completed error:", error);
      setToastMessage(error.message || "Failed to mark event as completed");
    } finally {
      setIsDeleting(false);
      
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

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
          {isConnected && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
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
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          toastMessage.includes('expired') || toastMessage.includes('Failed')
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
        }`}>
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
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next scheduled events from your calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-[var(--foreground-muted)]">
                Loading events...
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-[var(--foreground-muted)]">
                No upcoming events. Create one to get started!
              </div>
            ) : (
              upcomingEvents.map((event) => {
                const startDate = new Date(event.start.dateTime);
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{event.summary}</span>
                      <span
                        className="rounded-full border px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      >
                        Scheduled
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                      <span>
                        {startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        {startDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditEvent(event.id)}
                    >
                      Edit
                    </Button>
                  </div>
                );
              })
            )}
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
                <div className="rounded-xl border border-white/10 bg-[var(--background-tertiary)] p-4 text-sm text-[var(--foreground-muted)] text-center">
                  No scheduled events for this date yet.
                </div>
              ) : (
                selectedItems.map((item) => (
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
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                      <span>{item.platform}</span>
                      <span>{item.time}</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditEvent(item.id)}
                    >
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </div>

            <CardFooter className="mt-6 border-t border-white/10 pt-4 justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  setNewEvent({
                    title: "",
                    description: "",
                    date: dateStr,
                    startTime: "09:00",
                    endTime: "10:00",
                  });
                  setSelectedDate(null);
                  setShowCreateModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" onClick={() => setSelectedDate(null)}>
                Close
              </Button>
            </CardFooter>
          </div>
        </div>
      )}

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[var(--background-secondary)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {showEditModal ? "Edit Calendar Event" : "Create Calendar Event"}
                </h2>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {showEditModal 
                    ? "Update your event details" 
                    : "Add a new event to your Google Calendar"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingEvent(null);
                  setNewEvent({
                    title: "",
                    description: "",
                    date: "",
                    startTime: "",
                    endTime: "",
                  });
                }}
                className="rounded-full border border-white/10 p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Title <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Team Meeting"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  placeholder="Add event description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--background-tertiary)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                {showEditModal && editingEvent && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleMarkAsCompleted(editingEvent.id)}
                      disabled={isCreating || isDeleting}
                    >
                      ✓ Mark Complete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      disabled={isCreating || isDeleting}
                      className="text-red-400 hover:text-red-300 border-red-400/30"
                    >
                      Delete Event
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingEvent(null);
                    setNewEvent({
                      title: "",
                      description: "",
                      date: "",
                      startTime: "",
                      endTime: "",
                    });
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={showEditModal ? handleUpdateEvent : handleCreateEvent}
                  isLoading={isCreating}
                >
                  {showEditModal ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

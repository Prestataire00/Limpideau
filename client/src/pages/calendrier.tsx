import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Trash2, MapPin, Briefcase, StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { InterventionDay, Mission } from "@shared/schema";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendrierPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rangeStart = format(subDays(calendarStart, 1), "yyyy-MM-dd");
  const rangeEnd = format(addDays(calendarEnd, 1), "yyyy-MM-dd");

  const { data: interventionDays = [] } = useQuery<InterventionDay[]>({
    queryKey: [`/api/intervention-days?start=${rangeStart}&end=${rangeEnd}`],
  });

  const { data: missions = [] } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  const missionsMap = useMemo(() => {
    const map = new Map<string, Mission>();
    missions.forEach((m) => map.set(m.id, m));
    return map;
  }, [missions]);

  // Group intervention days by date string
  const daysByDate = useMemo(() => {
    const map = new Map<string, InterventionDay[]>();
    interventionDays.forEach((d) => {
      const list = map.get(d.date) || [];
      list.push(d);
      map.set(d.date, list);
    });
    return map;
  }, [interventionDays]);

  // Build calendar grid rows
  const calendarRows = useMemo(() => {
    const rows: Date[][] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [calendarStart, calendarEnd]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedDayInterventions = selectedDate ? (daysByDate.get(selectedDateStr) || []) : [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/intervention-days/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/intervention-days?start=${rangeStart}&end=${rangeEnd}`] });
      toast({ title: "Jour supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer ce jour", variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h1 className="text-2xl font-bold tracking-tight capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b shrink-0">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
          {calendarRows.map((week) =>
            week.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayInterventions = daysByDate.get(dateStr) || [];
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "border-b border-r p-1 cursor-pointer transition-colors min-h-[80px]",
                    !inCurrentMonth && "bg-muted/30",
                    isSelected && "bg-blue-50 dark:bg-blue-950/30",
                    "hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    !inCurrentMonth && "text-muted-foreground",
                    isToday(day) && "bg-blue-600 text-white",
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayInterventions.slice(0, 3).map((intervention) => {
                      const mission = missionsMap.get(intervention.missionId);
                      return (
                        <Link key={intervention.id} href={`/missions/${intervention.missionId}`}>
                          <div className="text-[11px] leading-tight px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50">
                            <span className="font-medium">{mission?.title || "Mission"}</span>
                            {mission?.location && (
                              <span className="text-blue-600 dark:text-blue-300"> · {mission.location}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                    {dayInterventions.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1.5">
                        +{dayInterventions.length - 3} autre{dayInterventions.length - 3 > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel (slide-up) */}
      {selectedDate && selectedDayInterventions.length > 0 && (
        <div className="border-t bg-background shrink-0 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {selectedDayInterventions.map((day) => {
              const mission = missionsMap.get(day.missionId);
              return (
                <div key={day.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border">
                  <div className="space-y-1 min-w-0">
                    <Link href={`/missions/${day.missionId}`}>
                      <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{mission?.title || "Mission"}</span>
                      </span>
                    </Link>
                    {mission?.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {mission.location}
                      </p>
                    )}
                    {day.notes && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <StickyNote className="h-3 w-3 shrink-0" />
                        {day.notes}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive h-7 w-7"
                      onClick={() => deleteMutation.mutate(day.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

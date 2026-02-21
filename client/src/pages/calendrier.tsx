import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";
import { Trash2, MapPin, StickyNote, Briefcase } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InterventionDay, Mission } from "@shared/schema";

export default function CalendrierPage() {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const rangeStart = format(subDays(startOfMonth(month), 7), "yyyy-MM-dd");
  const rangeEnd = format(addDays(endOfMonth(month), 7), "yyyy-MM-dd");

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

  const interventionDateSet = useMemo(() => {
    const set = new Set<string>();
    interventionDays.forEach((d) => set.add(d.date));
    return set;
  }, [interventionDays]);

  const interventionModifiers = useMemo(() => {
    return interventionDays.map((d) => new Date(d.date + "T00:00:00"));
  }, [interventionDays]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedDayInterventions = useMemo(() => {
    return interventionDays.filter((d) => d.date === selectedDateStr);
  }, [interventionDays, selectedDateStr]);

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
        <p className="text-muted-foreground">Jours d'intervention sur les chantiers</p>
      </div>

      <style>{`
        .intervention-day {
          position: relative;
        }
        .intervention-day::after {
          content: "";
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #3b82f6;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={month}
              onMonthChange={setMonth}
              locale={fr}
              modifiers={{ intervention: interventionModifiers }}
              modifiersClassNames={{ intervention: "intervention-day" }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                : "Sélectionnez un jour"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayInterventions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune intervention prévue ce jour.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayInterventions.map((day) => {
                  const mission = missionsMap.get(day.missionId);
                  return (
                    <div key={day.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border">
                      <div className="space-y-1 min-w-0">
                        <Link href={`/missions/${day.missionId}`}>
                          <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {mission?.title || "Mission"}
                          </span>
                        </Link>
                        {mission?.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {mission.location}
                          </p>
                        )}
                        {day.notes && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <StickyNote className="h-3 w-3" />
                            {day.notes}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => deleteMutation.mutate(day.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

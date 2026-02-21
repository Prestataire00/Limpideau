import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Edit, Calendar as CalendarIcon, MapPin, User, Mail, Phone, Euro, Plus, Trash2, CalendarDays, FileText, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusDropdown, StatusBadge } from "@/components/mission-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Mission, InterventionDay, Report, ReportStatus } from "@shared/schema";

const reportStatusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  draft: { label: "Brouillon", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-950/40", border: "border-gray-200 dark:border-gray-800", dot: "bg-gray-500" },
  in_progress: { label: "En cours", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  completed: { label: "Termine", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  validated: { label: "Valide", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
};

const allReportStatuses: ReportStatus[] = ["draft", "in_progress", "completed", "validated"];

function ReportStatusBadge({ status: statusKey }: { status: string }) {
  const status = reportStatusConfig[statusKey] || reportStatusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${status.color} ${status.bg} ${status.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}

function ReportStatusDropdown({ report, missionId }: { report: Report; missionId: string }) {
  const { toast } = useToast();
  const current = reportStatusConfig[report.status] || reportStatusConfig.draft;

  const mutation = useMutation({
    mutationFn: (newStatus: ReportStatus) =>
      apiRequest("PATCH", `/api/reports/${report.id}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/reports`] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border cursor-pointer transition-opacity hover:opacity-80 ${current.color} ${current.bg} ${current.border}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
          {current.label}
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {allReportStatuses.map((key) => {
          const s = reportStatusConfig[key];
          const isActive = key === report.status;
          return (
            <DropdownMenuItem
              key={key}
              disabled={isActive}
              onClick={() => mutation.mutate(key)}
              className={isActive ? "opacity-50" : ""}
            >
              <span className={`h-2 w-2 rounded-full mr-2 ${s.dot}`} />
              {s.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MissionDetailPage() {
  const [, params] = useRoute("/missions/:id");
  const missionId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const { data: mission, isLoading } = useQuery<Mission>({
    queryKey: ["/api/missions", missionId],
    enabled: !!missionId,
  });

  const { data: interventionDaysList = [] } = useQuery<InterventionDay[]>({
    queryKey: [`/api/missions/${missionId}/intervention-days`],
    enabled: !!missionId,
  });

  const { data: reportsList = [] } = useQuery<Report[]>({
    queryKey: [`/api/missions/${missionId}/reports`],
    enabled: !!missionId,
  });

  const createDayMutation = useMutation({
    mutationFn: async (data: { date: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/missions/${missionId}/intervention-days`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/intervention-days`] });
      toast({ title: "Jour ajouté" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter ce jour", variant: "destructive" });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/intervention-days/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/intervention-days`] });
      toast({ title: "Jour supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer ce jour", variant: "destructive" });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      const title = `Cuve ${reportsList.length + 1}`;
      const res = await apiRequest("POST", `/api/missions/${missionId}/reports`, { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/reports`] });
      toast({ title: "Rapport créé" });
    },
    onError: (error: Error) => {
      console.error("Create report error:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de créer le rapport", variant: "destructive" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/reports`] });
      toast({ title: "Rapport supprimé" });
    },
    onError: (error: Error) => {
      console.error("Delete report error:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de supprimer le rapport", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Mission non trouvée</h2>
          <p className="text-muted-foreground mb-4">Cette mission n'existe pas ou a été supprimée.</p>
          <Link href="/missions">
            <Button>Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/missions">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-mission-title">
                {mission.title}
              </h1>
              {isAdmin ? <StatusDropdown mission={mission} /> : <StatusBadge status={mission.status} />}
            </div>
            <p className="text-muted-foreground mt-1">
              Référence: {mission.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href={`/missions/${mission.id}/edit`}>
              <Button data-testid="button-edit">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={User} label="Nom" value={mission.clientName} testId="text-client-name" />
              <InfoItem icon={Mail} label="Email" value={mission.clientEmail} testId="text-client-email" />
              <InfoItem icon={Phone} label="Téléphone" value={mission.clientPhone} testId="text-client-phone" />
              <InfoItem icon={MapPin} label="Lieu" value={mission.location} testId="text-location" />
            </CardContent>
          </Card>

          {mission.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap" data-testid="text-description">
                  {mission.description}
                </p>
              </CardContent>
            </Card>
          )}

          {mission.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground" data-testid="text-notes">
                  {mission.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapports
              </CardTitle>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createReportMutation.mutate()}
                  disabled={createReportMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {reportsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun rapport. {isAdmin ? "Cliquez sur Ajouter pour créer un rapport." : ""}</p>
              ) : (
                <div className="space-y-2">
                  {reportsList.map((report) => (
                    <div key={report.id} className="flex items-center gap-3 p-2 rounded-md border text-sm">
                      <Link href={`/missions/${missionId}/rapports/${report.id}`} className="flex-1 min-w-0">
                        <span className="font-medium text-primary hover:underline cursor-pointer">
                          {report.title}
                        </span>
                      </Link>
                      {isAdmin ? (
                        <ReportStatusDropdown report={report} missionId={missionId!} />
                      ) : (
                        <ReportStatusBadge status={report.status} />
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteReportMutation.mutate(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem
                icon={CalendarIcon}
                label="Date de début"
                value={format(new Date(mission.startDate), "d MMMM yyyy", { locale: fr })}
                testId="text-start-date"
              />
              <Separator />
              <InfoItem
                icon={CalendarIcon}
                label="Date de fin"
                value={mission.endDate ? format(new Date(mission.endDate), "d MMMM yyyy", { locale: fr }) : "Non définie"}
                testId="text-end-date"
              />
              <Separator />
              <InfoItem
                icon={Euro}
                label="Budget"
                value={mission.budget ? `${mission.budget.toLocaleString("fr-FR")} €` : "Non défini"}
                testId="text-budget"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créée le</span>
                <span>{format(new Date(mission.createdAt), "d MMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modifiée le</span>
                <span>{format(new Date(mission.updatedAt), "d MMM yyyy", { locale: fr })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Jours d'intervention
              </CardTitle>
              {isAdmin && (
                <InterventionDayPicker
                  onAdd={(date, notes) => createDayMutation.mutate({ date, notes })}
                  isPending={createDayMutation.isPending}
                />
              )}
            </CardHeader>
            <CardContent>
              {interventionDaysList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun jour d'intervention planifié.</p>
              ) : (
                <div className="space-y-2">
                  {interventionDaysList.map((day) => (
                    <div key={day.id} className="flex items-center justify-between gap-2 p-2 rounded-md border text-sm">
                      <div>
                        <span className="font-medium">
                          {format(new Date(day.date + "T00:00:00"), "EEEE d MMMM yyyy", { locale: fr })}
                        </span>
                        {day.notes && (
                          <span className="text-muted-foreground ml-2">— {day.notes}</span>
                        )}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDayMutation.mutate(day.id)}
                          disabled={deleteDayMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  testId?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium" data-testid={testId}>{value || "-"}</p>
      </div>
    </div>
  );
}

function InterventionDayPicker({
  onAdd,
  isPending,
}: {
  onAdd: (date: string, notes?: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!selectedDate) return;
    onAdd(format(selectedDate, "yyyy-MM-dd"), notes || undefined);
    setSelectedDate(undefined);
    setNotes("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={fr}
          />
          <Input
            placeholder="Notes (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={!selectedDate || isPending}
          >
            Confirmer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

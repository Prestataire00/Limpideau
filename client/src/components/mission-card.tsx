import { Calendar, MapPin, User, MoreHorizontal, Eye, Edit, Trash2, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Mission, MissionStatus } from "@shared/schema";

interface MissionCardProps {
  mission: Mission;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending: { label: "En attente", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  in_progress: { label: "En cours", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  completed: { label: "Terminee", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Annulee", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
};

const allStatuses: MissionStatus[] = ["pending", "in_progress", "completed", "cancelled"];

export function StatusBadge({ status: statusKey }: { status: string }) {
  const status = statusConfig[statusKey] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color} ${status.bg} ${status.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}

export function StatusDropdown({ mission }: { mission: Mission }) {
  const { toast } = useToast();
  const current = statusConfig[mission.status] || statusConfig.pending;

  const mutation = useMutation({
    mutationFn: (newStatus: MissionStatus) =>
      apiRequest("PATCH", `/api/missions/${mission.id}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions", mission.id] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-opacity hover:opacity-80 ${current.color} ${current.bg} ${current.border}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
          {current.label}
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {allStatuses.map((key) => {
          const s = statusConfig[key];
          const isActive = key === mission.status;
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

export function MissionCard({ mission, onDelete }: MissionCardProps) {
  const statusBorderColor = mission.status === "pending" ? "border-l-amber-400" : mission.status === "in_progress" ? "border-l-blue-500" : mission.status === "completed" ? "border-l-emerald-500" : "border-l-red-400";

  return (
    <Card className={`hover-elevate transition-all duration-200 border-l-4 ${statusBorderColor}`} data-testid={`card-mission-${mission.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate" data-testid={`text-mission-title-${mission.id}`}>
            {mission.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="truncate" data-testid={`text-mission-client-${mission.id}`}>{mission.clientName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusDropdown mission={mission} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-menu-${mission.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/missions/${mission.id}`} className="flex items-center gap-2" data-testid={`link-view-${mission.id}`}>
                  <Eye className="h-4 w-4" />
                  Voir les details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/missions/${mission.id}/edit`} className="flex items-center gap-2" data-testid={`link-edit-${mission.id}`}>
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(mission.id)}
                data-testid={`button-delete-${mission.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {mission.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {mission.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}</span>
          </div>
          {mission.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{mission.location}</span>
            </div>
          )}
          {mission.budget && (
            <div className="font-medium text-foreground">
              {mission.budget.toLocaleString("fr-FR")} €
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

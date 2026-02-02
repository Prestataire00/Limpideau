import { Calendar, MapPin, User, MoreHorizontal, Eye, Edit, FileText, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Mission } from "@shared/schema";

interface MissionCardProps {
  mission: Mission;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_progress: { label: "En cours", variant: "default" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

export function MissionCard({ mission, onDelete }: MissionCardProps) {
  const status = statusConfig[mission.status] || statusConfig.pending;

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-mission-${mission.id}`}>
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
          <Badge variant={status.variant} data-testid={`badge-status-${mission.id}`}>
            {status.label}
          </Badge>
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
                  Voir les détails
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/missions/${mission.id}/edit`} className="flex items-center gap-2" data-testid={`link-edit-${mission.id}`}>
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/missions/${mission.id}/template`} className="flex items-center gap-2" data-testid={`link-template-${mission.id}`}>
                  <FileText className="h-4 w-4" />
                  Voir le template
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

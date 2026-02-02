import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Mission } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_progress: { label: "En cours", variant: "default" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

export default function TemplatesPage() {
  const { data: missions, isLoading } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-templates-title">
            Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Accédez aux templates générés automatiquement pour chaque mission
          </p>
        </div>
        <Link href="/missions/new">
          <Button data-testid="button-new-mission">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle mission
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px]" />
          ))}
        </div>
      ) : missions && missions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map((mission) => {
            const status = statusConfig[mission.status] || statusConfig.pending;
            return (
              <Card key={mission.id} className="hover-elevate" data-testid={`card-template-${mission.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base font-semibold truncate">
                        {mission.title}
                      </CardTitle>
                    </div>
                    <Badge variant={status.variant} className="shrink-0">
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Client: {mission.clientName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(mission.startDate), "d MMM yyyy", { locale: fr })}
                    </span>
                    <Link href={`/missions/${mission.id}/template`}>
                      <Button variant="ghost" size="sm" data-testid={`button-view-template-${mission.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Aucun template</h3>
          <p className="text-muted-foreground mb-4">
            Créez une mission pour générer automatiquement son template
          </p>
          <Link href="/missions/new">
            <Button data-testid="button-create-first-mission">
              <Plus className="h-4 w-4 mr-2" />
              Créer une mission
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

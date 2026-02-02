import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Edit } from "lucide-react";
import { MissionTemplate } from "@/components/mission-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Mission } from "@shared/schema";

export default function MissionTemplatePage() {
  const [, params] = useRoute("/missions/:id/template");
  const missionId = params?.id;

  const { data: mission, isLoading } = useQuery<Mission>({
    queryKey: ["/api/missions", missionId],
    enabled: !!missionId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[600px]" />
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
          <Link href={`/missions/${missionId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Template de mission
            </h1>
            <p className="text-muted-foreground mt-1">
              {mission.title}
            </p>
          </div>
        </div>
        <Link href={`/missions/${missionId}/edit`}>
          <Button variant="outline" data-testid="button-edit">
            <Edit className="h-4 w-4 mr-2" />
            Modifier les données
          </Button>
        </Link>
      </div>

      <MissionTemplate mission={mission} />
    </div>
  );
}

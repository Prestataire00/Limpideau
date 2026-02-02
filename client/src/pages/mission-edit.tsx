import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { MissionForm } from "@/components/mission-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Mission } from "@shared/schema";

export default function MissionEditPage() {
  const [, params] = useRoute("/missions/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const missionId = params?.id;

  const { data: mission, isLoading } = useQuery<Mission>({
    queryKey: ["/api/missions", missionId],
    enabled: !!missionId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => apiRequest("PATCH", `/api/missions/${missionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions", missionId] });
      toast({
        title: "Mission mise à jour",
        description: "Les modifications ont été enregistrées.",
      });
      setLocation(`/missions/${missionId}`);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: unknown) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[500px]" />
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
      <div className="flex items-center gap-4">
        <Link href={`/missions/${missionId}`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Modifier la mission
          </h1>
          <p className="text-muted-foreground mt-1">
            {mission.title}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la mission</CardTitle>
        </CardHeader>
        <CardContent>
          <MissionForm mission={mission} onSubmit={handleSubmit} isLoading={updateMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}

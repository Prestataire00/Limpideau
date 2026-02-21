import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { MissionForm, type InterventionDayEntry } from "@/components/mission-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function MissionNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (data: unknown, interventionDays?: InterventionDayEntry[]) => {
    setIsCreating(true);
    try {
      const res = await apiRequest("POST", "/api/missions", data);
      const mission = await res.json();

      if (interventionDays && interventionDays.length > 0) {
        await Promise.all(
          interventionDays.map((day) =>
            apiRequest("POST", `/api/missions/${mission.id}/intervention-days`, day)
          )
        );
      }

      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission créée",
        description: "La mission a été créée avec succès.",
      });
      setLocation("/missions");
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/missions">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Nouvelle mission
          </h1>
          <p className="text-muted-foreground mt-1">
            Créer une nouvelle mission avec un template automatique
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la mission</CardTitle>
        </CardHeader>
        <CardContent>
          <MissionForm onSubmit={handleSubmit} isLoading={isCreating} />
        </CardContent>
      </Card>
    </div>
  );
}

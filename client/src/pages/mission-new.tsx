import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { MissionForm } from "@/components/mission-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function MissionNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: unknown) => apiRequest("POST", "/api/missions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission créée",
        description: "La mission a été créée avec succès.",
      });
      setLocation("/missions");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: unknown) => {
    createMutation.mutate(data);
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
          <MissionForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}

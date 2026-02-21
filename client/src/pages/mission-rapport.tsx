import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RapportForm } from "@/components/rapport-form";
import { RapportTemplate } from "@/components/rapport-template";
import { templateDataSchema, type TemplateData } from "@shared/schema";
import type { Mission } from "@shared/schema";

export default function MissionRapportPage() {
  const [, params] = useRoute("/missions/:id/rapport");
  const missionId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mission, isLoading: missionLoading } = useQuery<Mission>({
    queryKey: ["/api/missions", missionId],
    enabled: !!missionId,
  });

  const { data: templateData, isLoading: templateLoading } = useQuery<TemplateData>({
    queryKey: ["/api/missions", missionId, "template-data"],
    enabled: !!missionId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      const res = await apiRequest("PUT", `/api/missions/${missionId}/template-data`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions", missionId, "template-data"] });
      toast({ title: "Enregistre", description: "Les donnees du rapport ont ete sauvegardees." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder le rapport.", variant: "destructive" });
    },
  });

  const isLoading = missionLoading || templateLoading;

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
          <h2 className="text-xl font-semibold mb-2">Mission non trouvee</h2>
          <p className="text-muted-foreground mb-4">Cette mission n'existe pas ou a ete supprimee.</p>
          <Link href="/missions">
            <Button>Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultData = templateData || templateDataSchema.parse({});

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/missions/${missionId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-7 w-7" />
              Rapport Reservoir
            </h1>
            <p className="text-muted-foreground mt-1">{mission.title}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="saisie" className="space-y-6">
        <TabsList>
          <TabsTrigger value="saisie">Saisie</TabsTrigger>
          <TabsTrigger value="apercu">Apercu</TabsTrigger>
        </TabsList>

        <TabsContent value="saisie">
          <RapportForm
            defaultValues={defaultData}
            onSubmit={(data) => saveMutation.mutate(data)}
            isPending={saveMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="apercu">
          <RapportTemplate mission={mission} data={defaultData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

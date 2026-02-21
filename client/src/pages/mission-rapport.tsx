import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RapportForm } from "@/components/rapport-form";
import { RapportTemplate } from "@/components/rapport-template";
import { templateDataSchema, type TemplateData, type ReportStatus } from "@shared/schema";
import type { Mission, Report } from "@shared/schema";

const reportStatusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  draft: { label: "Brouillon", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-950/40", border: "border-gray-200 dark:border-gray-800", dot: "bg-gray-500" },
  in_progress: { label: "En cours", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  completed: { label: "Termine", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  validated: { label: "Valide", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
};

const allReportStatuses: ReportStatus[] = ["draft", "in_progress", "completed", "validated"];

export default function MissionRapportPage() {
  const [, params] = useRoute("/missions/:missionId/rapports/:reportId");
  const missionId = params?.missionId;
  const reportId = params?.reportId;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mission, isLoading: missionLoading } = useQuery<Mission>({
    queryKey: ["/api/missions", missionId],
    enabled: !!missionId,
  });

  const { data: report, isLoading: reportLoading } = useQuery<Report>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      const res = await apiRequest("PUT", `/api/reports/${reportId}/template-data`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId] });
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/reports`] });
      toast({ title: "Enregistre", description: "Les donnees du rapport ont ete sauvegardees." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder le rapport.", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: ReportStatus) => {
      const res = await apiRequest("PATCH", `/api/reports/${reportId}`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId] });
      queryClient.invalidateQueries({ queryKey: [`/api/missions/${missionId}/reports`] });
      toast({ title: "Statut mis a jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    },
  });

  const isLoading = missionLoading || reportLoading;

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

  if (!mission || !report) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Rapport non trouvé</h2>
          <p className="text-muted-foreground mb-4">Ce rapport n'existe pas ou a été supprimé.</p>
          <Link href={missionId ? `/missions/${missionId}` : "/missions"}>
            <Button>Retour</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultData = templateDataSchema.parse(report.templateData || {});

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-7 w-7" />
                Rapport - {report.title}
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {(() => {
                    const current = reportStatusConfig[report.status] || reportStatusConfig.draft;
                    return (
                      <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-opacity hover:opacity-80 ${current.color} ${current.bg} ${current.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
                        {current.label}
                        <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
                      </button>
                    );
                  })()}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                  {allReportStatuses.map((key) => {
                    const s = reportStatusConfig[key];
                    const isActive = key === report.status;
                    return (
                      <DropdownMenuItem
                        key={key}
                        disabled={isActive}
                        onClick={() => statusMutation.mutate(key)}
                        className={isActive ? "opacity-50" : ""}
                      >
                        <span className={`h-2 w-2 rounded-full mr-2 ${s.dot}`} />
                        {s.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

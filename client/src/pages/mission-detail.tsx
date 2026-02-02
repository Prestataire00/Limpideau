import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Edit, FileText, Calendar, MapPin, User, Mail, Phone, Euro } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Mission } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_progress: { label: "En cours", variant: "default" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

export default function MissionDetailPage() {
  const [, params] = useRoute("/missions/:id");
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

  const status = statusConfig[mission.status] || statusConfig.pending;

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
              <Badge variant={status.variant} data-testid="badge-status">
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Référence: {mission.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/missions/${mission.id}/template`}>
            <Button variant="outline" data-testid="button-view-template">
              <FileText className="h-4 w-4 mr-2" />
              Voir le template
            </Button>
          </Link>
          <Link href={`/missions/${mission.id}/edit`}>
            <Button data-testid="button-edit">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem
                icon={Calendar}
                label="Date de début"
                value={format(new Date(mission.startDate), "d MMMM yyyy", { locale: fr })}
                testId="text-start-date"
              />
              <Separator />
              <InfoItem
                icon={Calendar}
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

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, Download, Mail, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Mission } from "@shared/schema";

interface MissionTemplateProps {
  mission: Mission;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function MissionTemplate({ mission }: MissionTemplateProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const templateText = generateTemplateText(mission);
    await navigator.clipboard.writeText(templateText);
    setCopied(true);
    toast({
      title: "Copié !",
      description: "Le template a été copié dans le presse-papier.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Mission: ${mission.title}`);
    const body = encodeURIComponent(generateTemplateText(mission));
    window.open(`mailto:${mission.clientEmail || ""}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy-template">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copié" : "Copier"}
        </Button>
        {mission.clientEmail && (
          <Button variant="outline" size="sm" onClick={handleEmail} data-testid="button-email-template">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-template">
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0" data-testid="card-template">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold" data-testid="text-template-title">
                {mission.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Référence: {mission.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge variant="outline" className="text-sm print:border-black">
              {statusLabels[mission.status] || mission.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3 text-primary">Informations Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Nom" value={mission.clientName} testId="text-client-name" />
              <InfoRow label="Email" value={mission.clientEmail} testId="text-client-email" />
              <InfoRow label="Téléphone" value={mission.clientPhone} testId="text-client-phone" />
              <InfoRow label="Lieu" value={mission.location} testId="text-location" />
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-lg font-semibold mb-3 text-primary">Détails de la Mission</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                label="Date de début"
                value={format(new Date(mission.startDate), "d MMMM yyyy", { locale: fr })}
                testId="text-start-date"
              />
              <InfoRow
                label="Date de fin"
                value={mission.endDate ? format(new Date(mission.endDate), "d MMMM yyyy", { locale: fr }) : "Non définie"}
                testId="text-end-date"
              />
              <InfoRow
                label="Budget"
                value={mission.budget ? `${mission.budget.toLocaleString("fr-FR")} €` : "Non défini"}
                testId="text-budget"
              />
              <InfoRow
                label="Statut"
                value={statusLabels[mission.status] || mission.status}
                testId="text-status"
              />
            </div>
          </section>

          {mission.description && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">Description</h3>
                <p className="text-foreground whitespace-pre-wrap" data-testid="text-description">
                  {mission.description}
                </p>
              </section>
            </>
          )}

          {mission.notes && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">Notes</h3>
                <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">
                  {mission.notes}
                </p>
              </section>
            </>
          )}

          <Separator />

          <section className="print:hidden">
            <p className="text-xs text-muted-foreground">
              Créé le {format(new Date(mission.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
              {mission.updatedAt && mission.updatedAt !== mission.createdAt && (
                <> • Mis à jour le {format(new Date(mission.updatedAt), "d MMMM yyyy à HH:mm", { locale: fr })}</>
              )}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, testId }: { label: string; value?: string | null; testId?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium" data-testid={testId}>
        {value || "-"}
      </span>
    </div>
  );
}

function generateTemplateText(mission: Mission): string {
  const lines = [
    `MISSION: ${mission.title}`,
    `Référence: ${mission.id.slice(0, 8).toUpperCase()}`,
    "",
    "=== INFORMATIONS CLIENT ===",
    `Nom: ${mission.clientName}`,
    `Email: ${mission.clientEmail || "-"}`,
    `Téléphone: ${mission.clientPhone || "-"}`,
    `Lieu: ${mission.location || "-"}`,
    "",
    "=== DÉTAILS DE LA MISSION ===",
    `Date de début: ${format(new Date(mission.startDate), "d MMMM yyyy", { locale: fr })}`,
    `Date de fin: ${mission.endDate ? format(new Date(mission.endDate), "d MMMM yyyy", { locale: fr }) : "Non définie"}`,
    `Budget: ${mission.budget ? `${mission.budget.toLocaleString("fr-FR")} €` : "Non défini"}`,
    `Statut: ${statusLabels[mission.status] || mission.status}`,
  ];

  if (mission.description) {
    lines.push("", "=== DESCRIPTION ===", mission.description);
  }

  if (mission.notes) {
    lines.push("", "=== NOTES ===", mission.notes);
  }

  return lines.join("\n");
}

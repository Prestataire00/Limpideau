import { useState } from "react";
import { Printer, Mail, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { visiteEquipements, type TemplateData } from "@shared/schema";
import type { Mission } from "@shared/schema";

interface RapportTemplateProps {
  mission: Mission;
  data: TemplateData;
}

export function RapportTemplate({ mission, data }: RapportTemplateProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText(data));
    setCopied(true);
    toast({ title: "Copie !", description: "Le rapport a ete copie dans le presse-papier." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Rapport Reservoir - ${data.nomReservoir || mission.title}`);
    const body = encodeURIComponent(generateText(data));
    window.open(`mailto:${mission.clientEmail || ""}?subject=${subject}&body=${body}`);
  };

  const encrassementLabel = ["", "Propre", "Peu encrasse", "Moyennement encrasse", "Encrasse", "Tres encrasse"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copie" : "Copier"}
        </Button>
        {mission.clientEmail && (
          <Button variant="outline" size="sm" onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0 max-w-4xl mx-auto">
        <CardContent className="p-8 space-y-6 print:p-4">
          {/* Titre */}
          <div className="text-center border-b-2 border-primary pb-4">
            <h1 className="text-xl font-bold uppercase tracking-wide">
              Rapport de Nettoyage et Visite des Reservoirs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">EP 9001-1</p>
          </div>

          {/* En-tete */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">En-tete</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              <Cell label="Commune" value={data.commune} />
              <Cell label="N. Cuve" value={data.numeroCuve} />
              <Cell label="Reservoir" value={data.nomReservoir} />
              <Cell label="Volume" value={data.volume ? `${data.volume} m3` : ""} />
              <Cell label="Date" value={data.date} />
              <Cell label="Heure debut" value={data.heureDebut} />
              <Cell label="Heure fin" value={data.heureFin} />
            </div>
          </div>

          {/* Nettoyage */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Nettoyage</div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Motif :</span>
                  <div className="mt-1 space-y-1">
                    <CheckItem label="Entretien annuel" checked={data.motifEntretienAnnuel} />
                    {data.motifAutres && <p className="text-sm ml-6">Autres : {data.motifAutres}</p>}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Type :</span>
                  <div className="mt-1 space-y-1">
                    <CheckItem label="Chimique" checked={data.typeChimique} />
                    {data.typeAutres && <p className="text-sm ml-6">Autres : {data.typeAutres}</p>}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Produits employes</span>
                  <p className="font-medium">{data.produitsEmployes || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Quantite</span>
                  <p className="font-medium">{data.quantite || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Intervenants */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Intervenants</div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CheckItem label="Equipe LDE" checked={data.equipeLDE} />
                  {data.nomsAgents && (
                    <p className="text-sm ml-6 mt-1">Agents : {data.nomsAgents}</p>
                  )}
                </div>
                <div>
                  <CheckItem label="Sous-traitant" checked={data.sousTraitant} />
                  {data.nomEntreprise && (
                    <p className="text-sm ml-6 mt-1">Entreprise : {data.nomEntreprise}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Observations</div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Etat d'encrassement :</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-6 h-6 rounded border text-xs flex items-center justify-center font-medium ${
                          n <= data.etatEncrassement
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border"
                        }`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium ml-2">
                    {encrassementLabel[data.etatEncrassement] || ""}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Observations :</span>
                <p className="mt-1 whitespace-pre-wrap">{data.observations || "-"}</p>
              </div>
            </div>
          </div>

          {/* Etabli par nettoyage */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Etabli par (Nettoyage)</div>
            <div className="p-4">
              <span className="text-sm text-muted-foreground">Nom :</span>
              <p className="font-medium">{data.etabliParNettoyage || "-"}</p>
            </div>
          </div>

          {/* Controles qualite */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Controles qualite</div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Date d'analyse</span>
                  <p className="font-medium">{data.dateAnalyse || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Chlore residuel</span>
                  <p className="font-medium">{data.chloreResiduel || "-"}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Observations :</span>
                <p className="mt-1 whitespace-pre-wrap">{data.observationsControle || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Bacteriologie :</span>
                <div className="flex gap-6 mt-1">
                  <CheckItem label="Conforme" checked={data.bacterioConforme} />
                  <CheckItem label="Non conforme" checked={data.bacterioNonConforme} />
                </div>
              </div>
            </div>
          </div>

          {/* Etabli par controles */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Etabli par (Controles)</div>
            <div className="p-4">
              <span className="text-sm text-muted-foreground">Nom :</span>
              <p className="font-medium">{data.etabliParControles || "-"}</p>
            </div>
          </div>

          {/* Visite des equipements */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm uppercase">Visite des equipements</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-3 font-medium">Equipement</th>
                    <th className="text-center py-2 px-3 font-medium w-16">Etat</th>
                    <th className="text-left py-2 px-3 font-medium">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {visiteEquipements.map((equip) => {
                    const item = data.visite?.[equip];
                    return (
                      <tr key={equip} className="border-b last:border-0">
                        <td className="py-2 px-3">{equip}</td>
                        <td className="py-2 px-3 text-center">
                          {item?.bon ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700 text-xs font-bold dark:bg-green-900 dark:text-green-300">
                              &#10003;
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {item?.observations || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Cell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-background p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium text-sm">{value || "-"}</p>
    </div>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
          checked
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border"
        }`}
      >
        {checked && "✓"}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function generateText(data: TemplateData): string {
  const lines = [
    "RAPPORT DE NETTOYAGE ET VISITE DES RESERVOIRS",
    "EP 9001-1",
    "",
    "=== EN-TETE ===",
    `Commune: ${data.commune || "-"}`,
    `N. Cuve: ${data.numeroCuve || "-"}`,
    `Reservoir: ${data.nomReservoir || "-"}`,
    `Volume: ${data.volume || "-"} m3`,
    `Date: ${data.date || "-"}`,
    `Heure debut: ${data.heureDebut || "-"}`,
    `Heure fin: ${data.heureFin || "-"}`,
    "",
    "=== NETTOYAGE ===",
    `Motif - Entretien annuel: ${data.motifEntretienAnnuel ? "Oui" : "Non"}`,
    `Motif - Autres: ${data.motifAutres || "-"}`,
    `Type - Chimique: ${data.typeChimique ? "Oui" : "Non"}`,
    `Type - Autres: ${data.typeAutres || "-"}`,
    `Produits employes: ${data.produitsEmployes || "-"}`,
    `Quantite: ${data.quantite || "-"}`,
    "",
    "=== INTERVENANTS ===",
    `Equipe LDE: ${data.equipeLDE ? "Oui" : "Non"}`,
    `Agents: ${data.nomsAgents || "-"}`,
    `Sous-traitant: ${data.sousTraitant ? "Oui" : "Non"}`,
    `Entreprise: ${data.nomEntreprise || "-"}`,
    "",
    "=== OBSERVATIONS ===",
    `Etat encrassement: ${data.etatEncrassement}/5`,
    `Observations: ${data.observations || "-"}`,
    "",
    `Etabli par (Nettoyage): ${data.etabliParNettoyage || "-"}`,
    "",
    "=== CONTROLES QUALITE ===",
    `Date analyse: ${data.dateAnalyse || "-"}`,
    `Chlore residuel: ${data.chloreResiduel || "-"}`,
    `Observations: ${data.observationsControle || "-"}`,
    `Bacteriologie: ${data.bacterioConforme ? "Conforme" : data.bacterioNonConforme ? "Non conforme" : "-"}`,
    "",
    `Etabli par (Controles): ${data.etabliParControles || "-"}`,
    "",
    "=== VISITE DES EQUIPEMENTS ===",
  ];

  for (const equip of visiteEquipements) {
    const item = data.visite?.[equip];
    lines.push(`${equip}: ${item?.bon ? "Bon" : "-"} | ${item?.observations || "-"}`);
  }

  return lines.join("\n");
}

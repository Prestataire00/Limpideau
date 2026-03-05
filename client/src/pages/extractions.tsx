import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Download, FileText, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/mission-card";
import { useToast } from "@/hooks/use-toast";
import { templateDataSchema, visiteEquipements, type TemplateData } from "@shared/schema";
import type { Mission, Report } from "@shared/schema";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import suezLogo from "@assets/image_1771672165186.png";

type MissionWithReports = Mission & { reports: Report[] };

export default function ExtractionsPage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [generating, setGenerating] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: missionsWithReports, isLoading } = useQuery<MissionWithReports[]>({
    queryKey: ["/api/extractions/daily-reports", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/extractions/daily-reports?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedDate,
  });

  const completedMissions = (missionsWithReports || []).filter(
    (m) => m.reports.length > 0
  );

  // Flatten missions+reports into exportable items
  const allReportItems: { mission: MissionWithReports; report: Report; td: TemplateData }[] = [];
  for (const mission of completedMissions) {
    for (const report of mission.reports) {
      const td = templateDataSchema.parse(report.templateData || {});
      allReportItems.push({ mission, report, td });
    }
  }

  const isDateExported = (date: string) => {
    const exported: string[] = JSON.parse(localStorage.getItem("limpideau-exported-dates") || "[]");
    return exported.includes(date);
  };

  const markDateExported = (date: string) => {
    const exported: string[] = JSON.parse(localStorage.getItem("limpideau-exported-dates") || "[]");
    if (!exported.includes(date)) {
      exported.push(date);
      if (exported.length > 90) exported.splice(0, exported.length - 90);
      localStorage.setItem("limpideau-exported-dates", JSON.stringify(exported));
    }
  };

  const alreadyExported = isDateExported(selectedDate);

  const generatePdfForReport = async (
    container: HTMLDivElement,
    td: TemplateData,
    mission: Mission,
    pdf: jsPDF,
    addPage: boolean
  ) => {
    container.innerHTML = renderRapportHtml(td, mission);

    const imgs = container.querySelectorAll("img");
    await Promise.all(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
    await new Promise((r) => setTimeout(r, 200));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (addPage) pdf.addPage();

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  };

  const handleExportAll = useCallback(async () => {
    if (!allReportItems.length) return;
    setGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const container = renderRef.current;
      if (!container) return;

      let first = true;
      for (const { mission, td } of allReportItems) {
        await generatePdfForReport(container, td, mission, pdf, !first);
        first = false;
      }

      container.innerHTML = "";

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Extraction_Rapports_${selectedDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      markDateExported(selectedDate);
      toast({
        title: "Extraction terminee",
        description: `${allReportItems.length} rapport(s) exporte(s) en PDF.`,
      });
    } catch (_e) {
      toast({
        title: "Erreur",
        description: "Impossible de generer l'extraction.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }, [allReportItems, selectedDate, toast]);

  // Auto-export once per day (today only)
  const autoExportTriggered = useRef(false);
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    if (
      selectedDate === today &&
      allReportItems.length > 0 &&
      !isLoading &&
      !generating &&
      !autoExportTriggered.current &&
      !isDateExported(today)
    ) {
      autoExportTriggered.current = true;
      handleExportAll();
    }
  }, [selectedDate, allReportItems, isLoading, generating, handleExportAll]);

  const handleExportSingle = async (mission: MissionWithReports, report: Report) => {
    setGenerating(true);
    try {
      const td = templateDataSchema.parse(report.templateData || {});
      const container = renderRef.current;
      if (!container) return;

      const pdf = new jsPDF("p", "mm", "a4");
      await generatePdfForReport(container, td, mission, pdf, false);
      container.innerHTML = "";

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rapport_${td.nomReservoir || report.title}_${td.date || selectedDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "PDF genere", description: "Le rapport a ete telecharge." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de generer le PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Extraction journaliere
        </h1>
        <p className="text-muted-foreground mt-1">
          Exporter les rapports des missions terminees par date
        </p>
      </div>

      {/* Date picker + export button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="extractionDate">Date</Label>
              <Input
                id="extractionDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              onClick={handleExportAll}
              disabled={generating || !allReportItems.length}
              size="lg"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {generating
                ? "Generation en cours..."
                : alreadyExported
                  ? `Re-exporter (${allReportItems.length})`
                  : `Exporter tout (${allReportItems.length})`}
            </Button>
            {alreadyExported && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Deja exporte
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : allReportItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun rapport termine</h3>
            <p className="text-muted-foreground mt-1">
              Aucune mission terminee avec rapport pour le{" "}
              {format(new Date(selectedDate + "T00:00:00"), "d MMMM yyyy", { locale: fr })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {allReportItems.length} rapport(s) pour le{" "}
            {format(new Date(selectedDate + "T00:00:00"), "d MMMM yyyy", { locale: fr })}
          </h2>
          {allReportItems.map(({ mission, report, td }) => (
            <Card key={report.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{mission.title} - {report.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {td.commune && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {td.commune}
                        </span>
                      )}
                      {td.nomReservoir && (
                        <span>Reservoir : {td.nomReservoir}</span>
                      )}
                      <StatusBadge status="completed" />
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle(mission, report)}
                  disabled={generating}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Off-screen render container for PDF generation */}
      <div
        ref={renderRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          background: "white",
        }}
      />
    </div>
  );
}

function renderRapportHtml(data: TemplateData, mission: Mission): string {
  const cb = (checked: boolean) => (checked ? "&#9745;" : "&#9744;");
  const toArray = (val: unknown): string[] =>
    Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [];

  const agents = toArray(data.nomsAgents);
  const entreprises = toArray(data.nomsEntreprises);
  const pAvant = toArray(data.photosAvant);
  const pApres = toArray(data.photosApres);

  const encrassementBoxes = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid black;background:${
          n <= data.etatEncrassement ? "#0032A0" : "white"
        };color:${n <= data.etatEncrassement ? "white" : "black"};font-size:11px;font-weight:bold;margin-right:2px;">${n}</span>`
    )
    .join("");

  const equipRows = visiteEquipements
    .map((equip) => {
      const item = data.visite?.[equip];
      return `<tr>
        <td style="border:1px solid black;padding:4px 6px;font-size:11px;">${equip}</td>
        <td style="border:1px solid black;padding:4px 6px;text-align:center;font-size:13px;">${cb(item?.bon ?? false)}</td>
        <td style="border:1px solid black;padding:4px 6px;font-size:11px;">${item?.observations || ""}</td>
      </tr>`;
    })
    .join("");

  const photosAvantHtml = pAvant.length
    ? pAvant.map((p) => `<img src="${p}" style="width:100%;max-height:180px;object-fit:contain;margin-bottom:4px;" />`).join("")
    : `<div style="height:160px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;">Zone photo avant</div>`;

  const photosApresHtml = pApres.length
    ? pApres.map((p) => `<img src="${p}" style="width:100%;max-height:180px;object-fit:contain;margin-bottom:4px;" />`).join("")
    : `<div style="height:160px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;">Zone photo apres</div>`;

  const sectionHeader = (title: string) =>
    `<div style="background:#0032A0;color:white;padding:6px 12px;font-weight:bold;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${title}</div>`;

  const tdCell = (label: string, value: string) =>
    `<td style="border:1px solid black;padding:6px 8px;">
      <div style="font-size:10px;font-weight:bold;">${label}</div>
      <div style="font-size:12px;">${value || ""}</div>
    </td>`;

  const signatureHtml = (sig: string) =>
    sig
      ? `<img src="${sig}" style="height:50px;object-fit:contain;" />`
      : `<div style="height:50px;border-bottom:1px solid #ccc;"></div>`;

  return `
    <div style="font-family:Arial,sans-serif;border:2px solid black;background:white;color:black;">
      <table style="width:100%;border-collapse:collapse;border-bottom:2px solid black;">
        <tr>
          <td style="padding:12px;width:150px;vertical-align:middle;">
            <img src="${suezLogo}" style="width:130px;height:auto;" />
          </td>
          <td style="text-align:center;padding:12px;vertical-align:middle;">
            <div style="font-size:14px;font-weight:bold;text-transform:uppercase;">Rapport Nettoyage et Visite des Reservoirs</div>
          </td>
          <td style="text-align:right;padding:12px;width:120px;vertical-align:middle;">
            <div style="font-size:10px;color:#666;">E EP 9001-1</div>
          </td>
        </tr>
      </table>

      ${sectionHeader("SITE")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>${tdCell("Commune", data.commune)}${tdCell("N&deg; cuve", data.numeroCuve)}</tr>
        <tr>${tdCell("Nom du reservoir", data.nomReservoir)}${tdCell("Volume (m&sup3;)", data.volume)}</tr>
      </table>

      ${sectionHeader("DATE")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>${tdCell("Date", data.date)}${tdCell("Heure debut", data.heureDebut)}${tdCell("Heure fin", data.heureFin)}</tr>
      </table>

      ${sectionHeader("NETTOYAGE")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="border:1px solid black;padding:8px;width:50%;vertical-align:top;">
            <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Motif</div>
            <div style="font-size:12px;">${cb(data.motifEntretienAnnuel)} Entretien annuel</div>
            <div style="font-size:12px;">${cb(!!data.motifAutres)} Autres : ${data.motifAutres || ""}</div>
          </td>
          <td style="border:1px solid black;padding:8px;vertical-align:top;">
            <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Type</div>
            <div style="font-size:12px;">${cb(data.typeChimique)} Chimique</div>
            <div style="font-size:12px;">${cb(!!data.typeAutres)} Autres : ${data.typeAutres || ""}</div>
          </td>
        </tr>
        <tr>
          <td style="border:1px solid black;padding:6px 8px;">
            <div style="font-size:10px;font-weight:bold;">Produits employes</div>
            <div style="font-size:12px;">- Herli rapide tw fcm1<br/>- Panox<br/>- Chlore</div>
          </td>
          <td style="border:1px solid black;padding:6px 8px;">
            <div style="font-size:10px;font-weight:bold;">Quantite</div>
            <div style="font-size:12px;">${data.quantiteHerli || ""}<br/>${data.quantitePanox || ""}<br/>${data.quantiteChlore || ""}</div>
          </td>
        </tr>
      </table>

      ${sectionHeader("INTERVENANTS")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="border:1px solid black;padding:8px;width:50%;vertical-align:top;">
            <div style="font-size:12px;">${cb(data.equipeLDE)} Equipe Lyonnaise des Eaux</div>
            <div style="font-size:10px;margin-top:4px;">Noms agents : ${agents.length ? agents.join(", ") : ""}</div>
          </td>
          <td style="border:1px solid black;padding:8px;vertical-align:top;">
            <div style="font-size:12px;">${cb(data.sousTraitant)} Sous-traitant</div>
            <div style="font-size:10px;margin-top:4px;">Entreprises : ${entreprises.length ? entreprises.join(", ") : ""}</div>
          </td>
        </tr>
      </table>

      ${sectionHeader("OBSERVATIONS")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="border:1px solid black;padding:8px;width:200px;">
            <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Encrassement (1 a 5)</div>
            ${encrassementBoxes}
          </td>
          <td style="border:1px solid black;padding:8px;">
            <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Autres observations</div>
            <div style="font-size:12px;white-space:pre-wrap;min-height:30px;">${data.observations || ""}</div>
          </td>
        </tr>
      </table>

      ${sectionHeader("ETABLI PAR")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          ${tdCell("Nom", data.etabliParNettoyage)}
          <td style="border:1px solid black;padding:6px 8px;">
            <div style="font-size:10px;font-weight:bold;">Signature</div>
            ${signatureHtml(data.signatureNettoyage)}
          </td>
        </tr>
      </table>

      ${sectionHeader("CONTROLES QUALITE")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>${tdCell("Date analyse", data.dateAnalyse)}${tdCell("Chlore residuel", data.chloreResiduel)}</tr>
        <tr><td colspan="2" style="border:1px solid black;padding:8px;">
          <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Observations</div>
          <div style="font-size:12px;white-space:pre-wrap;min-height:20px;">${data.observationsControle || ""}</div>
        </td></tr>
        <tr><td colspan="2" style="border:1px solid black;padding:8px;">
          <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Bacteriologie</div>
          <div style="font-size:12px;">${cb(data.bacterioConforme)} Conforme &nbsp;&nbsp;&nbsp; ${cb(data.bacterioNonConforme)} Non conforme</div>
        </td></tr>
      </table>

      ${sectionHeader("ETABLI PAR")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          ${tdCell("Nom", data.etabliParControles)}
          <td style="border:1px solid black;padding:6px 8px;">
            <div style="font-size:10px;font-weight:bold;">Signature</div>
            ${signatureHtml(data.signatureControles)}
          </td>
        </tr>
      </table>

      ${sectionHeader("VISITE")}
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#E8E8E8;">
          <th style="border:1px solid black;padding:6px;text-align:left;font-size:11px;font-weight:bold;">Equipement</th>
          <th style="border:1px solid black;padding:6px;text-align:center;font-size:11px;font-weight:bold;width:60px;">Bon</th>
          <th style="border:1px solid black;padding:6px;text-align:left;font-size:11px;font-weight:bold;">Observations</th>
        </tr>
        ${equipRows}
      </table>

      ${sectionHeader("PHOTOS")}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="border:1px solid black;padding:12px;width:50%;text-align:center;vertical-align:top;">
            <div style="font-size:11px;font-weight:bold;color:#0032A0;margin-bottom:8px;">PHOTO AVANT</div>
            ${photosAvantHtml}
          </td>
          <td style="border:1px solid black;padding:12px;text-align:center;vertical-align:top;">
            <div style="font-size:11px;font-weight:bold;color:#0032A0;margin-bottom:8px;">PHOTO APRES</div>
            ${photosApresHtml}
          </td>
        </tr>
      </table>
    </div>
  `;
}

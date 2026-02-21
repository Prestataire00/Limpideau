import { useState } from "react";
import { Printer, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { visiteEquipements, type TemplateData } from "@shared/schema";
import type { Mission } from "@shared/schema";
import suezLogo from "@assets/image_1771672165186.png";

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

  const cb = (checked: boolean) => checked ? "☑" : "☐";
  const toArray = (val: unknown): string[] =>
    Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [];

  const produits = toArray(data.produitsEmployes);
  const agents = toArray(data.nomsAgents);
  const entreprises = toArray(data.nomsEntreprises);
  const pAvant = toArray(data.photosAvant);
  const pApres = toArray(data.photosApres);

  return (
    <div className="space-y-4">
      {/* Action buttons - hidden when printing */}
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copie" : "Copier"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Envoyer par mail
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .rapport-excel, .rapport-excel * { visibility: visible; }
          .rapport-excel {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            margin: 0;
            padding: 10mm;
            font-size: 9pt;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .rapport-excel * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .rapport-excel table { page-break-inside: auto; }
          .rapport-excel tr { page-break-inside: avoid; }
          .rapport-page-break { page-break-before: always; }
        }
      `}</style>

      {/* Rapport content - Excel faithful reproduction */}
      <div className="rapport-excel max-w-4xl mx-auto bg-white text-black border border-black" style={{ fontFamily: "Arial, sans-serif" }}>

        {/* === HEADER: Logo + Title === */}
        <table className="w-full border-collapse" style={{ borderBottom: "2px solid black" }}>
          <tbody>
            <tr>
              <td className="p-3 align-middle" style={{ width: "150px" }}>
                <img src={suezLogo} alt="SUEZ" style={{ width: "130px", height: "auto" }} />
              </td>
              <td className="text-center p-3 align-middle">
                <div style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>
                  Rapport Nettoyage et Visite des Reservoirs
                </div>
              </td>
              <td className="text-right p-3 align-middle" style={{ width: "120px" }}>
                <div style={{ fontSize: "10px", color: "#666" }}>E EP 9001-1</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* === SITE === */}
        <SectionHeader title="SITE" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td label="Commune" value={data.commune} />
              <Td label="N° cuve" value={data.numeroCuve} />
            </tr>
            <tr>
              <Td label="Nom du reservoir" value={data.nomReservoir} />
              <Td label="Volume (m³)" value={data.volume} />
            </tr>
          </tbody>
        </table>

        {/* === DATE === */}
        <SectionHeader title="DATE" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td label="Date" value={data.date} />
              <Td label="Heure debut" value={data.heureDebut} />
              <Td label="Heure fin" value={data.heureFin} />
            </tr>
          </tbody>
        </table>

        {/* === NETTOYAGE === */}
        <SectionHeader title="NETTOYAGE" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top" style={{ width: "50%" }}>
                <div className="text-xs font-bold mb-1">Motif</div>
                <div className="text-sm space-y-1">
                  <div>{cb(data.motifEntretienAnnuel)} Entretien annuel</div>
                  <div>{cb(!!data.motifAutres)} Autres : {data.motifAutres || ""}</div>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <div className="text-xs font-bold mb-1">Type</div>
                <div className="text-sm space-y-1">
                  <div>{cb(data.typeChimique)} Chimique</div>
                  <div>{cb(!!data.typeAutres)} Autres : {data.typeAutres || ""}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <div className="text-xs font-bold">Produits employes</div>
                <div className="text-sm">
                  {produits.length > 0
                    ? produits.map((p, i) => <div key={i}>- {p}</div>)
                    : ""}
                </div>
              </td>
              <Td label="Quantite" value={data.quantite} />
            </tr>
          </tbody>
        </table>

        {/* === INTERVENANTS === */}
        <SectionHeader title="INTERVENANTS" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top" style={{ width: "50%" }}>
                <div className="text-sm">
                  <div>{cb(data.equipeLDE)} Equipe Lyonnaise des Eaux</div>
                  <div className="mt-1 text-xs">
                    Noms agents :
                    {agents.length > 0
                      ? agents.map((a, i) => <div key={i} className="ml-2">- {a}</div>)
                      : ""}
                  </div>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <div className="text-sm">
                  <div>{cb(data.sousTraitant)} Sous-traitant</div>
                  <div className="mt-1 text-xs">
                    Entreprises :
                    {entreprises.length > 0
                      ? entreprises.map((e, i) => <div key={i} className="ml-2">- {e}</div>)
                      : ""}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* === OBSERVATIONS === */}
        <SectionHeader title="OBSERVATIONS" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-black p-2" style={{ width: "200px" }}>
                <div className="text-xs font-bold mb-1">Encrassement (1 a 5)</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center justify-center text-xs font-bold"
                      style={{
                        width: "22px",
                        height: "22px",
                        border: "1px solid black",
                        backgroundColor: n <= data.etatEncrassement ? "#0032A0" : "white",
                        color: n <= data.etatEncrassement ? "white" : "black",
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </td>
              <td className="border border-black p-2">
                <div className="text-xs font-bold mb-1">Autres observations</div>
                <div className="text-sm whitespace-pre-wrap min-h-[40px]">{data.observations || ""}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* === ETABLI PAR (Nettoyage) === */}
        <SectionHeader title="ETABLI PAR" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td label="Nom" value={data.etabliParNettoyage} />
              <td className="border border-black p-2">
                <div className="text-xs font-bold">Signature</div>
                {data.signatureNettoyage ? (
                  <img src={data.signatureNettoyage} alt="Signature" style={{ height: "50px", objectFit: "contain" }} />
                ) : (
                  <div style={{ height: "50px", borderBottom: "1px solid #ccc" }} />
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* === CONTROLES QUALITE === */}
        <SectionHeader title="CONTROLES QUALITE" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td label="Date analyse" value={data.dateAnalyse} />
              <Td label="Chlore residuel" value={data.chloreResiduel} />
            </tr>
            <tr>
              <td className="border border-black p-2" colSpan={2}>
                <div className="text-xs font-bold mb-1">Observations</div>
                <div className="text-sm whitespace-pre-wrap min-h-[30px]">{data.observationsControle || ""}</div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2" colSpan={2}>
                <div className="text-xs font-bold mb-1">Bacteriologie</div>
                <div className="text-sm flex gap-6">
                  <span>{cb(data.bacterioConforme)} Conforme</span>
                  <span>{cb(data.bacterioNonConforme)} Non conforme</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* === ETABLI PAR (Controles) === */}
        <SectionHeader title="ETABLI PAR" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td label="Nom" value={data.etabliParControles} />
              <td className="border border-black p-2">
                <div className="text-xs font-bold">Signature</div>
                {data.signatureControles ? (
                  <img src={data.signatureControles} alt="Signature" style={{ height: "50px", objectFit: "contain" }} />
                ) : (
                  <div style={{ height: "50px", borderBottom: "1px solid #ccc" }} />
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* === VISITE === */}
        <div className="rapport-page-break" />
        <SectionHeader title="VISITE" />
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ backgroundColor: "#E8E8E8" }}>
              <th className="border border-black p-2 text-left font-bold text-xs">Equipement</th>
              <th className="border border-black p-2 text-center font-bold text-xs" style={{ width: "60px" }}>Bon</th>
              <th className="border border-black p-2 text-left font-bold text-xs">Observations</th>
            </tr>
          </thead>
          <tbody>
            {visiteEquipements.map((equip) => {
              const item = data.visite?.[equip];
              return (
                <tr key={equip}>
                  <td className="border border-black p-1.5 text-xs">{equip}</td>
                  <td className="border border-black p-1.5 text-center text-sm">
                    {cb(item?.bon ?? false)}
                  </td>
                  <td className="border border-black p-1.5 text-xs">
                    {item?.observations || ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* === PHOTOS === */}
        <SectionHeader title="PHOTOS" />
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-black p-3 text-center align-top" style={{ width: "50%" }}>
                <div className="text-xs font-bold mb-2" style={{ color: "#0032A0" }}>PHOTO AVANT</div>
                <div className="space-y-2">
                  {pAvant.length > 0 ? (
                    pAvant.map((photo, i) => (
                      <img key={i} src={photo} alt={`Avant ${i + 1}`} style={{ width: "100%", maxHeight: "180px", objectFit: "contain" }} />
                    ))
                  ) : (
                    <div className="border border-dashed border-gray-400 flex items-center justify-center" style={{ height: "160px" }}>
                      <span className="text-gray-400 text-xs">Zone photo avant intervention</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="border border-black p-3 text-center align-top">
                <div className="text-xs font-bold mb-2" style={{ color: "#0032A0" }}>PHOTO APRES</div>
                <div className="space-y-2">
                  {pApres.length > 0 ? (
                    pApres.map((photo, i) => (
                      <img key={i} src={photo} alt={`Apres ${i + 1}`} style={{ width: "100%", maxHeight: "180px", objectFit: "contain" }} />
                    ))
                  ) : (
                    <div className="border border-dashed border-gray-400 flex items-center justify-center" style={{ height: "160px" }}>
                      <span className="text-gray-400 text-xs">Zone photo apres intervention</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      className="px-3 py-1.5 font-bold text-xs uppercase tracking-wide text-white"
      style={{ backgroundColor: "#0032A0" }}
    >
      {title}
    </div>
  );
}

function Td({ label, value }: { label: string; value?: string }) {
  return (
    <td className="border border-black p-2">
      <div className="text-xs font-bold">{label}</div>
      <div className="text-sm">{value || ""}</div>
    </td>
  );
}

function generateText(data: TemplateData): string {
  const toArr = (val: unknown): string[] =>
    Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [];
  const lines = [
    "RAPPORT DE NETTOYAGE ET VISITE DES RESERVOIRS",
    "EP 9001-1",
    "",
    "=== SITE ===",
    `Commune: ${data.commune || "-"}`,
    `N° Cuve: ${data.numeroCuve || "-"}`,
    `Reservoir: ${data.nomReservoir || "-"}`,
    `Volume: ${data.volume || "-"} m³`,
    "",
    "=== DATE ===",
    `Date: ${data.date || "-"}`,
    `Heure debut: ${data.heureDebut || "-"}`,
    `Heure fin: ${data.heureFin || "-"}`,
    "",
    "=== NETTOYAGE ===",
    `Motif - Entretien annuel: ${data.motifEntretienAnnuel ? "Oui" : "Non"}`,
    `Motif - Autres: ${data.motifAutres || "-"}`,
    `Type - Chimique: ${data.typeChimique ? "Oui" : "Non"}`,
    `Type - Autres: ${data.typeAutres || "-"}`,
    `Produits employes: ${toArr(data.produitsEmployes).join(", ") || "-"}`,
    `Quantite: ${data.quantite || "-"}`,
    "",
    "=== INTERVENANTS ===",
    `Equipe LDE: ${data.equipeLDE ? "Oui" : "Non"}`,
    `Agents: ${toArr(data.nomsAgents).join(", ") || "-"}`,
    `Sous-traitant: ${data.sousTraitant ? "Oui" : "Non"}`,
    `Entreprises: ${toArr(data.nomsEntreprises).join(", ") || "-"}`,
    "",
    "=== OBSERVATIONS ===",
    `Encrassement: ${data.etatEncrassement}/5`,
    `Observations: ${data.observations || "-"}`,
    "",
    `Etabli par (Nettoyage): ${data.etabliParNettoyage || "-"}`,
    `Signature: ${data.signatureNettoyage ? "[signee]" : "-"}`,
    "",
    "=== CONTROLES QUALITE ===",
    `Date analyse: ${data.dateAnalyse || "-"}`,
    `Chlore residuel: ${data.chloreResiduel || "-"}`,
    `Observations: ${data.observationsControle || "-"}`,
    `Bacteriologie: ${data.bacterioConforme ? "Conforme" : data.bacterioNonConforme ? "Non conforme" : "-"}`,
    "",
    `Etabli par (Controles): ${data.etabliParControles || "-"}`,
    `Signature: ${data.signatureControles ? "[signee]" : "-"}`,
    "",
    "=== VISITE DES EQUIPEMENTS ===",
  ];

  for (const equip of visiteEquipements) {
    const item = data.visite?.[equip];
    lines.push(`${equip}: ${item?.bon ? "Bon" : "-"} | ${item?.observations || "-"}`);
  }

  return lines.join("\n");
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { templateDataSchema, visiteEquipements, type TemplateData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface RapportFormProps {
  defaultValues: TemplateData;
  onSubmit: (data: TemplateData) => void;
  isPending: boolean;
}

export function RapportForm({ defaultValues, onSubmit, isPending }: RapportFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<TemplateData>({
    resolver: zodResolver(templateDataSchema),
    defaultValues,
  });

  const etatEncrassement = watch("etatEncrassement");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle>En-tete du rapport</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commune">Commune</Label>
            <Input id="commune" {...register("commune")} placeholder="Nom de la commune" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numeroCuve">N. Cuve</Label>
            <Input id="numeroCuve" {...register("numeroCuve")} placeholder="Numero de cuve" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nomReservoir">Nom du reservoir</Label>
            <Input id="nomReservoir" {...register("nomReservoir")} placeholder="Nom du reservoir" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volume">Volume (m3)</Label>
            <Input id="volume" {...register("volume")} placeholder="Volume en m3" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heureDebut">Heure debut</Label>
            <Input id="heureDebut" type="time" {...register("heureDebut")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heureFin">Heure fin</Label>
            <Input id="heureFin" type="time" {...register("heureFin")} />
          </div>
        </CardContent>
      </Card>

      {/* Nettoyage */}
      <Card>
        <CardHeader>
          <CardTitle>Nettoyage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Motif de l'intervention</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="motifEntretienAnnuel"
                  checked={watch("motifEntretienAnnuel")}
                  onCheckedChange={(checked) => setValue("motifEntretienAnnuel", !!checked)}
                />
                <Label htmlFor="motifEntretienAnnuel" className="font-normal">Entretien annuel</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motifAutres" className="font-normal">Autres</Label>
                <Input id="motifAutres" {...register("motifAutres")} placeholder="Preciser..." />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Type de nettoyage</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="typeChimique"
                  checked={watch("typeChimique")}
                  onCheckedChange={(checked) => setValue("typeChimique", !!checked)}
                />
                <Label htmlFor="typeChimique" className="font-normal">Chimique</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeAutres" className="font-normal">Autres</Label>
                <Input id="typeAutres" {...register("typeAutres")} placeholder="Preciser..." />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="produitsEmployes">Produits employes</Label>
              <Input id="produitsEmployes" {...register("produitsEmployes")} placeholder="Noms des produits" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantite">Quantite</Label>
              <Input id="quantite" {...register("quantite")} placeholder="Quantite utilisee" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intervenants */}
      <Card>
        <CardHeader>
          <CardTitle>Intervenants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="equipeLDE"
                  checked={watch("equipeLDE")}
                  onCheckedChange={(checked) => setValue("equipeLDE", !!checked)}
                />
                <Label htmlFor="equipeLDE" className="font-normal">Equipe LDE</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomsAgents">Noms des agents</Label>
                <Input id="nomsAgents" {...register("nomsAgents")} placeholder="Noms des agents" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sousTraitant"
                  checked={watch("sousTraitant")}
                  onCheckedChange={(checked) => setValue("sousTraitant", !!checked)}
                />
                <Label htmlFor="sousTraitant" className="font-normal">Sous-traitant</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomEntreprise">Nom de l'entreprise</Label>
                <Input id="nomEntreprise" {...register("nomEntreprise")} placeholder="Nom de l'entreprise" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Etat d'encrassement: {etatEncrassement}/5</Label>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[etatEncrassement]}
              onValueChange={(value) => setValue("etatEncrassement", value[0])}
              className="w-full max-w-md"
            />
            <div className="flex justify-between text-xs text-muted-foreground max-w-md">
              <span>Propre</span>
              <span>Tres encrasse</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              {...register("observations")}
              placeholder="Observations sur l'etat du reservoir..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Etabli par (nettoyage) */}
      <Card>
        <CardHeader>
          <CardTitle>Etabli par (Nettoyage)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="etabliParNettoyage">Nom</Label>
            <Input id="etabliParNettoyage" {...register("etabliParNettoyage")} placeholder="Nom du responsable" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visaNettoyage">Visa</Label>
            <Input id="visaNettoyage" {...register("visaNettoyage")} placeholder="Visa" />
          </div>
        </CardContent>
      </Card>

      {/* Controles qualite */}
      <Card>
        <CardHeader>
          <CardTitle>Controles qualite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateAnalyse">Date d'analyse</Label>
              <Input id="dateAnalyse" type="date" {...register("dateAnalyse")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chloreResiduel">Chlore residuel</Label>
              <Input id="chloreResiduel" {...register("chloreResiduel")} placeholder="mg/L" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observationsControle">Observations</Label>
            <Textarea
              id="observationsControle"
              {...register("observationsControle")}
              placeholder="Observations sur les controles..."
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Bacteriologie</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bacterioConforme"
                  checked={watch("bacterioConforme")}
                  onCheckedChange={(checked) => {
                    setValue("bacterioConforme", !!checked);
                    if (checked) setValue("bacterioNonConforme", false);
                  }}
                />
                <Label htmlFor="bacterioConforme" className="font-normal">Conforme</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bacterioNonConforme"
                  checked={watch("bacterioNonConforme")}
                  onCheckedChange={(checked) => {
                    setValue("bacterioNonConforme", !!checked);
                    if (checked) setValue("bacterioConforme", false);
                  }}
                />
                <Label htmlFor="bacterioNonConforme" className="font-normal">Non conforme</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etabli par (controles) */}
      <Card>
        <CardHeader>
          <CardTitle>Etabli par (Controles)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="etabliParControles">Nom</Label>
            <Input id="etabliParControles" {...register("etabliParControles")} placeholder="Nom du responsable" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visaControles">Visa</Label>
            <Input id="visaControles" {...register("visaControles")} placeholder="Visa" />
          </div>
        </CardContent>
      </Card>

      {/* Visite des equipements */}
      <Card>
        <CardHeader>
          <CardTitle>Visite des equipements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Equipement</th>
                  <th className="text-center py-2 px-3 font-medium w-20">Bon</th>
                  <th className="text-left py-2 px-3 font-medium">Observations</th>
                </tr>
              </thead>
              <tbody>
                {visiteEquipements.map((equip) => (
                  <tr key={equip} className="border-b last:border-0">
                    <td className="py-2 px-3 text-sm">{equip}</td>
                    <td className="py-2 px-3 text-center">
                      <Checkbox
                        checked={watch(`visite.${equip}.bon`) ?? false}
                        onCheckedChange={(checked) =>
                          setValue(`visite.${equip}.bon`, !!checked)
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        className="h-8 text-sm"
                        value={watch(`visite.${equip}.observations`) ?? ""}
                        onChange={(e) =>
                          setValue(`visite.${equip}.observations`, e.target.value)
                        }
                        placeholder="..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

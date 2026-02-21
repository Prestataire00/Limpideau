import { useForm } from "react-hook-form";
import { visiteEquipements, type TemplateData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save, Plus, X, ImagePlus } from "lucide-react";
import { useRef } from "react";
import { SignaturePad } from "@/components/signature-pad";

interface RapportFormProps {
  defaultValues: TemplateData;
  onSubmit: (data: TemplateData) => void;
  isPending: boolean;
}

export function RapportForm({ defaultValues, onSubmit, isPending }: RapportFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<TemplateData>({
    defaultValues,
  });

  const etatEncrassement = watch("etatEncrassement");
  const toArray = (val: unknown): string[] =>
    Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [];

  const produitsEmployes = toArray(watch("produitsEmployes"));
  const nomsAgents = toArray(watch("nomsAgents"));
  const nomsEntreprises = toArray(watch("nomsEntreprises"));
  const photosAvant = toArray(watch("photosAvant"));
  const photosApres = toArray(watch("photosApres"));

  const photoAvantRef = useRef<HTMLInputElement>(null);
  const photoApresRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (field: "photosAvant" | "photosApres", file: File) => {
    const current = field === "photosAvant" ? photosAvant : photosApres;
    if (current.length >= 2) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setValue(field, [...current, result]);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (field: "photosAvant" | "photosApres", index: number) => {
    const current = field === "photosAvant" ? photosAvant : photosApres;
    setValue(field, current.filter((_, i) => i !== index));
  };

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

          {/* Produits employes - liste dynamique */}
          <div className="space-y-2">
            <Label>Produits employes</Label>
            <div className="space-y-2">
              {produitsEmployes.map((produit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={produit}
                    onChange={(e) => {
                      const updated = [...produitsEmployes];
                      updated[index] = e.target.value;
                      setValue("produitsEmployes", updated);
                    }}
                    placeholder={`Produit ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setValue("produitsEmployes", produitsEmployes.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue("produitsEmployes", [...produitsEmployes, ""])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un produit
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantite">Quantite</Label>
            <Input id="quantite" {...register("quantite")} placeholder="Quantite utilisee" />
          </div>
        </CardContent>
      </Card>

      {/* Intervenants */}
      <Card>
        <CardHeader>
          <CardTitle>Intervenants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="equipeLDE"
                  checked={watch("equipeLDE")}
                  onCheckedChange={(checked) => setValue("equipeLDE", !!checked)}
                />
                <Label htmlFor="equipeLDE" className="font-normal">Equipe LDE</Label>
              </div>
              {/* Noms des agents - liste dynamique */}
              <div className="space-y-2">
                <Label>Noms des agents</Label>
                {nomsAgents.map((agent, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={agent}
                      onChange={(e) => {
                        const updated = [...nomsAgents];
                        updated[index] = e.target.value;
                        setValue("nomsAgents", updated);
                      }}
                      placeholder={`Agent ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setValue("nomsAgents", nomsAgents.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("nomsAgents", [...nomsAgents, ""])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un agent
                </Button>
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
              {/* Noms des entreprises - liste dynamique */}
              <div className="space-y-2">
                <Label>Noms des entreprises</Label>
                {nomsEntreprises.map((entreprise, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={entreprise}
                      onChange={(e) => {
                        const updated = [...nomsEntreprises];
                        updated[index] = e.target.value;
                        setValue("nomsEntreprises", updated);
                      }}
                      placeholder={`Entreprise ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setValue("nomsEntreprises", nomsEntreprises.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("nomsEntreprises", [...nomsEntreprises, ""])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une entreprise
                </Button>
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
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="etabliParNettoyage">Nom</Label>
            <Input id="etabliParNettoyage" {...register("etabliParNettoyage")} placeholder="Nom du responsable" />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <SignaturePad
              value={watch("signatureNettoyage") || ""}
              onChange={(val) => setValue("signatureNettoyage", val)}
              name={watch("etabliParNettoyage")}
            />
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
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="etabliParControles">Nom</Label>
            <Input id="etabliParControles" {...register("etabliParControles")} placeholder="Nom du responsable" />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <SignaturePad
              value={watch("signatureControles") || ""}
              onChange={(val) => setValue("signatureControles", val)}
              name={watch("etabliParControles")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visite des equipements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visite des equipements</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const visite = watch("visite") || {};
                const allBon = visiteEquipements.every((e) => visite[e]?.bon);
                const updated = { ...visite };
                for (const equip of visiteEquipements) {
                  updated[equip] = { ...updated[equip], bon: !allBon };
                }
                setValue("visite", updated);
              }}
            >
              {(() => {
                const visite = watch("visite") || {};
                const allBon = visiteEquipements.every((e) => visite[e]?.bon);
                return allBon ? "Tout deselectionner" : "Tout selectionner en bon";
              })()}
            </Button>
          </div>
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
                {visiteEquipements.map((equip) => {
                  const visite = watch("visite") || {};
                  const item = visite[equip] || { bon: false, observations: "" };
                  return (
                    <tr key={equip} className="border-b last:border-0">
                      <td className="py-2 px-3 text-sm">{equip}</td>
                      <td className="py-2 px-3 text-center">
                        <Checkbox
                          checked={item.bon ?? false}
                          onCheckedChange={(checked) => {
                            const v = watch("visite") || {};
                            setValue("visite", {
                              ...v,
                              [equip]: { ...v[equip], bon: !!checked },
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          className="h-8 text-sm"
                          value={item.observations ?? ""}
                          onChange={(e) => {
                            const v = watch("visite") || {};
                            setValue("visite", {
                              ...v,
                              [equip]: { ...v[equip], observations: e.target.value },
                            });
                          }}
                          placeholder="..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photos avant */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Photos avant intervention (2 max)</Label>
            <div className="grid grid-cols-2 gap-4">
              {photosAvant.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo avant ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto("photosAvant", index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {photosAvant.length < 2 && (
                <button
                  type="button"
                  className="h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  onClick={() => photoAvantRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">Ajouter photo</span>
                </button>
              )}
            </div>
            <input
              ref={photoAvantRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload("photosAvant", file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Photos après */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Photos apres intervention (2 max)</Label>
            <div className="grid grid-cols-2 gap-4">
              {photosApres.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo apres ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto("photosApres", index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {photosApres.length < 2 && (
                <button
                  type="button"
                  className="h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  onClick={() => photoApresRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">Ajouter photo</span>
                </button>
              )}
            </div>
            <input
              ref={photoApresRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload("photosApres", file);
                e.target.value = "";
              }}
            />
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

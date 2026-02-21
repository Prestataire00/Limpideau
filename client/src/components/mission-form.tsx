import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Plus, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Mission } from "@shared/schema";

export interface InterventionDayEntry {
  date: string; // yyyy-MM-dd
  notes?: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  clientName: z.string().min(1, "Le nom du client est requis"),
  clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  description: z.string().optional(),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date().optional().nullable(),
  budget: z.number().optional().nullable(),
  status: z.string().default("pending"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MissionFormProps {
  mission?: Mission;
  onSubmit: (data: FormData, interventionDays?: InterventionDayEntry[]) => void;
  isLoading?: boolean;
  initialInterventionDays?: InterventionDayEntry[];
}

export function MissionForm({ mission, onSubmit, isLoading, initialInterventionDays = [] }: MissionFormProps) {
  const [interventionDays, setInterventionDays] = useState<InterventionDayEntry[]>(initialInterventionDays);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date | undefined>(undefined);
  const [pickerNotes, setPickerNotes] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: mission?.title || "",
      clientName: mission?.clientName || "",
      clientEmail: mission?.clientEmail || "",
      clientPhone: mission?.clientPhone || "",
      description: mission?.description || "",
      startDate: mission?.startDate ? new Date(mission.startDate) : new Date(),
      endDate: mission?.endDate ? new Date(mission.endDate) : null,
      budget: mission?.budget || null,
      status: mission?.status || "pending",
      location: mission?.location || "",
      notes: mission?.notes || "",
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data, interventionDays.length > 0 ? interventionDays : undefined);
  };

  const addInterventionDay = () => {
    if (!pickerDate) return;
    const dateStr = format(pickerDate, "yyyy-MM-dd");
    if (interventionDays.some((d) => d.date === dateStr)) return;
    setInterventionDays([...interventionDays, { date: dateStr, notes: pickerNotes || undefined }]);
    setPickerDate(undefined);
    setPickerNotes("");
    setPickerOpen(false);
  };

  const removeInterventionDay = (dateStr: string) => {
    setInterventionDays(interventionDays.filter((d) => d.date !== dateStr));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre de la mission</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Développement site web" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du client</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Entreprise ABC" {...field} data-testid="input-client-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email du client</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="client@example.com" {...field} data-testid="input-client-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone du client</FormLabel>
                <FormControl>
                  <Input placeholder="+33 6 12 34 56 78" {...field} data-testid="input-client-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lieu</FormLabel>
                <FormControl>
                  <Input placeholder="Paris, France" {...field} data-testid="input-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-start-date"
                      >
                        {field.value ? (
                          format(field.value, "d MMMM yyyy", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin (optionnel)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-end-date"
                      >
                        {field.value ? (
                          format(field.value, "d MMMM yyyy", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5000"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    data-testid="input-budget"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez les détails de la mission..."
                  className="min-h-[100px] resize-none"
                  {...field}
                  data-testid="textarea-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes internes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes pour usage interne..."
                  className="min-h-[80px] resize-none"
                  {...field}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" />
              Jours d'intervention
            </Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  <Calendar
                    mode="single"
                    selected={pickerDate}
                    onSelect={setPickerDate}
                    locale={fr}
                  />
                  <Input
                    placeholder="Notes (optionnel)"
                    value={pickerNotes}
                    onChange={(e) => setPickerNotes(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="w-full"
                    onClick={addInterventionDay}
                    disabled={!pickerDate}
                  >
                    Confirmer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {interventionDays.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun jour d'intervention planifié.</p>
          ) : (
            <div className="space-y-2">
              {interventionDays
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((day) => (
                  <div key={day.date} className="flex items-center justify-between gap-2 p-2 rounded-md border text-sm">
                    <div>
                      <span className="font-medium">
                        {format(new Date(day.date + "T00:00:00"), "EEEE d MMMM yyyy", { locale: fr })}
                      </span>
                      {day.notes && (
                        <span className="text-muted-foreground ml-2">— {day.notes}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeInterventionDay(day.date)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? "Enregistrement..." : mission ? "Mettre à jour" : "Créer la mission"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

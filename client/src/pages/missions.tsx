import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Filter } from "lucide-react";
import { MissionCard } from "@/components/mission-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Mission } from "@shared/schema";

export default function MissionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: missions, isLoading } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/missions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission supprimée",
        description: "La mission a été supprimée avec succès.",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    },
  });

  const filteredMissions = missions?.filter((mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(search.toLowerCase()) ||
      mission.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-missions-title">
            Missions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes vos missions
          </p>
        </div>
        {isAdmin && (
          <Link href="/missions/new">
            <Button data-testid="button-new-mission">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle mission
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une mission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-filter-status">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> En attente</span>
            </SelectItem>
            <SelectItem value="in_progress">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> En cours</span>
            </SelectItem>
            <SelectItem value="completed">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Terminees</span>
            </SelectItem>
            <SelectItem value="cancelled">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Annulees</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      ) : filteredMissions && filteredMissions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onDelete={setDeleteId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {search || statusFilter !== "all"
              ? "Aucun résultat"
              : "Aucune mission"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== "all"
              ? "Essayez de modifier vos critères de recherche"
              : "Créez votre première mission pour commencer"}
          </p>
          {!search && statusFilter === "all" && isAdmin && (
            <Link href="/missions/new">
              <Button data-testid="button-create-first-mission">
                <Plus className="h-4 w-4 mr-2" />
                Créer une mission
              </Button>
            </Link>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la mission ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La mission sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Briefcase, Clock, CheckCircle2, XCircle, Plus, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { MissionCard } from "@/components/mission-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Mission } from "@shared/schema";

export default function Dashboard() {
  const { data: missions, isLoading } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  const stats = {
    total: missions?.length || 0,
    pending: missions?.filter((m) => m.status === "pending").length || 0,
    inProgress: missions?.filter((m) => m.status === "in_progress").length || 0,
    completed: missions?.filter((m) => m.status === "completed").length || 0,
  };

  const recentMissions = missions?.slice(0, 4) || [];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de vos missions
          </p>
        </div>
        <Link href="/missions/new">
          <Button data-testid="button-new-mission">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle mission
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total missions"
            value={stats.total}
            icon={Briefcase}
            testId="stats-total"
            accent="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-100 dark:bg-blue-950/50"
          />
          <StatsCard
            title="En attente"
            value={stats.pending}
            icon={Clock}
            testId="stats-pending"
            accent="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-100 dark:bg-amber-950/50"
          />
          <StatsCard
            title="En cours"
            value={stats.inProgress}
            icon={TrendingUp}
            testId="stats-in-progress"
            accent="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-100 dark:bg-indigo-950/50"
          />
          <StatsCard
            title="Terminees"
            value={stats.completed}
            icon={CheckCircle2}
            testId="stats-completed"
            accent="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-100 dark:bg-emerald-950/50"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Missions récentes</h2>
          <Link href="/missions">
            <Button variant="ghost" size="sm" data-testid="link-view-all-missions">
              Voir tout
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[150px]" />
            ))}
          </div>
        ) : recentMissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Aucune mission</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre première mission
            </p>
            <Link href="/missions/new">
              <Button data-testid="button-create-first-mission">
                <Plus className="h-4 w-4 mr-2" />
                Créer une mission
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

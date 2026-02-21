import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  testId?: string;
  accent?: string;
  iconBg?: string;
}

export function StatsCard({ title, value, description, icon: Icon, testId, accent, iconBg }: StatsCardProps) {
  return (
    <Card data-testid={testId} className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg || "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${accent || "text-primary"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent || ""}`} data-testid={`${testId}-value`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GitCommitHorizontal, 
  User, 
  ArrowRight, 
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualificado",
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado Ganho",
  closed_lost: "Fechado Perdido",
};

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-stage-lead",
  qualified: "bg-stage-qualified",
  proposal: "bg-stage-proposal",
  negotiation: "bg-stage-negotiation",
  closed_won: "bg-success",
  closed_lost: "bg-destructive",
};

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  user_name?: string;
  type: "stage_change" | "created" | "assigned" | "note";
  from_stage?: string;
  to_stage?: string;
}

function useTimeline(dealId: string | undefined) {
  return useQuery({
    queryKey: ["deal-timeline", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      // Fetch activities related to stage changes
      const { data: activities, error } = await supabase
        .from("activities")
        .select(`
          id,
          title,
          description,
          completed_at,
          created_by
        `)
        .eq("deal_id", dealId)
        .eq("type", "note")
        .order("completed_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get profiles for user names
      const userIds = [...new Set(activities?.map(a => a.created_by).filter(Boolean))] as string[];
      
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        profiles = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Transform activities into timeline events
      const events: TimelineEvent[] = (activities || []).map(activity => {
        // Check if it's a stage change activity
        const isStageChange = activity.title.includes("movido de") || 
                             activity.title.includes("fechado como");
        
        // Parse stage change info from title
        let fromStage: string | undefined;
        let toStage: string | undefined;
        
        if (activity.title.includes("movido de")) {
          const match = activity.title.match(/movido de (\w+) para (\w+)/);
          if (match) {
            fromStage = match[1];
            toStage = match[2];
          }
        } else if (activity.title.includes("fechado como ganho")) {
          toStage = "closed_won";
        } else if (activity.title.includes("fechado como perdido")) {
          toStage = "closed_lost";
        }
        
        return {
          id: activity.id,
          title: activity.title,
          description: activity.description || undefined,
          timestamp: activity.completed_at || new Date().toISOString(),
          user_name: activity.created_by ? profiles[activity.created_by] : undefined,
          type: isStageChange ? "stage_change" : activity.title.includes("atribuído") ? "assigned" : "note",
          from_stage: fromStage,
          to_stage: toStage,
        };
      });

      return events;
    },
    enabled: !!dealId,
  });
}

interface DealTimelineProps {
  dealId?: string;
}

export function DealTimeline({ dealId }: DealTimelineProps) {
  const { data: events, isLoading } = useTimeline(dealId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Clock className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">Nenhuma atividade registrada</p>
        <p className="text-xs">O histórico aparecerá aqui</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Icon */}
          <div className={cn(
            "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted",
            event.type === "stage_change" && event.to_stage && STAGE_COLORS[event.to_stage]
          )}>
            {event.type === "stage_change" ? (
              event.to_stage === "closed_won" ? (
                <CheckCircle className="h-4 w-4 text-white" />
              ) : event.to_stage === "closed_lost" ? (
                <XCircle className="h-4 w-4 text-white" />
              ) : (
                <GitCommitHorizontal className="h-4 w-4 text-white" />
              )
            ) : event.type === "assigned" ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{event.title}</p>
                
                {/* Stage badges for stage changes */}
                {event.type === "stage_change" && event.from_stage && event.to_stage && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full text-white",
                      STAGE_COLORS[event.from_stage] || "bg-muted"
                    )}>
                      {STAGE_LABELS[event.from_stage] || event.from_stage}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full text-white",
                      STAGE_COLORS[event.to_stage] || "bg-muted"
                    )}>
                      {STAGE_LABELS[event.to_stage] || event.to_stage}
                    </span>
                  </div>
                )}
                
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {event.user_name && (
                <>
                  <User className="h-3 w-3" />
                  <span>{event.user_name}</span>
                  <span>•</span>
                </>
              )}
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(event.timestamp), "dd MMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

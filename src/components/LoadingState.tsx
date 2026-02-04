import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function LoadingState({ 
  variant = 'spinner', 
  size = 'md',
  text = 'Carregando...',
  className
}: LoadingStateProps) {
  
  if (variant === 'spinner') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
        {text && (
          <p className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    );
  }

  return null;
}

// Full page loading spinner
export function PageLoadingState({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

// Inline loading spinner (for buttons, etc)
export function InlineLoadingState({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <Loader2 className={cn(
      "animate-spin",
      size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    )} />
  );
}

// Loading skeleton for lists
export function ListLoadingSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for cards
export function CardLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Loading skeleton for stats cards grid
export function StatsCardsLoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for tables
export function TableLoadingSkeleton({ 
  rows = 5, 
  cols = 4 
}: { 
  rows?: number; 
  cols?: number 
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-muted/50 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "max-w-[200px]"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for charts
export function ChartLoadingSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div 
      className="rounded-lg border bg-card p-6 space-y-4"
      style={{ height }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex-1 flex items-end gap-2 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Loading skeleton for pipeline kanban
export function PipelineLoadingSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, colIndex) => (
        <div 
          key={colIndex} 
          className="flex-shrink-0 w-72 rounded-lg border bg-card"
        >
          <div className="p-4 border-b">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="p-3 space-y-3">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div key={cardIndex} className="p-3 rounded border bg-background space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for dashboard layout
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <StatsCardsLoadingSkeleton count={4} />
      
      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ChartLoadingSkeleton height={350} />
        <ChartLoadingSkeleton height={350} />
      </div>
      
      {/* Bottom Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <TableLoadingSkeleton rows={5} cols={3} />
        <div className="lg:col-span-2">
          <TableLoadingSkeleton rows={5} cols={4} />
        </div>
      </div>
    </div>
  );
}

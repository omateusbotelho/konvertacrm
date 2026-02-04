import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const team = [
  {
    id: 1,
    name: "Maria Silva",
    role: "Closer",
    initials: "MS",
    target: 100000,
    achieved: 87500,
    deals: 8,
  },
  {
    id: 2,
    name: "João Santos",
    role: "Closer",
    initials: "JS",
    target: 100000,
    achieved: 62000,
    deals: 5,
  },
  {
    id: 3,
    name: "Ana Costa",
    role: "SDR",
    initials: "AC",
    target: 50,
    achieved: 42,
    deals: 42,
    isLeads: true,
  },
  {
    id: 4,
    name: "Pedro Lima",
    role: "SDR",
    initials: "PL",
    target: 50,
    achieved: 38,
    deals: 38,
    isLeads: true,
  },
];

export function TeamPerformance() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Performance do Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {team.map((member) => {
          const percentage = (member.achieved / member.target) * 100;
          return (
            <div key={member.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {member.isLeads
                      ? `${member.achieved} leads`
                      : `R$ ${(member.achieved / 1000).toFixed(0)}k`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(0)}% da meta
                  </p>
                </div>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

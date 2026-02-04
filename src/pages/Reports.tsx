import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <AppLayout title="Relatórios" subtitle="Análises e insights do seu negócio">
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-foreground mb-2">Em breve</h3>
          <p>Relatórios personalizados e dashboards avançados estão em desenvolvimento.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

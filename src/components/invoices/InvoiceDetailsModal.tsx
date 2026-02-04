import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Calendar, Building2, Receipt, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import type { InvoiceWithRelations } from "@/hooks/useInvoices";

interface InvoiceDetailsModalProps {
  invoice: InvoiceWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  pending: { label: "Pendente", variant: "outline" as const, className: "border-yellow-500 text-yellow-600 bg-yellow-50" },
  paid: { label: "Pago", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" },
  overdue: { label: "Vencido", variant: "destructive" as const, className: "" },
  cancelled: { label: "Cancelado", variant: "secondary" as const, className: "" },
};

export function InvoiceDetailsModal({ invoice, open, onOpenChange }: InvoiceDetailsModalProps) {
  if (!invoice) return null;

  const status = statusConfig[invoice.status || 'pending'];

  const handleDownloadPDF = () => {
    generateInvoicePDF({
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      status: invoice.status || 'pending',
      paymentDate: invoice.payment_date,
      notes: invoice.notes,
      companyName: invoice.companies?.name,
      dealTitle: invoice.deals?.title,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes da Fatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice header with number and status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Número da Fatura</p>
              <p className="text-xl font-bold">{invoice.invoice_number}</p>
            </div>
            <Badge className={status.className} variant={status.variant}>
              {status.label}
            </Badge>
          </div>

          {/* Amount */}
          <div className="text-center py-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(invoice.amount)}</p>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Data de Emissão</span>
              </div>
              <p className="font-medium pl-6">{formatDate(invoice.issue_date)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Data de Vencimento</span>
              </div>
              <p className="font-medium pl-6">{formatDate(invoice.due_date)}</p>
            </div>

            {invoice.payment_date && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">Data de Pagamento</span>
                </div>
                <p className="font-medium pl-6">{formatDate(invoice.payment_date)}</p>
              </div>
            )}

            {invoice.companies?.name && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">Empresa</span>
                </div>
                <p className="font-medium pl-6">{invoice.companies.name}</p>
              </div>
            )}

            {invoice.deals?.title && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm">Deal Relacionado</span>
                </div>
                <p className="font-medium pl-6">{invoice.deals.title}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{invoice.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

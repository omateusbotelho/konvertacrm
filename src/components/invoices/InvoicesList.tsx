import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, CheckCircle2, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useInvoices, usePayInvoice, useCancelInvoice, type InvoiceWithRelations } from "@/hooks/useInvoices";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
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

const statusConfig = {
  pending: { label: "Pendente", variant: "outline" as const, className: "border-yellow-500 text-yellow-600 bg-yellow-50" },
  paid: { label: "Pago", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" },
  overdue: { label: "Vencido", variant: "destructive" as const, className: "" },
  cancelled: { label: "Cancelado", variant: "secondary" as const, className: "" },
};

export function InvoicesList() {
  const { data: invoices, isLoading } = useInvoices();
  const payInvoice = usePayInvoice();
  const cancelInvoice = useCancelInvoice();
  
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'pay' | 'cancel'; invoice: InvoiceWithRelations } | null>(null);

  const handleViewDetails = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
    setDetailsOpen(true);
  };

  const handleDownloadPDF = (invoice: InvoiceWithRelations) => {
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

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'pay') {
      payInvoice.mutate(confirmAction.invoice.id);
    } else {
      cancelInvoice.mutate(confirmAction.invoice.id);
    }
    setConfirmAction(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoices?.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma fatura encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturas ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status || 'pending'];
                const isOverdue = invoice.status === 'pending' && new Date(invoice.due_date) < new Date();
                const displayStatus = isOverdue ? statusConfig.overdue : status;

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.companies?.name || '-'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={displayStatus.className} variant={displayStatus.variant}>
                        {displayStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(invoice)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmAction({ type: 'pay', invoice })}
                              title="Marcar como pago"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmAction({ type: 'cancel', invoice })}
                              title="Cancelar fatura"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvoiceDetailsModal
        invoice={selectedInvoice}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'pay' ? 'Confirmar Pagamento' : 'Cancelar Fatura'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'pay'
                ? `Deseja marcar a fatura ${confirmAction?.invoice.invoice_number} como paga?`
                : `Deseja cancelar a fatura ${confirmAction?.invoice.invoice_number}? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.type === 'cancel' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmAction?.type === 'pay' ? 'Confirmar Pagamento' : 'Cancelar Fatura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

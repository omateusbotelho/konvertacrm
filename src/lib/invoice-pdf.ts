import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentDate?: string | null;
  notes?: string | null;
  companyName?: string | null;
  companyCnpj?: string | null;
  companyAddress?: string | null;
  dealTitle?: string | null;
}

// Agency (Konverta) data
const AGENCY_DATA = {
  name: 'Konverta',
  fullName: 'Konverta Marketing Digital LTDA',
  cnpj: '00.000.000/0001-00',
  address: 'Av. Paulista, 1000 - São Paulo, SP',
  phone: '(11) 99999-9999',
  email: 'financeiro@konverta.com.br',
  website: 'www.konverta.com.br',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'PENDENTE',
  paid: 'PAGO',
  overdue: 'VENCIDO',
  cancelled: 'CANCELADO',
};

const STATUS_COLORS: Record<string, { r: number; g: number; b: number }> = {
  pending: { r: 234, g: 179, b: 8 }, // Yellow
  paid: { r: 34, g: 197, b: 94 }, // Green
  overdue: { r: 239, g: 68, b: 68 }, // Red
  cancelled: { r: 156, g: 163, b: 175 }, // Gray
};

export function generateInvoicePDF(invoice: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = { r: 124, g: 58, b: 237 }; // Purple accent
  const textColor = { r: 31, g: 41, b: 55 };
  const mutedColor = { r: 107, g: 114, b: 128 };

  // Header background
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo / Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('KonvertaOS', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão Comercial', 20, 33);

  // Invoice label on top right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FATURA', pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(14);
  doc.text(invoice.invoiceNumber, pageWidth - 20, 30, { align: 'right' });

  // Reset text color
  doc.setTextColor(textColor.r, textColor.g, textColor.b);

  let yPos = 60;

  // Two column layout for agency and client data
  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;

  // Agency data (left column)
  doc.setFontSize(9);
  doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  doc.text('EMITENTE', leftCol, yPos);
  
  yPos += 8;
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(AGENCY_DATA.name, leftCol, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(AGENCY_DATA.fullName, leftCol, yPos);
  
  yPos += 5;
  doc.text(`CNPJ: ${AGENCY_DATA.cnpj}`, leftCol, yPos);
  
  yPos += 5;
  doc.text(AGENCY_DATA.address, leftCol, yPos);
  
  yPos += 5;
  doc.text(`Tel: ${AGENCY_DATA.phone}`, leftCol, yPos);
  
  yPos += 5;
  doc.text(AGENCY_DATA.email, leftCol, yPos);

  // Client data (right column)
  let yPosRight = 60;
  doc.setFontSize(9);
  doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  doc.text('CLIENTE', rightCol, yPosRight);
  
  yPosRight += 8;
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.companyName || 'Cliente não especificado', rightCol, yPosRight);
  
  yPosRight += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (invoice.companyCnpj) {
    doc.text(`CNPJ: ${invoice.companyCnpj}`, rightCol, yPosRight);
    yPosRight += 5;
  }
  if (invoice.companyAddress) {
    doc.text(invoice.companyAddress, rightCol, yPosRight);
  }

  yPos = Math.max(yPos, yPosRight) + 20;

  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 15;

  // Invoice details section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.text('DETALHES DA FATURA', leftCol, yPos);

  yPos += 12;

  // Details grid
  const detailsData = [
    { label: 'Número da Fatura:', value: invoice.invoiceNumber },
    { label: 'Data de Emissão:', value: formatDate(invoice.issueDate) },
    { label: 'Data de Vencimento:', value: formatDate(invoice.dueDate) },
  ];

  if (invoice.paymentDate) {
    detailsData.push({ label: 'Data de Pagamento:', value: formatDate(invoice.paymentDate) });
  }

  if (invoice.dealTitle) {
    detailsData.push({ label: 'Referência:', value: invoice.dealTitle });
  }

  detailsData.forEach((item, index) => {
    const isLeft = index % 2 === 0;
    const x = isLeft ? leftCol : rightCol;
    const y = yPos + Math.floor(index / 2) * 18;
    
    doc.setFontSize(9);
    doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
    doc.text(item.label, x, y);
    
    doc.setFontSize(11);
    doc.setTextColor(textColor.r, textColor.g, textColor.b);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, x, y + 6);
  });

  yPos += Math.ceil(detailsData.length / 2) * 18 + 10;

  // Divider line
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 20;

  // Amount section with status badge
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos - 5, pageWidth - 40, 50, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  doc.text('VALOR TOTAL', leftCol + 10, yPos + 10);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.text(formatCurrency(invoice.amount), leftCol + 10, yPos + 30);

  // Status badge
  const statusColor = STATUS_COLORS[invoice.status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[invoice.status] || 'PENDENTE';
  
  const badgeWidth = 40;
  const badgeX = pageWidth - 30 - badgeWidth;
  
  doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
  doc.roundedRect(badgeX, yPos + 12, badgeWidth, 16, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, badgeX + badgeWidth / 2, yPos + 23, { align: 'center' });

  yPos += 65;

  // Notes section (if any)
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor.r, textColor.g, textColor.b);
    doc.text('OBSERVAÇÕES', leftCol, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
    
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(splitNotes, leftCol, yPos);
    
    yPos += splitNotes.length * 5 + 15;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 25;
  
  doc.setDrawColor(229, 231, 235);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  doc.text(`Documento gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, footerY + 10, { align: 'center' });
  doc.text(`${AGENCY_DATA.website} | ${AGENCY_DATA.email}`, pageWidth / 2, footerY + 16, { align: 'center' });

  // Save the PDF
  doc.save(`Fatura_${invoice.invoiceNumber}.pdf`);
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

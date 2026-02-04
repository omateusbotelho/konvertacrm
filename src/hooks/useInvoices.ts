import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toastSuccess, toastError } from '@/lib/toast';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceStatus = Database['public']['Enums']['invoice_status'];

export interface InvoiceWithRelations extends Invoice {
  companies?: { name: string } | null;
  deals?: { title: string } | null;
}

export interface CreateInvoiceData {
  deal_id?: string | null;
  company_id?: string | null;
  amount: number;
  issue_date: string;
  due_date: string;
  notes?: string | null;
  is_recurring?: boolean;
}

export interface InvoiceMetrics {
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  countPending: number;
  countOverdue: number;
}

// Fetch invoices
export function useInvoices(status?: InvoiceStatus | 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', status, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('invoices')
        .select(`
          *,
          companies!invoices_company_id_fkey (name),
          deals!invoices_deal_id_fkey (title)
        `)
        .order('due_date', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InvoiceWithRelations[];
    },
    enabled: !!user,
  });
}

// Fetch invoice metrics
export function useInvoiceMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', 'metrics', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('invoices')
        .select('amount, status, due_date');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const metrics: InvoiceMetrics = {
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countPending: 0,
        countOverdue: 0,
      };

      (data || []).forEach(inv => {
        if (inv.status === 'paid') {
          metrics.totalPaid += inv.amount;
        } else if (inv.status === 'pending') {
          if (inv.due_date < today) {
            metrics.totalOverdue += inv.amount;
            metrics.countOverdue += 1;
          } else {
            metrics.totalPending += inv.amount;
            metrics.countPending += 1;
          }
        } else if (inv.status === 'overdue') {
          metrics.totalOverdue += inv.amount;
          metrics.countOverdue += 1;
        }
      });

      return metrics;
    },
    enabled: !!user,
  });
}

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const invoiceNumber = `INV-${Date.now()}`;

      const invoiceData: InvoiceInsert = {
        ...data,
        invoice_number: invoiceNumber,
        status: 'pending',
      };

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toastSuccess('Fatura criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toastError('Erro ao criar fatura.');
    },
  });
}

// Mark invoice as paid
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toastSuccess('Fatura marcada como paga!');
    },
    onError: (error) => {
      console.error('Error paying invoice:', error);
      toastError('Erro ao marcar fatura como paga.');
    },
  });
}

// Cancel invoice
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toastSuccess('Fatura cancelada.');
    },
    onError: (error) => {
      console.error('Error cancelling invoice:', error);
      toastError('Erro ao cancelar fatura.');
    },
  });
}

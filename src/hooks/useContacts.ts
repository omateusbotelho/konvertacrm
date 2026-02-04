import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toastSuccess, toastError } from '@/lib/toast';

type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

export interface ContactWithCompany extends Contact {
  companies?: { name: string } | null;
}

export interface CreateContactData {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  company_id?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
  is_primary?: boolean;
}

// Fetch all contacts
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies!contacts_company_id_fkey (name)
        `)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as ContactWithCompany[];
    },
  });
}

// Fetch contacts for a specific company
export function useCompanyContacts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', 'company', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false })
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!companyId,
  });
}

// Create contact
export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const contactData: ContactInsert = {
        ...data,
        created_by: user.id,
      };

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toastSuccess('Contato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating contact:', error);
      toastError('Erro ao criar contato.');
    },
  });
}

// Update contact
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateContactData> }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toastSuccess('Contato atualizado!');
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
      toastError('Erro ao atualizar contato.');
    },
  });
}

// Set primary contact
export function useSetPrimaryContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, companyId }: { contactId: string; companyId: string }) => {
      // First, unset all primary contacts for this company
      await supabase
        .from('contacts')
        .update({ is_primary: false })
        .eq('company_id', companyId);

      // Then set the new primary contact
      const { data, error } = await supabase
        .from('contacts')
        .update({ is_primary: true })
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toastSuccess('Contato definido como principal!');
    },
    onError: (error) => {
      console.error('Error setting primary contact:', error);
      toastError('Erro ao definir contato principal.');
    },
  });
}

// Delete contact
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toastSuccess('Contato excluído.');
    },
    onError: (error) => {
      console.error('Error deleting contact:', error);
      toastError('Erro ao excluir contato.');
    },
  });
}

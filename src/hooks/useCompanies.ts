import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toastSuccess, toastError } from '@/lib/toast';

type Company = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export interface CreateCompanyData {
  name: string;
  legal_name?: string | null;
  cnpj?: string | null;
  industry?: string | null;
  company_size?: Database['public']['Enums']['company_size'] | null;
  website?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  notes?: string | null;
}

// Fetch all companies
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Company[];
    },
  });
}

// Fetch a single company
export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

// Search companies by name
export function useSearchCompanies(search: string) {
  return useQuery({
    queryKey: ['companies', 'search', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });
}

// Create a new company
export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const companyData: CompanyInsert = {
        ...data,
        created_by: user.id,
      };

      const { data: company, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating company:', error);
      toastError('Erro ao criar empresa. Tente novamente.');
    },
  });
}

// Update a company
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCompanyData> }) => {
      const { data: company, error } = await supabase
        .from('companies')
        .update(data as CompanyUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return company;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] });
      toastSuccess('Empresa atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating company:', error);
      toastError('Erro ao atualizar empresa. Tente novamente.');
    },
  });
}

// Delete a company
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa excluída com sucesso.');
    },
    onError: (error) => {
      console.error('Error deleting company:', error);
      toastError('Erro ao excluir empresa. Tente novamente.');
    },
  });
}

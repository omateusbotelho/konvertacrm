import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ImportResult, ImportValidationError } from '@/lib/csv-parser';
import { validateCNPJ, validateEmail } from '@/lib/validations';

export function useCompanyImport() {
  const { user } = useAuth();

  const importCompanies = useCallback(async (data: Record<string, string>[]): Promise<ImportResult> => {
    if (!user) {
      return { success: 0, errors: [{ row: 0, field: '', value: '', message: 'Usuário não autenticado' }], total: data.length };
    }

    const errors: ImportValidationError[] = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because of 0-index and header row

      // Validate required fields
      if (!row.name || row.name.trim() === '') {
        errors.push({ row: rowNum, field: 'name', value: row.name || '', message: 'Nome é obrigatório' });
        continue;
      }

      // Validate CNPJ if provided
      if (row.cnpj && row.cnpj.trim() !== '') {
        const cleanCnpj = row.cnpj.replace(/\D/g, '');
        if (!validateCNPJ(cleanCnpj)) {
          errors.push({ row: rowNum, field: 'cnpj', value: row.cnpj, message: 'CNPJ inválido' });
          continue;
        }

        // Check for duplicate CNPJ
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .eq('cnpj', cleanCnpj)
          .maybeSingle();

        if (existing) {
          errors.push({ row: rowNum, field: 'cnpj', value: row.cnpj, message: 'CNPJ já cadastrado' });
          continue;
        }
      }

      // Insert company
      const { error } = await supabase.from('companies').insert({
        name: row.name.trim(),
        legal_name: row.legal_name?.trim() || null,
        cnpj: row.cnpj?.replace(/\D/g, '') || null,
        industry: row.industry?.trim() || null,
        website: row.website?.trim() || null,
        address_street: row.address_street?.trim() || null,
        address_city: row.address_city?.trim() || null,
        address_state: row.address_state?.trim() || null,
        address_zip: row.address_zip?.trim() || null,
        notes: row.notes?.trim() || null,
        company_size: parseCompanySize(row.company_size),
        created_by: user.id,
      });

      if (error) {
        errors.push({ row: rowNum, field: '', value: '', message: error.message });
      } else {
        successCount++;
      }
    }

    return { success: successCount, errors, total: data.length };
  }, [user]);

  return { importCompanies };
}

export function useContactImport() {
  const { user } = useAuth();

  const importContacts = useCallback(async (data: Record<string, string>[]): Promise<ImportResult> => {
    if (!user) {
      return { success: 0, errors: [{ row: 0, field: '', value: '', message: 'Usuário não autenticado' }], total: data.length };
    }

    const errors: ImportValidationError[] = [];
    let successCount = 0;

    // Fetch companies for matching
    const { data: companies } = await supabase.from('companies').select('id, name');
    const companyMap = new Map(companies?.map(c => [c.name.toLowerCase(), c.id]) || []);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      // Validate required fields
      if (!row.full_name || row.full_name.trim() === '') {
        errors.push({ row: rowNum, field: 'full_name', value: row.full_name || '', message: 'Nome completo é obrigatório' });
        continue;
      }

      // Validate email if provided
      if (row.email && row.email.trim() !== '') {
        if (!validateEmail(row.email.trim())) {
          errors.push({ row: rowNum, field: 'email', value: row.email, message: 'Email inválido' });
          continue;
        }

        // Check for duplicate email
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', row.email.trim().toLowerCase())
          .maybeSingle();

        if (existing) {
          errors.push({ row: rowNum, field: 'email', value: row.email, message: 'Email já cadastrado' });
          continue;
        }
      }

      // Find company by name
      let companyId: string | null = null;
      if (row.company_name && row.company_name.trim() !== '') {
        companyId = companyMap.get(row.company_name.trim().toLowerCase()) || null;
        if (!companyId) {
          errors.push({ 
            row: rowNum, 
            field: 'company_name', 
            value: row.company_name, 
            message: 'Empresa não encontrada. Cadastre a empresa antes de importar o contato.' 
          });
          continue;
        }
      }

      // Insert contact
      const { error } = await supabase.from('contacts').insert({
        full_name: row.full_name.trim(),
        email: row.email?.trim().toLowerCase() || null,
        phone: row.phone?.trim() || null,
        position: row.position?.trim() || null,
        linkedin_url: row.linkedin_url?.trim() || null,
        notes: row.notes?.trim() || null,
        company_id: companyId,
        created_by: user.id,
      });

      if (error) {
        errors.push({ row: rowNum, field: '', value: '', message: error.message });
      } else {
        successCount++;
      }
    }

    return { success: successCount, errors, total: data.length };
  }, [user]);

  return { importContacts };
}

function parseCompanySize(value: string | undefined): '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null {
  if (!value) return null;
  const clean = value.trim().toLowerCase();
  
  if (clean.includes('1-10') || clean.includes('micro') || clean === 'pequena') return '1-10';
  if (clean.includes('11-50') || clean === 'pequena') return '11-50';
  if (clean.includes('51-200') || clean === 'média') return '51-200';
  if (clean.includes('201-500') || clean === 'grande') return '201-500';
  if (clean.includes('500+') || clean === 'enterprise') return '500+';
  
  return null;
}

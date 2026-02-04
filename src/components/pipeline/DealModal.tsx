import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useCompanies, useCreateCompany } from '@/hooks/useCompanies';
import { useCreateDeal, useUpdateDeal, DealWithCompany, CreateDealData } from '@/hooks/useDeals';
import { useClosers, useSDRs } from '@/hooks/useProfiles';
import { Database } from '@/integrations/supabase/types';
import { Loader2, Plus } from 'lucide-react';
import { calculateRetainerValue } from '@/lib/deal-calculations';

type DealSource = Database['public']['Enums']['deal_source'];
type DealType = Database['public']['Enums']['deal_type'];

const DEAL_SOURCES: { value: DealSource; label: string }[] = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'referral', label: 'Indicação' },
  { value: 'event', label: 'Evento' },
  { value: 'partner', label: 'Parceiro' },
  { value: 'other', label: 'Outro' },
];

const dealFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  company_id: z.string().nullable(),
  deal_type: z.enum(['retainer', 'project'] as const),
  value: z.number().min(0, 'Valor deve ser positivo').optional(),
  monthly_value: z.number().min(0, 'Valor deve ser positivo').optional().nullable(),
  contract_duration_months: z.number().min(1).max(60).optional().nullable(),
  source: z.enum(['inbound', 'outbound', 'referral', 'event', 'partner', 'other'] as const),
  expected_close_date: z.string().optional().nullable(),
  sdr_id: z.string().optional().nullable(),
  closer_id: z.string().optional().nullable(),
  monthly_hours: z.number().min(0).optional().nullable(),
  hours_rollover: z.boolean().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: DealWithCompany | null;
  mode: 'create' | 'edit';
}

export function DealModal({ open, onOpenChange, deal, mode }: DealModalProps) {
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: sdrs } = useSDRs();
  const { data: closers } = useClosers();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const createCompany = useCreateCompany();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: '',
      company_id: null,
      deal_type: 'retainer',
      value: 0,
      monthly_value: null,
      contract_duration_months: 12,
      source: 'outbound',
      expected_close_date: null,
      sdr_id: null,
      closer_id: null,
      monthly_hours: null,
      hours_rollover: false,
    },
  });

  const dealType = form.watch('deal_type');
  const monthlyValue = form.watch('monthly_value');
  const contractDuration = form.watch('contract_duration_months');

  // Calculate total value for retainer
  const calculatedTotalValue =
    dealType === 'retainer' && monthlyValue && contractDuration
      ? calculateRetainerValue(monthlyValue, contractDuration)
      : form.watch('value') || 0;

  // Reset form when modal opens/closes or deal changes
  useEffect(() => {
    if (open && deal && mode === 'edit') {
      form.reset({
        title: deal.title,
        company_id: deal.company_id,
        deal_type: deal.deal_type,
        value: deal.value,
        monthly_value: deal.monthly_value,
        contract_duration_months: deal.contract_duration_months,
        source: deal.source,
        expected_close_date: deal.expected_close_date,
        sdr_id: deal.sdr_id,
        closer_id: deal.closer_id,
        monthly_hours: deal.monthly_hours,
        hours_rollover: deal.hours_rollover || false,
      });
    } else if (open && mode === 'create') {
      form.reset({
        title: '',
        company_id: null,
        deal_type: 'retainer',
        value: 0,
        monthly_value: null,
        contract_duration_months: 12,
        source: 'outbound',
        expected_close_date: null,
        sdr_id: null,
        closer_id: null,
        monthly_hours: null,
        hours_rollover: false,
      });
    }
  }, [open, deal, mode, form]);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    
    try {
      const company = await createCompany.mutateAsync({ name: newCompanyName });
      form.setValue('company_id', company.id);
      setNewCompanyName('');
      setShowNewCompanyInput(false);
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const onSubmit = async (values: DealFormValues) => {
    try {
      if (mode === 'create') {
        const createData: CreateDealData = {
          title: values.title,
          company_id: values.company_id,
          deal_type: values.deal_type,
          value: values.deal_type === 'project' ? (values.value || 0) : 0,
          monthly_value: values.deal_type === 'retainer' ? values.monthly_value : null,
          contract_duration_months: values.deal_type === 'retainer' ? values.contract_duration_months : null,
          source: values.source,
          expected_close_date: values.expected_close_date,
          sdr_id: values.sdr_id,
          closer_id: values.closer_id,
          monthly_hours: values.deal_type === 'retainer' ? values.monthly_hours : null,
          hours_rollover: values.deal_type === 'retainer' ? values.hours_rollover : false,
        };
        
        await createDeal.mutateAsync(createData);
      } else if (deal) {
        await updateDeal.mutateAsync({
          id: deal.id,
          data: {
            title: values.title,
            company_id: values.company_id,
            deal_type: values.deal_type,
            value: values.deal_type === 'project' ? (values.value || 0) : calculatedTotalValue,
            monthly_value: values.deal_type === 'retainer' ? values.monthly_value : null,
            contract_duration_months: values.deal_type === 'retainer' ? values.contract_duration_months : null,
            source: values.source,
            expected_close_date: values.expected_close_date,
            sdr_id: values.sdr_id,
            closer_id: values.closer_id,
            monthly_hours: values.deal_type === 'retainer' ? values.monthly_hours : null,
            hours_rollover: values.deal_type === 'retainer' ? values.hours_rollover : false,
          },
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const isSubmitting = createDeal.isPending || updateDeal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Deal' : 'Editar Deal'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Preencha os dados para criar um novo deal no pipeline.'
              : 'Atualize os dados do deal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Marketing Digital para E-commerce" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company */}
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <div className="flex gap-2">
                    {!showNewCompanyInput ? (
                      <>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          disabled={companiesLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione uma empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies?.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNewCompanyInput(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          placeholder="Nome da nova empresa"
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleCreateCompany}
                          disabled={createCompany.isPending}
                        >
                          {createCompany.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Criar'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowNewCompanyInput(false);
                            setNewCompanyName('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deal Type */}
            <FormField
              control={form.control}
              name="deal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="retainer">Retainer (Mensalidade)</SelectItem>
                      <SelectItem value="project">Projeto (Pontual)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Value fields based on type */}
            {dealType === 'retainer' ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_duration_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (meses) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Valor Total: <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotalValue)}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Projeto *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="25000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Hours (for retainer) */}
            {dealType === 'retainer' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Mensais</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="40"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours_rollover"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <FormLabel className="cursor-pointer">Acumula horas?</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Source */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEAL_SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expected Close Date */}
            <FormField
              control={form.control}
              name="expected_close_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previsão de Fechamento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sdr_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SDR</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) => field.onChange(val || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar SDR" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sdrs?.map((sdr) => (
                          <SelectItem key={sdr.id} value={sdr.id}>
                            {sdr.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closer</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) => field.onChange(val || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar Closer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {closers?.map((closer) => (
                          <SelectItem key={closer.id} value={closer.id}>
                            {closer.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Criar Deal' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

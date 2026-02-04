import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateUser, useUpdateUser, UserWithRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

const createUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  full_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'closer', 'sdr'] as const),
});

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'closer', 'sdr'] as const),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: UserWithRole | null;
}

export function UserFormDialog({ open, onOpenChange, mode, user }: UserFormDialogProps) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const isCreate = mode === 'create';
  const schema = isCreate ? createUserSchema : editUserSchema;

  const form = useForm<CreateUserFormData | EditUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: isCreate
      ? {
          email: '',
          password: '',
          full_name: '',
          phone: '',
          role: 'sdr' as AppRole,
        }
      : {
          full_name: user?.full_name || '',
          phone: user?.phone || '',
          role: user?.role || 'sdr',
        },
  });

  // Reset form when user changes (for edit mode)
  useEffect(() => {
    if (user && mode === 'edit') {
      form.reset({
        full_name: user.full_name,
        phone: user.phone || '',
        role: user.role || 'sdr',
      });
    } else if (mode === 'create') {
      form.reset({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'sdr',
      });
    }
  }, [user, mode, form]);

  const handleSubmit = async (data: CreateUserFormData | EditUserFormData) => {
    try {
      if (isCreate && 'email' in data && 'password' in data) {
        await createMutation.mutateAsync({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
        });
      } else if (user) {
        await updateMutation.mutateAsync({
          id: user.id,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Criar Novo Usuário' : 'Editar Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Preencha os dados do novo usuário'
              : 'Atualize os dados do usuário'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {isCreate && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sdr">SDR</SelectItem>
                      <SelectItem value="closer">Closer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isCreate ? 'Criar Usuário' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

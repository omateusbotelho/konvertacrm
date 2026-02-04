import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, useDeactivateUser, useReactivateUser, UserWithRole } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Plus, UserCheck, UserX, Pencil } from 'lucide-react';
import { UserFormDialog } from './UserFormDialog';
import { AppRole } from '@/types/auth';

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  closer: 'Closer',
  sdr: 'SDR',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  closer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sdr: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function TeamManagement() {
  const { hasPermission } = useAuth();
  const { data: users, isLoading } = useUsers();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  const canManageUsers = hasPermission('canManageUsers');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeactivate = async (userId: string) => {
    await deactivateMutation.mutateAsync(userId);
  };

  const handleReactivate = async (userId: string) => {
    await reactivateMutation.mutateAsync(userId);
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Você não tem permissão para gerenciar usuários.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Equipe</CardTitle>
            <CardDescription>Crie, edite e gerencie os usuários do sistema</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge className={ROLE_COLORS[user.role]} variant="secondary">
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sem papel</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {user.is_active ? (
                          <DropdownMenuItem 
                            onClick={() => handleDeactivate(user.id)}
                            className="text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleReactivate(user.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        mode="create"
      />

      <UserFormDialog 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)}
        mode="edit"
        user={editingUser}
      />
    </>
  );
}

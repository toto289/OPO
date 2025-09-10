
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsers } from "@/lib/api";
import { updateUser } from "@/lib/actions";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateUserDialog } from "./_components/user-actions";
import { getInitials } from "@/lib/utils";


const allRoles = [
  "Administrador",
  "Gerente de Manutenção",
  "Gerente de Refrigeração",
  "Gerente Regional",
  "Gerente de Loja",
  "Líder de Manutenção",
  "Analista de Manutenção",
  "Técnico de Manutenção",
  "Ajudante",
];

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Em um app real, isso viria das permissões do usuário logado.
  const canModifyUsers = true; 

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      setIsLoading(false);
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const originalUsers = [...users];
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);

    const result = await updateUser(userId, { role: newRole });

    if (result.success) {
      toast({
        title: "Papel Atualizado!",
        description: `O papel de ${result.data?.name} foi alterado para ${newRole}.`,
      });
    } else {
      setUsers(originalUsers);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: result.error || "Não foi possível alterar o papel do usuário.",
      });
    }
  };

  const handleUserCreated = async () => {
     setIsLoading(true);
     const fetchedUsers = await getUsers();
     setUsers(fetchedUsers);
     setIsLoading(false);
  }

  if (isLoading) {
    return <UsersPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Usuários do Sistema</h1>
            <p className="text-muted-foreground">Visualize e gerencie os usuários e seus respectivos papéis no sistema.</p>
        </div>
        {canModifyUsers && <CreateUserDialog allRoles={allRoles} onUserCreated={handleUserCreated} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os usuários com acesso. {canModifyUsers ? "Altere o papel de um usuário selecionando uma nova opção." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="w-[250px]">Papel (Permissões)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                         <Avatar className="h-9 w-9">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person face" />}
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.cargo}</TableCell>
                      <TableCell>
                        <Select 
                          value={user.role} 
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={!canModifyUsers}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um papel" />
                          </SelectTrigger>
                          <SelectContent>
                            {allRoles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function UsersPageSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]"><Skeleton className="h-5 w-12" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                                    <TableHead className="w-[250px]"><Skeleton className="h-5 w-20" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                        <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

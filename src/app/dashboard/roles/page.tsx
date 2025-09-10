
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Em um aplicativo real, isso viria de um banco de dados ou API.
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

type Permission = 
    "viewDashboard" |
    "viewEquipment" |
    "createEquipment" | 
    "modifyEquipment" | 
    "viewStores" |
    "modifyStores" |
    "viewUsers" |
    "modifyUsers" |
    "viewRoles" |
    "modifyRoles";

const permissionLabels: Record<Permission, string> = {
  viewDashboard: "Visualizar Dashboard",
  viewEquipment: "Visualizar Equipamentos",
  createEquipment: "Criar Equipamentos",
  modifyEquipment: "Modificar Equipamentos",
  viewStores: "Visualizar Lojas",
  modifyStores: "Modificar Lojas",
  viewUsers: "Visualizar Usuários",
  modifyUsers: "Criar ou Modificar Usuários",
  viewRoles: "Visualizar Papéis",
  modifyRoles: "Modificar Papéis e Permissões",
};

const permissionGroups = {
    "Geral": ["viewDashboard"],
    "Equipamentos": ["viewEquipment", "createEquipment", "modifyEquipment"],
    "Lojas": ["viewStores", "modifyStores"],
    "Administração": ["viewUsers", "modifyUsers", "viewRoles", "modifyRoles"],
}

// Configuração inicial de permissões (simulada)
const initialPermissions: Record<string, Record<Permission, boolean>> = {
  Administrador: {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: true,
    modifyEquipment: true,
    viewStores: true,
    modifyStores: true,
    viewUsers: true,
    modifyUsers: true,
    viewRoles: true,
    modifyRoles: true,
  },
  "Gerente de Manutenção": {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: true,
    modifyEquipment: true,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
  "Gerente de Refrigeração": {
     viewDashboard: true,
    viewEquipment: true,
    createEquipment: true,
    modifyEquipment: true,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
  "Gerente Regional": {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: false,
    modifyEquipment: true,
    viewStores: true,
    modifyStores: true,
    viewUsers: true,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
  "Gerente de Loja": {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: false,
    modifyEquipment: false,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
  "Líder de Manutenção": {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: true,
    modifyEquipment: true,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
   "Analista de Manutenção": {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: false,
    modifyEquipment: false,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
  "Técnico de Manutenção": {
    viewDashboard: true,
    viewEquipment: true,
    createEquipment: false,
    modifyEquipment: true,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
   Ajudante: {
    viewDashboard: false,
    viewEquipment: true,
    createEquipment: false,
    modifyEquipment: false,
    viewStores: true,
    modifyStores: false,
    viewUsers: false,
    modifyUsers: false,
    viewRoles: false,
    modifyRoles: false,
  },
};


export default function RolesPage() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState(initialPermissions);

  const handlePermissionChange = (role: string, permission: Permission, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: checked,
      },
    }));

    toast({
      title: "Permissão Atualizada",
      description: `'${permissionLabels[permission]}' foi ${checked ? "ativada" : "desativada"} para o papel '${role}'.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Papéis e Permissões</h1>
        <p className="text-muted-foreground">
          Gerencie o que cada papel de usuário pode fazer no sistema.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allRoles.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{role}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => (
                     <div key={groupName}>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">{groupName}</h4>
                        <Separator className="mb-4"/>
                        <div className="space-y-4">
                        {(groupPermissions as Permission[]).map((permission) => (
                            <div key={permission} className="flex items-center justify-between">
                            <Label htmlFor={`${role}-${permission}`} className="flex flex-col space-y-1 pr-4">
                                <span>{permissionLabels[permission]}</span>
                            </Label>
                            <Switch
                                id={`${role}-${permission}`}
                                checked={permissions[role]?.[permission] || false}
                                onCheckedChange={(checked) => handlePermissionChange(role, permission, checked)}
                            />
                            </div>
                        ))}
                        </div>
                    </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

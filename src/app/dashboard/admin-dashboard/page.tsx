
'use client'

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Users, Package, Store } from "lucide-react";
import { EquipmentDistributionChart } from "@/components/charts/equipment-distribution-chart";
import { getAllEquipment, getStores, getUsers } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Equipment, Store as StoreType, User } from "@/lib/types";

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
             <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-3 w-1/3 mt-1" />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
       <Card>
            <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
            <CardDescription asChild>
                <div>
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Skeleton className="h-80 w-full" />
            </CardContent>
        </Card>
    </div>
  )
}

interface AdminDashboardData {
    totalEquipment: number;
    totalStores: number;
    totalUsers: number;
    equipmentByStore: { name: string; value: number; }[];
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [equipment, stores, users] = await Promise.all([
                getAllEquipment(),
                getStores(),
                getUsers()
            ]);

            const equipmentByStore = stores.map((store) => ({
                name: store.name,
                value: equipment.filter(e => e.storeId === store.id).length,
            })).filter(s => s.value > 0);

            setData({
                totalEquipment: equipment.length,
                totalStores: stores.length,
                totalUsers: users.length,
                equipmentByStore,
            });
            setIsLoading(false);
        }
        fetchData();
    }, [])

  if (isLoading || !data) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard de Administração</h1>
          <p className="text-muted-foreground">
            Visão geral dos recursos de administração do sistema.
          </p>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total de Equipamentos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEquipment}</div>
             <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/equipment" className="hover:underline">Gerenciar equipamentos</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Unidades (Lojas)</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStores}</div>
             <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/stores" className="hover:underline">Gerenciar unidades</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Usuários do Sistema</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
             <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/users" className="hover:underline">Gerenciar usuários</Link>
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
            <CardTitle>Equipamentos por Unidade</CardTitle>
            <CardDescription>Distribuição de ativos entre as filiais.</CardDescription>
            </CardHeader>
            <CardContent>
            <EquipmentDistributionChart data={data.equipmentByStore} />
            </CardContent>
        </Card>
    </div>
  );
}

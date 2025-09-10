
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
import { Wrench, ShieldCheck, Timer, TrendingDown, CalendarCheck } from "lucide-react";
import { MaintenanceChart } from "@/components/charts/maintenance-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAllEquipment } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { Equipment } from "@/lib/types";

function MaintenanceDashboardSkeleton() {
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
      <div className="grid gap-6 lg:grid-cols-5">
         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
             <div className="text-sm text-muted-foreground">
                <Skeleton className="h-4 w-full" />
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-52 w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top 5 Manutenções</CardTitle>
              <CardDescription>Equipamentos que mais necessitaram de reparos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

interface MaintenanceDashboardData {
    totalMaintenances: number;
    totalMaintenanceCost: number;
    mtbf: string;
    mttr: string;
    maintenanceByMonth: { name: string, count: number, cost: number }[];
    mostMaintained: Equipment[];
    overdueTasks: number;
}

export default function MaintenanceDashboardPage() {
    const [data, setData] = useState<MaintenanceDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const equipment = await getAllEquipment();

            let totalMaintenances = 0;
            let totalMaintenanceCost = 0;
            let totalDaysBetweenFailures = 0;
            let failureCount = 0;
            let totalRepairTime = 0;
            let repairCount = 0;
            let overdueTasks = 0;

            const maintenanceByMonth = Array.from({ length: 12 }, (_, i) => ({
                name: format(new Date(0, i), "MMM", { locale: ptBR }),
                count: 0,
                cost: 0,
            }));

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            equipment.forEach(item => {
                totalMaintenances += (item.maintenanceHistory || []).length;
                totalMaintenanceCost += (item.maintenanceHistory || []).reduce((acc, log) => acc + (log.cost || 0), 0);

                (item.maintenanceHistory || []).forEach(log => {
                    const month = new Date(log.date).getMonth();
                    maintenanceByMonth[month].count += 1;
                    maintenanceByMonth[month].cost += (log.cost || 0);

                    if (log.tempoGasto && log.tempoGasto > 0) {
                        totalRepairTime += log.tempoGasto;
                        repairCount++;
                    }
                });

                if ((item.maintenanceHistory || []).length > 1) {
                    const sortedHistory = [...item.maintenanceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    for (let i = 1; i < sortedHistory.length; i++) {
                        const daysDiff = differenceInDays(new Date(sortedHistory[i].date), new Date(sortedHistory[i - 1].date));
                        if (daysDiff > 0) {
                            totalDaysBetweenFailures += daysDiff;
                            failureCount++;
                        }
                    }
                }

                (item.preventivePlan || []).forEach(task => {
                    const nextDueDate = new Date(task.lastExecution);
                    nextDueDate.setDate(nextDueDate.getDate() + task.frequencyDays);
                    if (differenceInDays(nextDueDate, today) < 0) {
                        overdueTasks++;
                    }
                });
            });

            const mtbf = failureCount > 0 ? (totalDaysBetweenFailures / failureCount).toFixed(1) : "N/A";
            const mttr = repairCount > 0 ? (totalRepairTime / repairCount).toFixed(1) : "N/A";

            const mostMaintained = [...equipment]
                .sort((a, b) => (b.maintenanceHistory || []).length - (a.maintenanceHistory || []).length)
                .slice(0, 5);

            setData({
                totalMaintenances,
                totalMaintenanceCost,
                mtbf,
                mttr,
                maintenanceByMonth,
                mostMaintained,
                overdueTasks,
            });
            setIsLoading(false);
        }
        fetchData();
    }, []);

    if (isLoading || !data) {
        return <MaintenanceDashboardSkeleton />;
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard de Manutenção</h1>
                <p className="text-muted-foreground">
                    Análise e indicadores chave sobre as atividades de manutenção.
                </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Total de Manutenções</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalMaintenances}</div>
                     <p className="text-xs text-muted-foreground">
                        <Link href="/dashboard/corrective" className="hover:underline">Ver histórico completo</Link>
                    </p>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Custo Total de Manutenção</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.totalMaintenanceCost)}</div>
                    <p className="text-xs text-muted-foreground">Soma dos custos registrados</p>
                </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>MTBF (Dias)</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.mtbf}</div>
                        <p className="text-xs text-muted-foreground">Tempo médio entre falhas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>MTTR (Horas)</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.mttr}</div>
                        <p className="text-xs text-muted-foreground">Tempo médio para reparo</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Tarefas Preventivas Atrasadas</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{data.overdueTasks}</div>
                        <p className="text-xs text-muted-foreground">
                             <Link href="/dashboard/preventive" className="hover:underline">Ver agenda de preventivas</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                    <CardHeader>
                        <CardTitle>Custo de Manutenção Mensal</CardTitle>
                        <CardDescription>Custo total (R$) das manutenções nos últimos 12 meses.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <MaintenanceChart data={data.maintenanceByMonth} dataKey="cost" formatAsCurrency />
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader>
                        <CardTitle>Contagem de Manutenções Mensal</CardTitle>
                        <CardDescription>Número de manutenções registradas nos últimos 12 meses.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <MaintenanceChart data={data.maintenanceByMonth} dataKey="count" />
                    </CardContent>
                    </Card>
                </div>
                <Card className="lg:col-span-2">
                    <CardHeader>
                    <CardTitle>Top 5 Manutenções</CardTitle>
                    <CardDescription>Equipamentos que mais necessitaram de reparos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {
                        data.mostMaintained.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                            <Avatar className="h-9 w-9 hidden sm:flex">
                            {item.imageUrl && <AvatarImage src={item.imageUrl} alt={item.name} />}
                            <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{(item.maintenanceHistory || []).length} manutenções</p>
                            </div>
                            <Link href={`/dashboard/equipment/${item.id}`} passHref>
                            <Button variant="outline" size="sm">Ver</Button>
                            </Link>
                        </div>
                        ))
                    }
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

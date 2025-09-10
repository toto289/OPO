
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Package, Store, Wrench, ShieldCheck, Timer, Puzzle, Droplets, ListOrdered, ShoppingCart, DollarSign, Archive, TrendingDown, AreaChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MaintenanceChart } from '@/components/charts/maintenance-chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAllEquipment, getStores, getWarehouseComponents, getWarehouseInsumos } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import type { Equipment, Store as StoreType, WarehouseComponent, WarehouseInsumo } from '@/lib/types';


interface DashboardData {
    totalEquipment: number;
    totalStores: number;
    totalMaintenances: number;
    mrpItemsCount: number;
    totalAssetValue: number;
    totalStockValue: number;
    totalMaintenanceCost: number;
    mtbf: string;
    mttr: string;
    maintenanceByMonth: { name: string; count: number; cost: number }[];
    mostMaintained: Equipment[];
}

export function DashboardClientContent() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [equipment, stores, warehouseComponents, warehouseInsumos] = await Promise.all([
                getAllEquipment(),
                getStores(),
                getWarehouseComponents(),
                getWarehouseInsumos(),
            ]);

            const totalEquipment = equipment.length;
            const totalStores = stores.length;
            const totalMaintenances = equipment.reduce((acc, item) => acc + (item.maintenanceHistory || []).length, 0);

            // --- KPI Calculations ---
            const lowStockComponents = warehouseComponents.filter(c => c.quantityInStock <= (c.reorderPoint || 0)).length;
            const lowStockInsumos = warehouseInsumos.filter(i => i.quantityInStock <= (i.reorderPoint || 0)).length;
            const mrpItemsCount = lowStockComponents + lowStockInsumos;
            
            // --- Financial KPIs ---
            const totalAssetValue = equipment.reduce((acc, item) => acc + (item.value || 0), 0);
            const totalStockValue = warehouseComponents.reduce((acc, item) => acc + (item.cost || 0) * item.quantityInStock, 0) + warehouseInsumos.reduce((acc, item) => acc + (item.cost || 0) * item.quantityInStock, 0);
            const totalMaintenanceCost = equipment.reduce((acc, item) => acc + (item.maintenanceHistory || []).reduce((logAcc, log) => logAcc + (log.cost || 0), 0), 0);


            // --- MTBF e MTTR Calculation ---
            let totalDaysBetweenFailures = 0;
            let failureCount = 0;
            let totalRepairTime = 0;
            let repairCount = 0;

            equipment.forEach(item => {
                const history = item.maintenanceHistory || [];
                if (history.length > 1) {
                const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                for (let i = 1; i < sortedHistory.length; i++) {
                    const daysDiff = differenceInDays(new Date(sortedHistory[i].date), new Date(sortedHistory[i - 1].date));
                    if (daysDiff > 0) {
                        totalDaysBetweenFailures += daysDiff;
                        failureCount++;
                    }
                }
                }
                history.forEach(log => {
                if (log.tempoGasto && log.tempoGasto > 0) {
                    totalRepairTime += log.tempoGasto;
                    repairCount++;
                }
                });
            });

            const mtbf = failureCount > 0 ? (totalDaysBetweenFailures / failureCount).toFixed(1) : "N/A";
            const mttr = repairCount > 0 ? (totalRepairTime / repairCount).toFixed(1) : "N/A";


            // --- Chart Data ---
            const maintenanceByMonth = Array.from({ length: 12 }, (_, i) => ({
                name: format(new Date(0, i), "MMM", { locale: ptBR }),
                count: 0,
                cost: 0,
            }));

            equipment.forEach(item => {
                (item.maintenanceHistory || []).forEach(log => {
                const month = new Date(log.date).getMonth();
                maintenanceByMonth[month].count += 1;
                maintenanceByMonth[month].cost += (log.cost || 0);
                });
            });

            const mostMaintained = [...equipment]
                .sort((a, b) => (b.maintenanceHistory || []).length - (a.maintenanceHistory || []).length)
                .slice(0, 5);
            
            setData({
                totalEquipment,
                totalStores,
                totalMaintenances,
                mrpItemsCount,
                totalAssetValue,
                totalStockValue,
                totalMaintenanceCost,
                mtbf,
                mttr,
                maintenanceByMonth,
                mostMaintained,
            });

            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    if (isLoading || !data) {
        return null;
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Total de Ativos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalEquipment}</div>
                    <p className="text-xs text-muted-foreground">
                        <Link href="/dashboard/equipment" className="hover:underline">Ver inventário completo</Link>
                    </p>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Manutenções Registradas</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalMaintenances}</div>
                    <p className="text-xs text-muted-foreground">
                        <Link href="/dashboard/corrective" className="hover:underline">Ver histórico</Link>
                    </p>
                </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Valor Total dos Ativos</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalAssetValue)}</div>
                        <p className="text-xs text-muted-foreground">Soma do valor de compra</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Valor Total em Estoque</CardTitle>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalStockValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            <Link href="/dashboard/warehouse" className="hover:underline">Ver estoque</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Itens em Estoque Baixo</CardTitle>
                            <ListOrdered className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.mrpItemsCount}</div>
                            <p className="text-xs text-muted-foreground">
                                <Link href="/dashboard/mrp" className="hover:underline">Ir para o relatório MRP</Link>
                            </p>
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
                            <CardTitle>Unidades Atendidas</CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.totalStores}</div>
                            <p className="text-xs text-muted-foreground">
                                <Link href="/dashboard/stores" className="hover:underline">Ver todas</Link>
                            </p>
                        </CardContent>
                    </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Contagem de Manutenções Mensal</CardTitle>
                    <CardDescription>Número de manutenções registradas nos últimos 12 meses.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <MaintenanceChart data={data.maintenanceByMonth} dataKey="count" />
                </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                    <CardTitle>Top 5 Equipamentos com Mais Manutenções</CardTitle>
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
        </>
    );
}

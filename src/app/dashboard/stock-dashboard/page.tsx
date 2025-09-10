
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
import { Archive, DollarSign, ListOrdered, ShoppingCart, Puzzle, Droplets, TrendingDown, Warehouse } from "lucide-react";
import { StockValueChart } from "@/components/charts/stock-value-chart";
import { getWarehouseComponents, getWarehouseInsumos } from "@/lib/api";
import { useEffect, useState } from "react";
import type { WarehouseComponent, WarehouseInsumo } from "@/lib/types";

function StockDashboardSkeleton() {
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
            <CardContent className="flex justify-center">
                <Skeleton className="h-52 w-52 rounded-full" />
            </CardContent>
        </Card>
    </div>
  )
}

interface StockDashboardData {
    totalStockValue: number;
    mrpItemsCount: number;
    purchaseOrdersCount: number;
    uniqueComponents: number;
    uniqueInsumos: number;
    stockValueDistribution: { name: string; value: number; fill: string; }[];
}


export default function StockDashboardPage() {
    const [data, setData] = useState<StockDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [warehouseComponents, warehouseInsumos] = await Promise.all([
                getWarehouseComponents(),
                getWarehouseInsumos(),
            ]);

            const lowStockComponents = warehouseComponents.filter(c => c.quantityInStock <= (c.reorderPoint || 0)).length;
            const lowStockInsumos = warehouseInsumos.filter(i => i.quantityInStock <= (i.reorderPoint || 0)).length;
            const mrpItemsCount = lowStockComponents + lowStockInsumos;
            
            const totalComponentsStockValue = warehouseComponents.reduce((acc, item) => acc + (item.cost || 0) * item.quantityInStock, 0);
            const totalInsumosStockValue = warehouseInsumos.reduce((acc, item) => acc + (item.cost || 0) * item.quantityInStock, 0);

            const stockValueDistribution = [
                { name: "Componentes", value: totalComponentsStockValue, fill: "hsl(var(--chart-1))" },
                { name: "Insumos", value: totalInsumosStockValue, fill: "hsl(var(--chart-2))" },
            ];

            setData({
                totalStockValue: totalComponentsStockValue + totalInsumosStockValue,
                mrpItemsCount,
                purchaseOrdersCount: mrpItemsCount, // In our logic, requested items are the ones with low stock
                uniqueComponents: warehouseComponents.length,
                uniqueInsumos: warehouseInsumos.length,
                stockValueDistribution,
            })

            setIsLoading(false);
        }
        fetchData();
    }, [])

    if (isLoading || !data) {
        return <StockDashboardSkeleton />;
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard de Estoque</h1>
            <p className="text-muted-foreground">
                Indicadores e análise do estoque de componentes e insumos.
            </p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Valor Total em Estoque</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.totalStockValue)}</div>
                    <p className="text-xs text-muted-foreground">
                        <Link href="/dashboard/warehouse" className="hover:underline">Gerenciar estoque</Link>
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Itens com Estoque Baixo</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-destructive">{data.mrpItemsCount}</div>
                <p className="text-xs text-muted-foreground">
                    <Link href="/dashboard/mrp" className="hover:underline">Ver relatório MRP</Link>
                </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Ordens de Compra</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{data.purchaseOrdersCount}</div>
                <p className="text-xs text-muted-foreground">
                    <Link href="/dashboard/purchasing" className="hover:underline">Ver ordens pendentes</Link>
                </p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Tipos de Componentes</CardTitle>
                <Puzzle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{data.uniqueComponents}</div>
                <p className="text-xs text-muted-foreground">
                    <Link href="/dashboard/components" className="hover:underline">Ver catálogo</Link>
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Tipos de Insumos</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{data.uniqueInsumos}</div>
                <p className="text-xs text-muted-foreground">
                    <Link href="/dashboard/insumos" className="hover:underline">Ver análise de consumo</Link>
                </p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Composição do Valor em Estoque</CardTitle>
            <CardDescription>Distribuição do valor total do estoque entre componentes e insumos.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <StockValueChart data={data.stockValueDistribution} />
            </CardContent>
        </Card>

        </div>
    );
}

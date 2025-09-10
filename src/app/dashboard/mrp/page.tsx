
"use client";

import { useState, useEffect } from "react";
import { getAllEquipment, getWarehouseComponents, getWarehouseInsumos } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Droplets, Warehouse, ListOrdered, FileText, CalendarClock, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WarehouseComponent, WarehouseInsumo, Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

function MrpPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

interface ComponentReportItem extends WarehouseComponent {
    // Future prediction fields can go here
}

interface InsumoReportItem extends WarehouseInsumo {
    consumptionLast90Days: number;
    avgDailyConsumption: number;
    daysUntilStockout: number | null;
    predictedStockoutDate: string | null;
}

export default function MrpReportPage() {
  const { toast } = useToast();
  const [components, setComponents] = useState<ComponentReportItem[]>([]);
  const [insumos, setInsumos] = useState<InsumoReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const [
            fetchedComponents, 
            fetchedInsumos,
            allEquipment
        ] = await Promise.all([
            getWarehouseComponents(),
            getWarehouseInsumos(),
            getAllEquipment()
        ]);
        
        const lowStockComponents = fetchedComponents
            .filter(c => c.quantityInStock <= (c.reorderPoint || 0))
            .map(c => ({...c}));

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const insumoConsumption = fetchedInsumos.reduce((acc, insumo) => {
            acc[insumo.name] = { count: 0 };
            return acc;
        }, {} as Record<string, { count: number }>);
        
        allEquipment.forEach(equipment => {
            (equipment.maintenanceHistory || []).forEach(log => {
                if (new Date(log.date) > ninetyDaysAgo) {
                    const match = log.userRequest.match(/Substituição do insumo: (.+)/);
                    if (match) {
                        const insumoName = match[1].trim();
                        if (insumoConsumption[insumoName]) {
                            insumoConsumption[insumoName].count += 1;
                        }
                    }
                }
            });
        });

        const lowStockInsumos = fetchedInsumos
            .filter(i => i.quantityInStock <= (i.reorderPoint || 0))
            .map(i => {
                const consumptionLast90Days = insumoConsumption[i.name]?.count || 0;
                const avgDailyConsumption = consumptionLast90Days / 90;
                const daysUntilStockout = avgDailyConsumption > 0 ? Math.floor(i.quantityInStock / avgDailyConsumption) : null;
                const predictedStockoutDate = daysUntilStockout !== null ? format(addDays(new Date(), daysUntilStockout), "dd/MM/yyyy", { locale: ptBR }) : null;

                return {
                    ...i,
                    consumptionLast90Days,
                    avgDailyConsumption,
                    daysUntilStockout,
                    predictedStockoutDate
                }
            });

        setComponents(lowStockComponents);
        setInsumos(lowStockInsumos);
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleRequestComponentPurchase = (partNumber: string) => {
    const item = components.find(c => c.partNumber === partNumber);
    if (item) {
        toast({
          title: "Solicitação Enviada",
          description: `Um pedido de compra para ${item.name} foi enviado e está aguardando recebimento.`,
        });
        // Remove the item from the local state to make it disappear from the list
        setComponents(prev => prev.filter(c => c.partNumber !== partNumber));
    }
  };

  const handleRequestInsumoPurchase = (insumoId: string) => {
    const item = insumos.find(i => i.id === insumoId);
    if(item) {
        toast({
            title: "Solicitação Enviada",
            description: `Um pedido de compra para ${item.name} foi enviado e está aguardando recebimento.`,
        });
        // Remove the item from the local state
        setInsumos(prev => prev.filter(i => i.id !== insumoId));
    }
  };


  if (isLoading) {
    return <MrpPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Relatório de Necessidades (MRP)</h1>
          <p className="text-muted-foreground">
            Itens que atingiram o ponto de ressuprimento e precisam de compra.
          </p>
        </div>
         <Button asChild variant="outline">
            <Link href="/dashboard/purchasing">
                <ShoppingCart className="mr-2 h-4 w-4"/> Ver Ordens de Compra
            </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package />
            Componentes para Ressuprimento ({components.length})
          </CardTitle>
          <CardDescription>
            Estes componentes de reposição precisam ser comprados para manter o estoque de segurança.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Ponto de Pedido</TableHead>
                    <TableHead className="text-center">Diferença</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {components.length > 0 ? (
                        components.map(item => (
                             <TableRow key={item.partNumber} className="bg-destructive/5 hover:bg-destructive/10">
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="font-mono text-muted-foreground">{item.partNumber}</TableCell>
                                <TableCell className="text-center font-semibold text-destructive">{item.quantityInStock}</TableCell>
                                <TableCell className="text-center">{item.reorderPoint}</TableCell>
                                 <TableCell className="text-center font-bold text-destructive">
                                    {item.quantityInStock - (item.reorderPoint || 0)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleRequestComponentPurchase(item.partNumber)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Solicitar Compra
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                Nenhum componente com estoque baixo.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets />
            Insumos para Ressuprimento ({insumos.length})
          </CardTitle>
          <CardDescription>
            Estes insumos precisam ser comprados para evitar paradas. A previsão de término é baseada no consumo dos últimos 90 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Ponto de Pedido</TableHead>
                        <TableHead className="text-center">Consumo (90d)</TableHead>
                        <TableHead className="text-center">Previsão de Término</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {insumos.length > 0 ? (
                            insumos.map(item => (
                                <TableRow key={item.id} className="bg-destructive/5 hover:bg-destructive/10">
                                    <TableCell className="font-medium">{item.name} <p className="text-xs text-muted-foreground">{item.type}</p></TableCell>
                                    <TableCell className="text-center font-semibold text-destructive">{item.quantityInStock}</TableCell>
                                    <TableCell className="text-center">{item.reorderPoint}</TableCell>
                                    <TableCell className="text-center font-mono">{item.consumptionLast90Days}</TableCell>
                                    <TableCell className={cn("text-center font-medium", item.predictedStockoutDate && "text-destructive")}>
                                        {item.predictedStockoutDate ? (
                                          <div className="flex items-center justify-center gap-2">
                                            <CalendarClock className="h-4 w-4"/>
                                            {item.predictedStockoutDate}
                                          </div>
                                        ) : ("N/A")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => handleRequestInsumoPurchase(item.id)}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Solicitar Compra
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhum insumo com estoque baixo.
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

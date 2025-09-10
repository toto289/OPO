
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Package,
  Wrench,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  TrendingDown,
  CalendarClock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllEquipment,
  getWarehouseComponents,
  getWarehouseInsumos,
} from '@/lib/api';
import type {
  Equipment,
  WarehouseComponent,
  WarehouseInsumo,
  PreventiveTask,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { addDays, differenceInDays, format } from 'date-fns';

interface OverdueTask extends PreventiveTask {
  equipmentId: string;
  equipmentName: string;
  dueDate: Date;
  daysOverdue: number;
}

interface HighCostEquipment {
  id: string;
  name: string;
  totalCost: number;
  maintenanceCount: number;
}

interface FrequentFailureEquipment {
  id: string;
  name: string;
  maintenanceCount: number;
}

interface LowStockItem {
    id: string;
    name: string;
    type: 'Componente' | 'Insumo';
    quantityInStock: number;
    reorderPoint: number;
}

interface AuditData {
  overdueTasks: OverdueTask[];
  lowStockItems: LowStockItem[];
  highCostEquipment: HighCostEquipment[];
  frequentFailureEquipment: FrequentFailureEquipment[];
}

function AuditPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [allEquipment, warehouseComponents, warehouseInsumos] =
        await Promise.all([
          getAllEquipment(),
          getWarehouseComponents(),
          getWarehouseInsumos(),
        ]);
        
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Overdue Preventive Tasks
      const overdueTasks: OverdueTask[] = allEquipment
        .flatMap((eq) =>
          (eq.preventivePlan || []).map((task) => {
            const dueDate = addDays(new Date(task.lastExecution), task.frequencyDays);
            const daysOverdue = differenceInDays(today, dueDate);
            return {
              ...task,
              equipmentId: eq.id,
              equipmentName: eq.name,
              dueDate,
              daysOverdue,
            };
          })
        )
        .filter((task) => task.daysOverdue > 0)
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      // 2. Low Stock Items
      const lowStockComponents = warehouseComponents
        .filter((c) => c.quantityInStock <= (c.reorderPoint || 0))
        .map(c => ({ id: c.partNumber, name: c.name, type: 'Componente' as const, quantityInStock: c.quantityInStock, reorderPoint: c.reorderPoint || 0 }));

      const lowStockInsumos = warehouseInsumos
        .filter((i) => i.quantityInStock <= (i.reorderPoint || 0))
        .map(i => ({ id: i.id, name: i.name, type: 'Insumo' as const, quantityInStock: i.quantityInStock, reorderPoint: i.reorderPoint || 0 }));
      
      const lowStockItems = [...lowStockComponents, ...lowStockInsumos].sort((a,b) => (a.quantityInStock - a.reorderPoint) - (b.quantityInStock - b.reorderPoint));

      // 3. High Cost & Frequent Failure Equipment
      const equipmentAnalysis = allEquipment.map((eq) => ({
        id: eq.id,
        name: eq.name,
        totalCost: (eq.maintenanceHistory || []).reduce((acc, log) => acc + (log.cost || 0), 0),
        maintenanceCount: (eq.maintenanceHistory || []).filter(log => !log.userRequest.startsWith('Execução da tarefa')).length, // Count only corrective
      }));
      
      const highCostEquipment = [...equipmentAnalysis]
        .sort((a, b) => b.totalCost - a.totalCost)
        .filter(eq => eq.totalCost > 0)
        .slice(0, 10);
      
      const frequentFailureEquipment = [...equipmentAnalysis]
        .sort((a, b) => b.maintenanceCount - a.maintenanceCount)
        .filter(eq => eq.maintenanceCount > 0)
        .slice(0, 10);

      setData({
          overdueTasks,
          lowStockItems,
          highCostEquipment,
          frequentFailureEquipment
      });

      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading || !data) {
    return <AuditPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Auditoria e Análise de Riscos
        </h1>
        <p className="text-muted-foreground">
          Painel consolidado para identificação de riscos operacionais,
          financeiros e de conformidade.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <CalendarClock className="h-5 w-5" />
            Preventivas Atrasadas ({data.overdueTasks.length})
          </CardTitle>
          <CardDescription>
            Tarefas de manutenção preventiva que ultrapassaram o prazo, representando risco de falha do equipamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-center">Dias Atrasada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.overdueTasks.length > 0 ? (
                    data.overdueTasks.map(task => (
                        <TableRow key={task.id} className="bg-destructive/5 hover:bg-destructive/10">
                            <TableCell className="font-medium">{task.equipmentName}</TableCell>
                            <TableCell className="text-muted-foreground">{task.taskName}</TableCell>
                            <TableCell className="font-mono">{format(task.dueDate, 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant="destructive">{task.daysOverdue}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/equipment/${task.equipmentId}`}>Ver Equipamento <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Nenhuma tarefa preventiva atrasada.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <ShieldAlert className="h-5 w-5" />
            Risco de Estoque ({data.lowStockItems.length})
          </CardTitle>
          <CardDescription>
            Componentes e insumos que atingiram o ponto de ressuprimento, com risco de parada na operação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Ponto de Pedido</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {data.lowStockItems.length > 0 ? (
                    data.lowStockItems.map(item => (
                        <TableRow key={item.id} className="bg-yellow-500/5 hover:bg-yellow-500/10">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                            <TableCell className="text-center font-bold text-destructive">{item.quantityInStock}</TableCell>
                            <TableCell className="text-center">{item.reorderPoint}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/dashboard/mrp">Ver Relatório MRP <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Nenhum item com estoque baixo.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Maiores Custos de Manutenção
            </CardTitle>
            <CardDescription>
                Top 10 equipamentos com os maiores custos de manutenção acumulados.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {data.highCostEquipment.map(eq => (
                        <TableRow key={eq.id}>
                            <TableCell className="font-medium">{eq.name}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-amber-700">
                                {eq.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                        </TableRow>
                   ))}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maiores Índices de Falha
            </CardTitle>
            <CardDescription>
                Top 10 equipamentos com a maior quantidade de manutenções corretivas.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead className="text-right">Nº de Falhas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {data.frequentFailureEquipment.map(eq => (
                        <TableRow key={eq.id}>
                            <TableCell className="font-medium">{eq.name}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                                {eq.maintenanceCount}
                            </TableCell>
                        </TableRow>
                   ))}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}


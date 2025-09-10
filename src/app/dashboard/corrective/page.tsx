
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAllEquipment } from '@/lib/api';
import type { Equipment, MaintenanceLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Wrench,
  Package,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnrichedLog extends MaintenanceLog {
  equipmentId: string;
  equipmentName: string;
}

function CorrectivePageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(5)].map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-5 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CorrectiveMaintenancePage() {
  const [logs, setLogs] = useState<EnrichedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const allEquipment = await getAllEquipment();

      const allLogs: EnrichedLog[] = allEquipment.flatMap(
        (equipment: Equipment) =>
          (equipment.maintenanceHistory || [])
            .filter(log => !log.userRequest.startsWith('Execução da tarefa de manutenção preventiva:'))
            .map((log: MaintenanceLog) => {
              return {
                ...log,
                equipmentId: equipment.id,
                equipmentName: equipment.name,
              };
            })
      );

      // Sort logs by date, most recent first
      allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setLogs(allLogs);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <CorrectivePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Histórico de Manutenções Corretivas
        </h1>
        <p className="text-muted-foreground">
          Visualize todos os registros de reparos e intervenções corretivas realizados nos equipamentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Manutenção Corretiva</CardTitle>
          <CardDescription>
            Lista de todas as intervenções de reparo, ordenadas das mais recentes para as mais antigas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Serviço Realizado</TableHead>
                  <TableHead className="text-center">Custo</TableHead>
                  <TableHead className="text-center">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground"/>
                        {log.equipmentName}
                      </TableCell>
                       <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.generatedLog}</span>
                            {log.componentName && (
                                <Badge variant="secondary" className="w-fit mt-1">
                                <Wrench className="h-3 w-3 mr-1.5"/>
                                Componente: {log.componentName}
                                </Badge>
                            )}
                          </div>
                      </TableCell>
                       <TableCell className="text-center font-mono">
                        {log.cost ? (
                          <div className="flex items-center justify-center gap-1.5 text-amber-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            {log.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {format(new Date(log.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/equipment/${log.equipmentId}`}>
                            Ver Equipamento <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                         <Info className="h-8 w-8 text-muted-foreground" />
                        <span>Nenhum registro de manutenção corretiva encontrado.</span>
                      </div>
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

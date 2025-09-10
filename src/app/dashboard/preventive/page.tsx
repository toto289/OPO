
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
import type { Equipment, PreventiveTask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnrichedTask extends PreventiveTask {
  equipmentId: string;
  equipmentName: string;
  nextDueDate: Date;
  status: 'Atrasado' | 'Vence Hoje' | 'Em Dia';
}

function PreventivePageSkeleton() {
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
                {[...Array(5)].map((_, i) => (
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

export default function PreventiveMaintenancePage() {
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const allEquipment = await getAllEquipment();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today's date

      const allTasks: EnrichedTask[] = allEquipment.flatMap(
        (equipment: Equipment) =>
          (equipment.preventivePlan || []).map((task: PreventiveTask) => {
            const lastDone = new Date(task.lastExecution);
            const nextDueDate = addDays(lastDone, task.frequencyDays);
            const daysDiff = differenceInDays(nextDueDate, today);

            let status: 'Atrasado' | 'Vence Hoje' | 'Em Dia' = 'Em Dia';
            if (daysDiff < 0) {
              status = 'Atrasado';
            } else if (daysDiff === 0) {
              status = 'Vence Hoje';
            }

            return {
              ...task,
              equipmentId: equipment.id,
              equipmentName: equipment.name,
              nextDueDate,
              status,
            };
          })
      );

      // Sort tasks: Overdue first, then due today, then by due date
      allTasks.sort((a, b) => {
        if (a.status === 'Atrasado' && b.status !== 'Atrasado') return -1;
        if (a.status !== 'Atrasado' && b.status === 'Atrasado') return 1;
        if (a.status === 'Vence Hoje' && b.status !== 'Vence Hoje') return -1;
        if (a.status !== 'Vence Hoje' && b.status === 'Vence Hoje') return 1;
        return a.nextDueDate.getTime() - b.nextDueDate.getTime();
      });

      setTasks(allTasks);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <PreventivePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Planos de Manutenção Preventiva
        </h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie todas as tarefas de manutenção preventiva
          agendadas para os equipamentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda de Tarefas Preventivas</CardTitle>
          <CardDescription>
            Lista de todas as tarefas preventivas, ordenadas por prioridade
            (atrasadas, vencendo hoje, e próximas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={`${task.equipmentId}-${task.id}`}>
                      <TableCell>
                        <Badge
                          variant={
                            task.status === 'Atrasado'
                              ? 'destructive'
                              : task.status === 'Vence Hoje'
                              ? 'default'
                              : 'outline'
                          }
                          className="gap-1.5"
                        >
                          {task.status === 'Atrasado' && (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {task.status === 'Vence Hoje' && (
                            <CalendarClock className="h-3.5 w-3.5" />
                          )}
                          {task.status === 'Em Dia' && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {task.taskName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.equipmentName}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'font-mono',
                          task.status === 'Atrasado' && 'text-destructive',
                          task.status === 'Vence Hoje' && 'text-primary font-semibold'
                        )}
                      >
                        {format(task.nextDueDate, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/equipment/${task.equipmentId}`}>
                            Ver Equipamento{' '}
                            <ArrowRight className="ml-2 h-4 w-4" />
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
                      Nenhum plano de manutenção preventiva configurado.
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

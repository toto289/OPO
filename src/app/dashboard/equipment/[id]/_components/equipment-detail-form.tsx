
"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Trash2, PackageSearch, Loader2, PlusCircle, Save, Wrench, PackagePlus, Replace, Upload, DollarSign, CalendarPlus, CheckCircle2, Printer } from "lucide-react";
import LocationTracker from "@/components/location-tracker";
import MaintenanceLog from "@/components/maintenance-log";
import type { Equipment, Component as EquipmentComponent, Insumo, Store as StoreType, PreventiveTask } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createMaintenanceLog, addMaintenanceLog, deleteEquipment, updateEquipment, getEquipmentComponents, getEquipmentInsumos } from "@/lib/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { addDays, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";


const logFormSchema = z.object({
  modifications: z.string().min(10, "Descreva as modificações com pelo menos 10 caracteres."),
  tempoGasto: z.coerce.number().min(0, "O tempo gasto não pode ser negativo.").optional(),
  cost: z.coerce.number().min(0, "O custo não pode ser negativo.").optional(),
});

const preventiveTaskSchema = z.object({
  taskName: z.string().min(3, "O nome da tarefa é obrigatório."),
  frequencyDays: z.coerce.number().min(1, "A frequência deve ser de pelo menos 1 dia."),
});

function PreventiveTaskModal({ equipment, onTaskChange, taskToEdit }: { equipment: Equipment, onTaskChange: () => void, taskToEdit?: PreventiveTask }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof preventiveTaskSchema>>({
    resolver: zodResolver(preventiveTaskSchema),
    defaultValues: taskToEdit ? {
      taskName: taskToEdit.taskName,
      frequencyDays: taskToEdit.frequencyDays,
    } : {
      taskName: "",
      frequencyDays: 30,
    },
  });
  
  useEffect(() => {
    if (open) {
      form.reset(taskToEdit ? { taskName: taskToEdit.taskName, frequencyDays: taskToEdit.frequencyDays } : { taskName: "", frequencyDays: 30 });
    }
  }, [open, taskToEdit, form]);

  async function onSubmit(values: z.infer<typeof preventiveTaskSchema>) {
    const existingPlan = equipment.preventivePlan || [];
    let newPlan: PreventiveTask[];

    if (taskToEdit) {
      // Edit existing task
      newPlan = existingPlan.map(t => t.id === taskToEdit.id ? { ...t, ...values } : t);
    } else {
      // Add new task
       const newTask: PreventiveTask = {
        id: `prev-task-${Date.now()}`,
        ...values,
        lastExecution: new Date().toISOString(), // Set last execution to now
      };
      newPlan = [...existingPlan, newTask];
    }
    
    const result = await updateEquipment(equipment.id, { preventivePlan: newPlan });

    if (result.success) {
      toast({
        title: `Tarefa ${taskToEdit ? 'Atualizada' : 'Adicionada'}!`,
        description: `A tarefa preventiva '${values.taskName}' foi salva.`,
      });
      onTaskChange();
      setOpen(false);
    } else {
       toast({
        variant: "destructive",
        title: "Erro ao Salvar Tarefa",
        description: result.error || "Não foi possível salvar a tarefa preventiva.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {taskToEdit ? (
          <Button variant="ghost" size="icon"><Wrench className="h-4 w-4" /></Button>
        ) : (
          <Button type="button" size="sm" variant="outline">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Adicionar Tarefa Preventiva
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Editar Tarefa' : 'Adicionar Nova Tarefa Preventiva'}</DialogTitle>
          <DialogDescription>
            Defina uma tarefa de manutenção recorrente para este equipamento. A data da última execução será definida como hoje.
          </DialogDescription>
        </DialogHeader>
         <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Tarefa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lubrificar correntes, Inspecionar fiação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequencyDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência (em dias)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit">{taskToEdit ? 'Salvar Alterações' : 'Adicionar Tarefa'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function ComponentMaintenanceModal({ component, equipment, onLogCreated }: { component: EquipmentComponent, equipment: Equipment, onLogCreated: () => void }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);


  const form = useForm<z.infer<typeof logFormSchema>>({
    resolver: zodResolver(logFormSchema),
    defaultValues: { modifications: "", tempoGasto: 0, cost: 0 },
  });
  
  useEffect(() => {
    if (open) {
      form.reset({ modifications: "", tempoGasto: 0, cost: 0 });
    }
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof logFormSchema>) {
    setIsGenerating(true);
    const result = await createMaintenanceLog({
      equipmentName: `${equipment.name} (Componente: ${component.name})`,
      equipmentDescription: component.description || `Part number: ${component.partNumber}`,
      modifications: values.modifications,
      componentId: component.id,
      componentName: component.name,
      componentPartNumber: component.partNumber, // Chave para buscar no almoxarifado
      tempoGasto: values.tempoGasto,
      cost: values.cost || undefined, // Se for 0, passa undefined para buscar no almoxarifado
    });

    if (result.success && result.logData) {
        await addMaintenanceLog(equipment.id, result.logData);
      toast({ 
        title: "Log de Manutenção Gerado!", 
        description: "O novo registro foi adicionado ao histórico e o estoque foi atualizado (se aplicável)."
      });
      onLogCreated();
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Geração do Log",
        description: result.error || "Não foi possível gerar o log com IA.",
      });
    }
    setIsGenerating(false);
  }

  return (
     <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wrench className="mr-2 h-4 w-4" />
          Registrar Manutenção
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Manutenção para: {component.name}</DialogTitle>
          <DialogDescription>Descreva o serviço e custos. Se o custo for 0, o sistema usará o valor do almoxarifado e deduzirá o estoque.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Serviço</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Substituição do rolamento, limpeza dos contatos."
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="tempoGasto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo Gasto (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 1.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Manual (R$)</FormLabel>
                       <div className="relative">
                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input
                            type="number"
                            placeholder="0.00"
                             className="pl-9"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? "Gerando com IA..." : "Gerar e Salvar Log"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function InsumoReplacementModal({ insumo, equipment, onLogCreated }: { insumo: Insumo, equipment: Equipment, onLogCreated: () => void }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleReplacement = async () => {
    setIsGenerating(true);
    const modificationDescription = `Substituição do insumo: ${insumo.name}`;
    
    const result = await createMaintenanceLog({
      equipmentName: equipment.name,
      equipmentDescription: equipment.description,
      modifications: modificationDescription,
      insumoName: insumo.name, // Chave para buscar no almoxarifado
      tempoGasto: 0.5 // Default de 30 min para troca de insumo
    });
    
    if (result.success && result.logData) {
       await addMaintenanceLog(equipment.id, result.logData);
      toast({ 
          title: "Substituição Registrada!", 
          description: `A troca do insumo '${insumo.name}' foi registrada e o estoque foi atualizado.` 
      });
      onLogCreated();
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Erro no Registro",
        description: result.error || "Não foi possível registrar a substituição com IA.",
      });
    }
    setIsGenerating(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Replace className="mr-2 h-4 w-4" />
          Marcar como Trocado
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Substituição</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá gerar um registro no histórico para a troca do insumo <span className="font-semibold">{insumo.name}</span>, deduzir 1 unidade do estoque e registrar o custo automaticamente. Você confirma?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReplacement} disabled={isGenerating}>
            {isGenerating ? "Registrando..." : "Confirmar e Registrar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Client-side component to handle date formatting and avoid hydration mismatch
function PreventiveTaskRow({ task, equipment, onComplete, onTaskChange }: {
  task: PreventiveTask,
  equipment: Equipment,
  onComplete: () => void,
  onTaskChange: () => void
}) {
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const nextDueDate = addDays(new Date(task.lastExecution), task.frequencyDays);
    setDueDate(nextDueDate);
    setIsOverdue(differenceInDays(new Date(), nextDueDate) > 0);
  }, [task.lastExecution, task.frequencyDays]);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPlan = (equipment.preventivePlan || []).filter(t => t.id !== task.id);
    const result = await updateEquipment(equipment.id, { preventivePlan: newPlan });
    if (result.success) {
        toast({ title: "Tarefa Removida", description: "A tarefa preventiva foi removida do plano." });
        onTaskChange();
    } else {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover a tarefa." });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{task.taskName}</TableCell>
      <TableCell>{task.frequencyDays} dias</TableCell>
      <TableCell className={cn("font-mono", isOverdue && "text-destructive font-semibold")}>
        {dueDate ? format(dueDate, 'dd/MM/yyyy') : 'Calculando...'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onComplete}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir
          </Button>
          <PreventiveTaskModal 
                equipment={equipment}
                onTaskChange={onTaskChange}
                taskToEdit={task} 
          />
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

const PrintableComponent = forwardRef<HTMLDivElement, { equipment: Equipment }>(
  ({ equipment }, ref) => {
    return (
      <div ref={ref} className="p-4 text-black bg-white">
        <h2 className="text-center text-xl font-bold mb-2">{equipment.name}</h2>
        <QRCode
          value={equipment.id}
          size={256}
          style={{ height: "auto", margin: "0 auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
        <p className="text-center font-mono mt-2 text-lg">{equipment.id}</p>
      </div>
    );
  }
);
PrintableComponent.displayName = "PrintableComponent";


interface EquipmentDetailFormProps {
    equipment: Equipment;
    stores: StoreType[];
}

export function EquipmentDetailForm({ equipment: initialEquipment, stores }: EquipmentDetailFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
    const [isFindingComponents, setIsFindingComponents] = useState(false);
    const [isFindingInsumos, setIsFindingInsumos] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalId] = useState(initialEquipment.id);
    
    const printableComponentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => printableComponentRef.current,
        documentTitle: `Etiqueta QR Code - ${equipment.name} (${equipment.id})`,
    });

    useEffect(() => {
        setEquipment(initialEquipment);
    }, [initialEquipment]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEquipment(prev => ({...prev, imageUrl: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddComponentManually = () => {
        setEquipment(prev => ({
            ...prev,
            components: [...(prev.components || []), { id: `manual-comp-${Date.now()}`, name: "", partNumber: "", description: "" }],
        }));
    };

    const handleRemoveComponent = (id: string) => {
        setEquipment(prev => ({
            ...prev,
            components: prev.components?.filter((c) => c.id !== id)
        }));
    };

    const handleComponentChange = (id: string, field: keyof EquipmentComponent, value: string) => {
        setEquipment(prev => ({
            ...prev,
            components: prev.components?.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        }));
    };

    const handleAddInsumoManually = () => {
        setEquipment(prev => ({
            ...prev,
            insumos: [...(prev.insumos || []), { id: `manual-ins-${Date.now()}`, name: "", type: "", description: "" }],
        }));
    };

    const handleRemoveInsumo = (id: string) => {
        setEquipment(prev => ({
            ...prev,
            insumos: prev.insumos?.filter((i) => i.id !== id)
        }));
    };

    const handleInsumoChange = (id: string, field: keyof Insumo, value: string) => {
        setEquipment(prev => ({
            ...prev,
            insumos: prev.insumos?.map((i) => (i.id === id ? { ...i, [field]: value } : i))
        }));
    };
    
    const handleEquipmentChange = (field: keyof Omit<Equipment, 'components' | 'insumos' | 'location' | 'maintenanceHistory' | 'preventivePlan'>, value: string | number) => {
        setEquipment(prev => ({ ...prev, [field]: value }));
    };

    const handleDataChange = () => {
        router.refresh();
    };

    const handleFindComponents = async () => {
        if (!equipment?.name || !equipment?.model) {
            toast({
                variant: "destructive",
                title: "Informações Faltando",
                description: "O nome e o modelo do equipamento são necessários para buscar componentes.",
            });
            return;
        }
        setIsFindingComponents(true);
        const result = await getEquipmentComponents({
            equipmentName: equipment.name,
            model: equipment.model,
        });
        setIsFindingComponents(false);

        if (result.success && result.data?.components) {
            setEquipment(prev => ({
                ...prev,
                components: [...(prev.components || []), ...result.data.components]
            }));
            toast({
                title: "Componentes Encontrados!",
                description: `A IA adicionou ${result.data.components.length} novos componentes à lista.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Erro na Busca",
                description: result.error || "Não foi possível encontrar os componentes.",
            });
        }
    };

    const handleFindInsumos = async () => {
        if (!equipment?.name || !equipment?.model) {
            toast({
                variant: "destructive",
                title: "Informações Faltando",
                description: "O nome e o modelo do equipamento são necessários para buscar insumos.",
            });
            return;
        }
        setIsFindingInsumos(true);
        const result = await getEquipmentInsumos({
            equipmentName: equipment.name,
            model: equipment.model,
        });
        setIsFindingInsumos(false);

        if (result.success && result.data?.insumos) {
            setEquipment(prev => ({
                ...prev,
                insumos: [...(prev.insumos || []), ...result.data.insumos]
            }));
            toast({
                title: "Insumos Encontrados!",
                description: `A IA adicionou ${result.data.insumos.length} novos insumos à lista.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Erro na Busca de Insumos",
                description: result.error || "Não foi possível encontrar os insumos.",
            });
        }
    };

    const handleCompletePreventiveTask = async (task: PreventiveTask) => {
        // Update last execution date to today
        const updatedPlan = (equipment.preventivePlan || []).map(t =>
            t.id === task.id ? { ...t, lastExecution: new Date().toISOString() } : t
        );
        
        // Create a maintenance log entry for this action
        const logResult = await createMaintenanceLog({
            equipmentName: equipment.name,
            equipmentDescription: equipment.description,
            modifications: `Execução da tarefa de manutenção preventiva: ${task.taskName}.`,
            tempoGasto: 0, // Assume quick tasks for this demo
        });

        if (logResult.success && logResult.logData) {
            await addMaintenanceLog(equipment.id, logResult.logData);
            const updateResult = await updateEquipment(equipment.id, { preventivePlan: updatedPlan });
             if (updateResult.success) {
                toast({
                    title: "Tarefa Concluída!",
                    description: `A tarefa '${task.taskName}' foi marcada como concluída e um log foi gerado.`,
                });
                handleDataChange();
            } else {
                 toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o plano de manutenção." });
            }
        } else {
             toast({ variant: "destructive", title: "Erro ao Gerar Log", description: logResult.error });
        }
    };


    const handleSaveChanges = async () => {
        if (equipment) {
            setIsSaving(true);
            const result = await updateEquipment(originalId, equipment);
            setIsSaving(false);

            if (result.success) {
                 toast({
                    title: "Alterações Salvas",
                    description: "Os dados do equipamento foram atualizados com sucesso.",
                });
                if (originalId !== equipment.id) {
                    router.push(`/dashboard/equipment/${equipment.id}`);
                } else {
                    router.refresh();
                }
            } else {
                 toast({
                    variant: "destructive",
                    title: "Erro ao Salvar",
                    description: result.error,
                });
                 if (result.error?.includes("patrimônio")) {
                    setEquipment(prev => ({...prev, id: originalId}));
                }
            }
        }
    };

    const handleDelete = async () => {
        if (equipment) {
            const equipmentName = equipment.name;
            await deleteEquipment(equipment.id);
            toast({
                title: "Equipamento Excluído",
                description: `O equipamento "${equipmentName}" foi removido com sucesso.`,
            });
            router.push("/dashboard/equipment");
        }
    };

    const handleStoreChange = (storeId: string) => {
        setEquipment({ ...equipment, storeId });
    };

    const currentStore = stores.find(s => s.id === equipment.storeId);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/dashboard/equipment">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Voltar</span>
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold leading-none tracking-tight truncate">{equipment.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive-outline">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deletar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o equipamento
                                    e removerá seus dados de nossos servidores.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                     <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                                        <Avatar className="h-full w-full rounded-none">
                                            {equipment.imageUrl && (
                                                <AvatarImage 
                                                    src={equipment.imageUrl} 
                                                    alt={equipment.name} 
                                                    className="object-cover"
                                                />
                                            )}
                                            <AvatarFallback className="rounded-none text-2xl">
                                                {getInitials(equipment.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="equipment-image-upload" className="cursor-pointer">
                                            <Button asChild variant="outline" className="w-full">
                                                <div>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Modificar Foto do Equipamento
                                                </div>
                                            </Button>
                                        </Label>
                                        <Input id="equipment-image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="equipment-name">Nome do Equipamento</Label>
                                        <Input
                                            id="equipment-name"
                                            value={equipment.name}
                                            onChange={(e) => handleEquipmentChange('name', e.target.value)}
                                            placeholder="Nome do Equipamento"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="equipment-description">Descrição</Label>
                                        <Textarea
                                            id="equipment-description"
                                            value={equipment.description}
                                            onChange={(e) => handleEquipmentChange('description', e.target.value)}
                                            placeholder="Descrição detalhada do equipamento"
                                            className="h-24 resize-y"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="equipment-model">Modelo</Label>
                                        <Input
                                            id="equipment-model"
                                            value={equipment.model || ''}
                                            onChange={(e) => handleEquipmentChange('model', e.target.value)}
                                            placeholder="Modelo do equipamento"
                                        />
                                    </div>
                                    {currentStore && (
                                        <div className="space-y-2">
                                            <Label>Unidade (Loja)</Label>
                                            <Select value={equipment.storeId} onValueChange={handleStoreChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a loja" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stores.map((store: StoreType) => (
                                                        <SelectItem key={store.id} value={store.id}>{`${store.id}: ${store.name}`}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="equipment-id">Nº de Patrimônio</Label>
                                            <Input
                                                id="equipment-id"
                                                value={equipment.id}
                                                onChange={(e) => handleEquipmentChange('id', e.target.value)}
                                                className="font-mono"
                                                placeholder="ID do Patrimônio"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="equipment-value">Valor do Ativo (R$)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="equipment-value"
                                                    type="number"
                                                    value={equipment.value || 0}
                                                    className="pl-9"
                                                    onChange={(e) => handleEquipmentChange('value', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Plano de Manutenção Preventiva</CardTitle>
                            <CardDescription>Configure e acompanhe tarefas de manutenção recorrentes para este equipamento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {(equipment.preventivePlan?.length || 0) > 0 ? (
                                 <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tarefa</TableHead>
                                                <TableHead>Frequência</TableHead>
                                                <TableHead>Próxima Execução</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {equipment.preventivePlan?.map((task) => (
                                                <PreventiveTaskRow 
                                                    key={task.id}
                                                    task={task}
                                                    equipment={equipment}
                                                    onComplete={() => handleCompletePreventiveTask(task)}
                                                    onTaskChange={handleDataChange}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                 </div>
                             ) : (
                                <div className="text-center text-muted-foreground py-8 border-dashed border-2 rounded-md">
                                    <p>Nenhuma tarefa de manutenção preventiva configurada.</p>
                                </div>
                             )}
                              <PreventiveTaskModal equipment={equipment} onTaskChange={handleDataChange} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciar Componentes</CardTitle>
                            <CardDescription>Adicione, remova ou edite os componentes deste equipamento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isFindingComponents && (
                                <div className="text-center py-8">
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                    <p className="mt-2 text-muted-foreground">A IA está buscando novos componentes...</p>
                                </div>
                            )}

                            {(equipment.components?.length || 0) > 0 ? (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[25%]">Componente</TableHead>
                                                <TableHead className="w-[20%]">Part Number</TableHead>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead className="w-[180px] text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {equipment.components?.map((component) => (
                                                <TableRow key={component.id}>
                                                    <TableCell>
                                                        <Input value={component.name} onChange={(e) => handleComponentChange(component.id, 'name', e.target.value)} placeholder="Nome" className="h-8" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={component.partNumber} onChange={(e) => handleComponentChange(component.id, 'partNumber', e.target.value)} placeholder="Número" className="h-8" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={component.description || ''} onChange={(e) => handleComponentChange(component.id, 'description', e.target.value)} placeholder="Descrição" className="h-8" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <ComponentMaintenanceModal
                                                                component={component}
                                                                equipment={equipment}
                                                                onLogCreated={handleDataChange}
                                                            />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveComponent(component.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                !isFindingComponents &&
                                <div className="text-center text-muted-foreground py-8 border-dashed border-2 rounded-md">
                                    <p>Nenhum componente associado a este equipamento.</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleAddComponentManually}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Manualmente
                                </Button>
                                <Button type="button" size="sm" onClick={handleFindComponents} disabled={isFindingComponents || !equipment.model}>
                                    <PackageSearch className="mr-2 h-4 w-4" />
                                    {isFindingComponents ? "Buscando..." : "Adicionar com IA"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciar Insumos</CardTitle>
                            <CardDescription>Adicione, remova ou edite os insumos para manutenção preventiva.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isFindingInsumos && (
                                <div className="text-center py-8">
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                    <p className="mt-2 text-muted-foreground">A IA está buscando novos insumos...</p>
                                </div>
                            )}

                            {(equipment.insumos?.length || 0) > 0 ? (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[30%]">Insumo</TableHead>
                                                <TableHead className="w-[20%]">Tipo</TableHead>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead className="w-[220px] text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {equipment.insumos?.map((insumo) => (
                                                <TableRow key={insumo.id}>
                                                    <TableCell>
                                                        <Input value={insumo.name} onChange={(e) => handleInsumoChange(insumo.id, 'name', e.target.value)} placeholder="Nome do insumo" className="h-8" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={insumo.type} onChange={(e) => handleInsumoChange(insumo.id, 'type', e.target.value)} placeholder="Ex: Lubrificante" className="h-8" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={insumo.description || ''} onChange={(e) => handleInsumoChange(insumo.id, 'description', e.target.value)} placeholder="Descrição" className="h-8" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <InsumoReplacementModal
                                                                insumo={insumo}
                                                                equipment={equipment}
                                                                onLogCreated={handleDataChange}
                                                            />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInsumo(insumo.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                !isFindingInsumos &&
                                <div className="text-center text-muted-foreground py-8 border-dashed border-2 rounded-md">
                                    <p>Nenhum insumo associado a este equipamento.</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleAddInsumoManually}>
                                    <PackagePlus className="mr-2 h-4 w-4" /> Adicionar Manualmente
                                </Button>
                                <Button type="button" size="sm" onClick={handleFindInsumos} disabled={isFindingInsumos || !equipment.model}>
                                    <PackageSearch className="mr-2 h-4 w-4" />
                                    {isFindingInsumos ? "Buscando..." : "Adicionar com IA"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <MaintenanceLog equipment={equipment} onLogAdded={handleDataChange}/>
                </div>

                <div className="lg:col-span-1 space-y-6">
                   <Card>
                        <CardHeader>
                            <CardTitle>Nº de Patrimônio (QR Code)</CardTitle>
                            <CardDescription>Use este código para identificar o equipamento rapidamente.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                             <div className="bg-white p-4 rounded-lg border w-full max-w-[200px] h-auto aspect-square">
                                <QRCode
                                    value={equipment.id}
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                            <div style={{ display: "none" }}>
                                <PrintableComponent ref={printableComponentRef} equipment={equipment} />
                            </div>
                             <Button onClick={handlePrint} variant="outline" className="w-full">
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir Etiqueta
                            </Button>
                        </CardContent>
                    </Card>
                    <LocationTracker 
                        location={equipment.location || {}} 
                        onLocationChange={(newLocation) => setEquipment(prev => ({ ...prev, location: newLocation }))}
                    />
                </div>
            </div>
        </div>
    );
}

    

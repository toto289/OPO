
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createMaintenanceLog, addMaintenanceLog } from "@/lib/actions";
import type { Equipment } from "@/lib/types";
import { Sparkles, FileText, User, Clock, HardHat, Timer, DollarSign } from "lucide-react";
import { Input } from "./ui/input";

interface MaintenanceLogProps {
  equipment: Equipment;
  onLogAdded: () => void;
}

const formSchema = z.object({
  modifications: z.string().min(10, "Descreva as modificações com pelo menos 10 caracteres."),
  tempoGasto: z.coerce.number().min(0, "O tempo gasto não pode ser negativo.").optional(),
});

// Component to prevent hydration mismatch for dates
function FormattedDate({ dateString }: { dateString: string }) {
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        // This effect runs only on the client, after hydration
        setFormattedDate(format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }, [dateString]);

    // Return the formatted date, or a placeholder/nothing until client-side hydration is complete
    return <span>{formattedDate}</span>;
}


export default function MaintenanceLog({ equipment, onLogAdded }: MaintenanceLogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { modifications: "", tempoGasto: 0 },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    const result = await createMaintenanceLog({
      equipmentName: equipment.name,
      equipmentDescription: equipment.description,
      modifications: values.modifications,
      tempoGasto: values.tempoGasto,
    });

    if (result.success && result.logData) {
      await addMaintenanceLog(equipment.id, {
        userRequest: values.modifications,
        generatedLog: result.data.logEntry,
        tempoGasto: values.tempoGasto,
        cost: result.logData.cost
      });
      toast({ title: "Log de Manutenção Gerado!", description: "O novo registro foi adicionado ao histórico." });
      form.reset();
      onLogAdded(); // Callback to notify parent
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Geração do Log",
        description: result.error || "Não foi possível gerar o log com IA.",
      });
    }
     setIsGenerating(false);
  }
  
  const sortedHistory = [...(equipment.maintenanceHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Manutenção Geral</CardTitle>
        <CardDescription>Adicione e visualize os logs de manutenção do equipamento.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <FormField
              control={form.control}
              name="modifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Manutenção Geral</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Troca da escova de carvão, lubrificação do mandril."
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tempoGasto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo Gasto (em horas)</FormLabel>
                  <FormControl>
                     <Input
                      type="number"
                      placeholder="Ex: 2.5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isGenerating}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Gerando com IA..." : "Gerar e Salvar Log"}
            </Button>
          </form>
        </Form>
        
        <div className="space-y-6">
          {sortedHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-2">Nenhum registro de manutenção encontrado.</p>
            </div>
          ) : (
            sortedHistory.map((log) => (
              <div key={log.id} className="relative pl-8 border-l-2">
                 <div className="absolute -left-[11px] top-0 h-5 w-5 rounded-full bg-primary ring-4 ring-background" />
                 <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <FormattedDate dateString={log.date} />
                        </div>
                         {log.tempoGasto !== undefined && log.tempoGasto > 0 && (
                            <div className="flex items-center gap-2">
                                <Timer className="h-4 w-4" />
                                <span>{log.tempoGasto} horas</span>
                            </div>
                        )}
                        {log.cost !== undefined && log.cost > 0 && (
                            <div className="flex items-center gap-2 font-medium text-amber-600">
                                <DollarSign className="h-4 w-4" />
                                <span>Custo: {log.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                    </div>
                    {log.componentName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                            <HardHat className="h-4 w-4 text-amber-500" />
                            <span>Manutenção no componente: {log.componentName}</span>
                        </div>
                    )}
                    <div className="p-4 rounded-md border bg-muted/50">
                        <p className="font-semibold flex items-center gap-2"><User className="h-4 w-4"/>Sua descrição:</p>
                        <p className="text-sm text-muted-foreground italic">"{log.userRequest}"</p>
                    </div>
                    <div className="p-4 rounded-md border bg-primary/5">
                        <p className="font-semibold flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4"/>Log Gerado por IA:</p>
                        <p className="text-sm">{log.generatedLog}</p>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Edit, PackagePlus, Truck, DollarSign } from "lucide-react";
import { WarehouseComponent, WarehouseInsumo, Equipment, Store } from "@/lib/types";
import { addWarehouseComponent, addWarehouseInsumo, updateWarehouseComponent, updateWarehouseInsumo, updateEquipment } from "@/lib/actions";
import { getAllEquipment } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// --- SCHEMAS ---
const componentSchema = z.object({
  partNumber: z.string().min(1, "Part number é obrigatório."),
  name: z.string().min(3, "Nome é obrigatório."),
  description: z.string().optional(),
  quantityInStock: z.coerce.number().min(0, "Estoque não pode ser negativo."),
  reorderPoint: z.coerce.number().min(0, "Ponto de pedido não pode ser negativo.").optional(),
  cost: z.coerce.number().min(0, "O custo não pode ser negativo.").optional(),
});

const insumoSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório."),
  type: z.string().min(3, "Tipo é obrigatório."),
  description: z.string().optional(),
  quantityInStock: z.coerce.number().min(0, "Estoque não pode ser negativo."),
  reorderPoint: z.coerce.number().min(0, "Ponto de pedido não pode ser negativo.").optional(),
  cost: z.coerce.number().min(0, "O custo não pode ser negativo.").optional(),
});

const checkoutSchema = z.object({
    quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
    destination: z.string().min(1, "Selecione um destino."),
    technician: z.string().optional(),
    workOrder: z.string().optional(),
});

const receiveSchema = z.object({
    quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1."),
    source: z.string().optional(),
});

const moveEquipmentSchema = z.object({
    storeId: z.string().min(1, "Selecione a loja de destino."),
    manualAddress: z.string().min(3, "O endereço/setor é obrigatório."),
});


// --- DIALOGS ---

interface AddItemDialogProps {
  onItemAdded: () => void;
}

export function AddItemDialog({ onItemAdded }: AddItemDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemType, setItemType] = useState<"component" | "insumo">("component");

  const componentForm = useForm<z.infer<typeof componentSchema>>({
    resolver: zodResolver(componentSchema),
    defaultValues: { partNumber: "", name: "", description: "", quantityInStock: 0, reorderPoint: 0, cost: 0 },
  });

  const insumoForm = useForm<z.infer<typeof insumoSchema>>({
    resolver: zodResolver(insumoSchema),
    defaultValues: { name: "", type: "", description: "", quantityInStock: 0, reorderPoint: 0, cost: 0 },
  });

  const handleComponentSubmit = async (values: z.infer<typeof componentSchema>) => {
    setIsSubmitting(true);
    const result = await addWarehouseComponent(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: "Componente adicionado ao almoxarifado." });
      onItemAdded();
      setOpen(false);
      componentForm.reset();
    } else {
      toast({ variant: "destructive", title: "Erro", description: result.error });
    }
  };

  const handleInsumoSubmit = async (values: z.infer<typeof insumoSchema>) => {
    setIsSubmitting(true);
    const result = await addWarehouseInsumo(values);
    setIsSubmitting(false);

     if (result.success) {
      toast({ title: "Sucesso!", description: "Insumo adicionado ao almoxarifado." });
      onItemAdded();
      setOpen(false);
      insumoForm.reset();
    } else {
      toast({ variant: "destructive", title: "Erro", description: result.error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PackagePlus className="mr-2" />
          Adicionar Item ao Estoque
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Item ao Almoxarifado</DialogTitle>
          <DialogDescription>Selecione o tipo de item e preencha os detalhes.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
            <Button variant={itemType === 'component' ? 'default' : 'outline'} onClick={() => setItemType('component')}>Componente</Button>
            <Button variant={itemType === 'insumo' ? 'default' : 'outline'} onClick={() => setItemType('insumo')}>Insumo</Button>
        </div>

        {itemType === 'component' ? (
           <Form {...componentForm}>
            <form onSubmit={componentForm.handleSubmit(handleComponentSubmit)} className="space-y-4">
               <FormField control={componentForm.control} name="partNumber" render={({ field }) => ( <FormItem><FormLabel>Part Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
               <FormField control={componentForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Componente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
               <FormField control={componentForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
               <div className="grid grid-cols-2 gap-4">
                 <FormField control={componentForm.control} name="quantityInStock" render={({ field }) => ( <FormItem><FormLabel>Quantidade Inicial</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={componentForm.control} name="reorderPoint" render={({ field }) => ( <FormItem><FormLabel>Ponto de Pedido</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
               </div>
                <FormField
                    control={componentForm.control}
                    name="cost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Custo Unitário (R$)</FormLabel>
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
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adicionando..." : "Adicionar Componente"}</Button>
                </DialogFooter>
            </form>
           </Form>
        ) : (
            <Form {...insumoForm}>
            <form onSubmit={insumoForm.handleSubmit(handleInsumoSubmit)} className="space-y-4">
               <FormField control={insumoForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Insumo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
               <FormField control={insumoForm.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input placeholder="Óleo, Graxa, Filtro..." {...field} /></FormControl><FormMessage /></FormItem> )} />
               <FormField control={insumoForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={insumoForm.control} name="quantityInStock" render={({ field }) => ( <FormItem><FormLabel>Quantidade Inicial</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={insumoForm.control} name="reorderPoint" render={({ field }) => ( <FormItem><FormLabel>Ponto de Pedido</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
               </div>
                <FormField
                    control={insumoForm.control}
                    name="cost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Custo Unitário (R$)</FormLabel>
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
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adicionando..." : "Adicionar Insumo"}</Button>
                </DialogFooter>
            </form>
           </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}


interface EditItemDialogProps {
  item: WarehouseComponent | WarehouseInsumo;
  type: "component" | "insumo";
  onItemUpdated: () => void;
  children: React.ReactNode;
}

export function EditItemDialog({ item, type, onItemUpdated, children }: EditItemDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            name: item.name,
            description: item.description || "",
            quantityInStock: item.quantityInStock,
            reorderPoint: item.reorderPoint || 0,
            cost: item.cost || 0,
            partNumber: (item as WarehouseComponent).partNumber || "",
            type: (item as WarehouseInsumo).type || "",
        }
    });
    
    const handleSubmit = async (values: any) => {
        setIsSubmitting(true);
        let result;
        const dataToUpdate = {
            ...values,
            reorderPoint: values.reorderPoint || 0,
            cost: values.cost || 0,
        };

        if (type === 'component') {
            result = await updateWarehouseComponent(dataToUpdate.partNumber, dataToUpdate);
        } else {
            result = await updateWarehouseInsumo((item as WarehouseInsumo).id, dataToUpdate);
        }
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: "Sucesso!", description: "Item atualizado." });
            onItemUpdated();
            setOpen(false);
        } else {
            toast({ variant: "destructive", title: "Erro", description: result.error });
        }
    }


    return (
     <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            {children}
        </DialogTrigger>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>Editar Item: {item.name}</DialogTitle>
             </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                    {type === 'component' && <FormField control={form.control} name="partNumber" render={({ field }) => ( <FormItem><FormLabel>Part Number</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem> )} />}
                    {type === 'insumo' && <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />}
                    <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="quantityInStock" render={({ field }) => ( <FormItem><FormLabel>Estoque Atual</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="reorderPoint" render={({ field }) => ( <FormItem><FormLabel>Ponto de Pedido</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                    </div>
                     <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Custo Unitário (R$)</FormLabel>
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
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</Button>
                    </DialogFooter>
                </form>
             </Form>
        </DialogContent>
     </Dialog>
    );
}

interface CheckoutItemDialogProps {
  item: WarehouseComponent | WarehouseInsumo;
  type: "component" | "insumo";
  onItemUpdated: () => void;
  children: React.ReactNode;
}

export function CheckoutItemDialog({ item, type, onItemUpdated, children }: CheckoutItemDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

    useEffect(() => {
        if (open) {
            async function fetchEquipment() {
                const data = await getAllEquipment();
                setEquipmentList(data);
            }
            fetchEquipment();
        }
    }, [open]);

    const form = useForm<z.infer<typeof checkoutSchema>>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { quantity: 1, destination: "", technician: "", workOrder: "" },
    });

    const handleCheckout = async (values: z.infer<typeof checkoutSchema>) => {
        if (values.quantity > item.quantityInStock) {
            form.setError("quantity", { message: "Saída maior que o estoque."});
            return;
        }

        setIsSubmitting(true);
        const newQuantity = item.quantityInStock - values.quantity;
        let result;
        
        if (type === 'component') {
            const component = item as WarehouseComponent;
            result = await updateWarehouseComponent(component.partNumber, { quantityInStock: newQuantity });
        } else {
             const insumo = item as WarehouseInsumo;
            result = await updateWarehouseInsumo(insumo.id, { quantityInStock: newQuantity });
        }
        setIsSubmitting(false);

        if (result.success) {
            const destinationName = equipmentList.find(e => e.id === values.destination)?.name || "Uso Geral";
            let toastDescription = `${values.quantity} unidade(s) de ${item.name} removida(s) do estoque.`;
            toastDescription += ` Destino: ${destinationName}.`
            if(values.technician) toastDescription += ` Técnico: ${values.technician}.`
            if(values.workOrder) toastDescription += ` OS: ${values.workOrder}.`

            toast({ title: "Saída Registrada!", description: toastDescription });
            onItemUpdated();
            setOpen(false);
        } else {
            toast({ variant: "destructive", title: "Erro", description: result.error });
        }
    }

    return (
     <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            {children}
        </DialogTrigger>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>Registrar Saída: {item.name}</DialogTitle>
                <DialogDescription>
                    Especifique a quantidade e o destino do item que está sendo retirado do estoque.
                    Estoque atual: <span className="font-bold">{item.quantityInStock}</span>
                </DialogDescription>
             </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
                     <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantidade a ser Retirada</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Destino</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um equipamento ou uso..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="geral">Uso Geral / Outros Fins</SelectItem>
                                    {equipmentList.map((eq) => (
                                        <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="technician"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Técnico / Solicitante (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do responsável" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="workOrder"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Ordem de Serviço (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Número da OS" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Confirmar Saída"}</Button>
                    </DialogFooter>
                </form>
             </Form>
        </DialogContent>
     </Dialog>
    );
}


interface ReceiveItemDialogProps {
  item: WarehouseComponent | WarehouseInsumo;
  type: "component" | "insumo";
  onItemUpdated: () => void;
  children: React.ReactNode;
}

export function ReceiveItemDialog({ item, type, onItemUpdated, children }: ReceiveItemDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof receiveSchema>>({
        resolver: zodResolver(receiveSchema),
        defaultValues: { quantity: 1, source: "" },
    });

    const handleReceive = async (values: z.infer<typeof receiveSchema>) => {
        setIsSubmitting(true);
        const newQuantity = item.quantityInStock + values.quantity;
        let result;
        
        if (type === 'component') {
            const component = item as WarehouseComponent;
            result = await updateWarehouseComponent(component.partNumber, { quantityInStock: newQuantity });
        } else {
             const insumo = item as WarehouseInsumo;
            result = await updateWarehouseInsumo(insumo.id, { quantityInStock: newQuantity });
        }
        setIsSubmitting(false);

        if (result.success) {
            let toastDescription = `${values.quantity} unidade(s) de ${item.name} adicionada(s) ao estoque.`;
            if (values.source) toastDescription += ` Origem: ${values.source}.`

            toast({ title: "Entrada Registrada!", description: toastDescription });
            onItemUpdated();
            setOpen(false);
        } else {
            toast({ variant: "destructive", title: "Erro", description: result.error });
        }
    }

    return (
     <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            {children}
        </DialogTrigger>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>Registrar Entrada: {item.name}</DialogTitle>
                <DialogDescription>
                    Especifique a quantidade e a origem do item que está sendo adicionado ao estoque.
                    Estoque atual: <span className="font-bold">{item.quantityInStock}</span>
                </DialogDescription>
             </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleReceive)} className="space-y-4">
                     <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantidade a ser Adicionada</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Origem / Nota Fiscal (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: NF 12345, Fornecedor X" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Confirmar Entrada"}</Button>
                    </DialogFooter>
                </form>
             </Form>
        </DialogContent>
     </Dialog>
    );
}


interface MoveEquipmentDialogProps {
    equipment: Equipment;
    stores: Store[];
    onEquipmentMoved: () => void;
    children: React.ReactNode;
}

export function MoveEquipmentDialog({ equipment, stores, onEquipmentMoved, children }: MoveEquipmentDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof moveEquipmentSchema>>({
        resolver: zodResolver(moveEquipmentSchema),
        defaultValues: { storeId: '', manualAddress: '' },
    });

    const handleMove = async (values: z.infer<typeof moveEquipmentSchema>) => {
        setIsSubmitting(true);
        const result = await updateEquipment(equipment.id, {
            storeId: values.storeId,
            location: {
                manualAddress: values.manualAddress,
            },
        });
        setIsSubmitting(false);

        if (result.success) {
            const storeName = stores.find(s => s.id === values.storeId)?.name;
            toast({
                title: "Equipamento Movido!",
                description: `${equipment.name} foi movido para a loja ${storeName}.`,
            });
            onEquipmentMoved();
            form.reset();
            setOpen(false);
        } else {
            toast({ variant: "destructive", title: "Erro ao Mover", description: result.error });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mover Equipamento: {equipment.name}</DialogTitle>
                    <DialogDescription>
                        Selecione a nova loja e o endereço/setor de destino para o equipamento.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleMove)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="storeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loja de Destino</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a loja..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stores.map(store => (
                                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="manualAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Novo Endereço / Setor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Padaria, Frente de Caixa 3" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Movendo..." : "Confirmar Movimentação"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

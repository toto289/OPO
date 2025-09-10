
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import type { Store } from "@/lib/types";


interface AddStoreProps {
    onAdd: (name: string) => Promise<void>;
}

export function AddStore({ onAdd }: AddStoreProps) {
    const { toast } = useToast();
    const [newStoreName, setNewStoreName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddStore = async () => {
        if (newStoreName.trim()) {
            setIsAdding(true);
            await onAdd(newStoreName.trim());
            setIsAdding(false);
            toast({ title: "Sucesso!", description: "Nova unidade adicionada." });
            setNewStoreName("");
        } else {
            toast({ variant: "destructive", title: "Erro", description: "O nome da unidade não pode estar vazio." });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Adicionar Nova Unidade</CardTitle>
                <CardDescription>
                    Insira o nome da nova unidade (loja) para adicioná-la ao sistema.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
                <Input
                    placeholder="Nome da nova unidade"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    disabled={isAdding}
                />
                <Button onClick={handleAddStore} disabled={isAdding}>
                    {isAdding ? "Adicionando..." : <><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</>}
                </Button>
            </CardContent>
        </Card>
    );
}


interface EditStoreProps {
    store: Store;
    onUpdate: (id: string, name: string) => Promise<void>;
}

export function EditStore({ store, onUpdate }: EditStoreProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [storeName, setStoreName] = useState(store.name);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStore = async () => {
        if (storeName.trim()) {
            setIsUpdating(true);
            await onUpdate(store.id, storeName.trim());
            setIsUpdating(false);
            toast({ title: "Sucesso!", description: "Unidade atualizada." });
            setOpen(false);
        } else {
            toast({ variant: "destructive", title: "Erro", description: "O nome da unidade não pode estar vazio." });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Unidade</DialogTitle>
                    <DialogDescription>
                        Atualize o nome da unidade. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="col-span-3"
                            disabled={isUpdating}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isUpdating}>Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleUpdateStore} disabled={isUpdating}>
                        {isUpdating ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteStoreProps {
    store: Store;
    onDelete: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export function DeleteStore({ store, onDelete }: DeleteStoreProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteStore = async () => {
        setIsDeleting(true);
        const result = await onDelete(store.id);
        setIsDeleting(false);
        if (result.success) {
            toast({ title: "Sucesso!", description: "Unidade excluída." });
        } else {
            toast({ variant: "destructive", title: "Erro ao excluir", description: result.message });
        }
        setOpen(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a unidade
                        <span className="font-bold"> {store?.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStore} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? "Excluindo..." : "Continuar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

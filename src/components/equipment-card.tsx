

"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import type { Equipment, Store } from '@/lib/types';
import { MapPin, Wrench, Store as StoreIcon, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { deleteEquipment } from '@/lib/actions';
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';

interface EquipmentCardProps {
  equipment: Equipment;
  store?: Store;
}

export default function EquipmentCard({ equipment, store }: EquipmentCardProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteEquipment(equipment.id);
    toast({
      title: "Equipamento Excluído",
      description: `O equipamento "${equipment.name}" foi removido.`,
    });
    router.refresh();
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col group">
        <Link href={`/dashboard/equipment/${equipment.id}`} className="flex flex-col h-full flex-grow">
            <CardHeader className="p-0">
            <div className="relative h-40 w-full bg-muted flex items-center justify-center">
                 <Avatar className="h-full w-full rounded-none">
                    {equipment.imageUrl && (
                        <AvatarImage 
                            src={equipment.imageUrl} 
                            alt={equipment.name} 
                            className="object-cover" 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    )}
                    <AvatarFallback className="rounded-none text-2xl bg-muted text-muted-foreground">
                        {getInitials(equipment.name)}
                    </AvatarFallback>
                </Avatar>
            </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 flex-grow">
            <h3 className="font-headline text-lg font-semibold leading-tight group-hover:text-primary transition-colors">{equipment.name}</h3>
            <div className="space-y-2">
                {store && (
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <StoreIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{store.name}</span>
                </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Wrench className="h-4 w-4 shrink-0" />
                <span>{(equipment.maintenanceHistory || []).length} manutenções</span>
                </div>
                {equipment.location?.manualAddress && (
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{equipment.location.manualAddress}</span>
                </div>
                )}
            </div>
            </CardContent>
        </Link>
        <Separator />
        <CardFooter className="p-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive-outline"
                        size="sm"
                        className="w-full justify-start text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Excluir
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o equipamento "{equipment.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
  );
}

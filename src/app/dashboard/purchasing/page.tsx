
"use client";

import { useState, useEffect } from "react";
import { getWarehouseComponents, getWarehouseInsumos } from "@/lib/api";
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
import { Button } from "@/components/ui/button";
import { Package, Droplets, Warehouse, Truck, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WarehouseComponent, WarehouseInsumo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";


function PurchasingPageSkeleton() {
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

export default function PurchasingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [pendingComponents, setPendingComponents] = useState<WarehouseComponent[]>([]);
  const [pendingInsumos, setPendingInsumos] = useState<WarehouseInsumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        // In a real app, this data would come from a dedicated "purchaseOrders" collection/table.
        // For this demo, we'll simulate it by fetching items that are below their reorder point,
        // which is the same logic as the MRP page. This simulates that they have been "requested".
        const [
            allComponents, 
            allInsumos
        ] = await Promise.all([
            getWarehouseComponents(),
            getWarehouseInsumos()
        ]);
        
        setPendingComponents(allComponents.filter(c => c.quantityInStock <= (c.reorderPoint || 0)));
        setPendingInsumos(allInsumos.filter(i => i.quantityInStock <= (i.reorderPoint || 0)));
        
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleReceiveComponent = (partNumber: string) => {
    const item = pendingComponents.find(c => c.partNumber === partNumber);
     if(item) {
        toast({
            title: "Ação Necessária",
            description: `Para receber '${item.name}', vá para a página de Estoque e use a ação 'Dar Entrada'.`,
            action: (
                <Button asChild size="sm">
                    <Link href="/dashboard/warehouse">Ir para Estoque</Link>
                </Button>
            )
        });
        setPendingComponents(prev => prev.filter(c => c.partNumber !== partNumber));
    }
  };
  
  const handleReceiveInsumo = (insumoId: string) => {
      const item = pendingInsumos.find(i => i.id === insumoId);
      if(item) {
          toast({
                title: "Ação Necessária",
                description: `Para receber '${item.name}', vá para a página de Estoque e use a ação 'Dar Entrada'.`,
                action: (
                    <Button asChild size="sm">
                        <Link href="/dashboard/warehouse">Ir para Estoque</Link>
                    </Button>
                )
            });
            setPendingInsumos(prev => prev.filter(i => i.id !== insumoId));
      }
  };


  if (isLoading) {
    return <PurchasingPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Ordens de Compra</h1>
        <p className="text-muted-foreground">
          Acompanhe os itens solicitados via MRP que estão aguardando chegada e recebimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package />
            Componentes Aguardando Chegada ({pendingComponents.length})
          </CardTitle>
          <CardDescription>
            Componentes solicitados que estão em processo de compra ou em trânsito.
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
                    <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingComponents.length > 0 ? (
                        pendingComponents.map(item => (
                             <TableRow key={item.partNumber} className="bg-amber-500/5 hover:bg-amber-500/10">
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="font-mono text-muted-foreground">{item.partNumber}</TableCell>
                                <TableCell className="text-center font-semibold text-destructive">{item.quantityInStock}</TableCell>
                                <TableCell className="text-center">{item.reorderPoint}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="secondary" onClick={() => handleReceiveComponent(item.partNumber)}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Receber Item
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                Nenhuma ordem de compra pendente para componentes.
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
            Insumos Aguardando Chegada ({pendingInsumos.length})
          </CardTitle>
          <CardDescription>
            Insumos solicitados que estão em processo de compra ou em trânsito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Estoque Atual</TableHead>
                    <TableHead className="text-center">Ponto de Pedido</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingInsumos.length > 0 ? (
                        pendingInsumos.map(item => (
                             <TableRow key={item.id} className="bg-amber-500/5 hover:bg-amber-500/10">
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell className="text-center font-semibold text-destructive">{item.quantityInStock}</TableCell>
                                <TableCell className="text-center">{item.reorderPoint}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="secondary" onClick={() => handleReceiveInsumo(item.id)}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Receber Item
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                Nenhuma ordem de compra pendente para insumos.
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


"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getWarehouseComponents, getWarehouseInsumos, getAllEquipment, getStores } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Droplets, ListOrdered, Edit, PlusCircle, MinusCircle, ArrowRight, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WarehouseComponent, WarehouseInsumo, Equipment, Store } from "@/lib/types";
import { AddItemDialog, EditItemDialog, CheckoutItemDialog, ReceiveItemDialog, MoveEquipmentDialog } from "./_components/warehouse-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function WarehousePage() {
  const [components, setComponents] = useState<WarehouseComponent[]>([]);
  const [insumos, setInsumos] = useState<WarehouseInsumo[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [fetchedComponents, fetchedInsumos, fetchedEquipment, fetchedStores] = await Promise.all([
      getWarehouseComponents(),
      getWarehouseInsumos(),
      getAllEquipment(),
      getStores(),
    ]);
    setComponents(fetchedComponents);
    setInsumos(fetchedInsumos);
    setStores(fetchedStores);
    setEquipment(fetchedEquipment.filter(e => 
        e.location?.manualAddress?.toLowerCase().includes('estoque') || e.location?.manualAddress?.toLowerCase().includes('almoxarifado')
    ));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const getStockBadgeVariant = (quantity: number, reorderPoint?: number): "destructive" | "secondary" | "default" => {
    const safeReorderPoint = reorderPoint || 0;
    if (quantity <= safeReorderPoint / 2 || quantity === 0) {
      return "destructive";
    }
    if (reorderPoint && quantity <= reorderPoint) {
      return "secondary";
    }
    return "default";
  }

  const filteredComponents = showLowStockOnly
    ? components.filter(c => c.quantityInStock <= (c.reorderPoint || 0))
    : components;

  const filteredInsumos = showLowStockOnly
    ? insumos.filter(i => i.quantityInStock <= (i.reorderPoint || 0))
    : insumos;

  if (isLoading) {
    return <WarehouseSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Adicione, edite e gerencie o estoque de componentes, insumos e equipamentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/dashboard/mrp"><ListOrdered className="mr-2 h-4 w-4" /> Relatório MRP</Link>
            </Button>
            <AddItemDialog onItemAdded={fetchData} />
        </div>
      </div>
      
      <Tabs defaultValue="components" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="components">
                <Package className="mr-2 h-4 w-4" />
                Componentes ({filteredComponents.length})
              </TabsTrigger>
              <TabsTrigger value="insumos">
                <Droplets className="mr-2 h-4 w-4" />
                Insumos ({filteredInsumos.length})
              </TabsTrigger>
               <TabsTrigger value="equipment">
                <Package className="mr-2 h-4 w-4" />
                Equipamentos em Estoque ({equipment.length})
              </TabsTrigger>
            </TabsList>
             <div className="flex items-center space-x-2">
                <Switch 
                    id="low-stock-filter" 
                    checked={showLowStockOnly}
                    onCheckedChange={setShowLowStockOnly}
                />
                <Label htmlFor="low-stock-filter">Apenas estoque baixo</Label>
            </div>
        </div>
        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Estoque de Componentes</CardTitle>
              <CardDescription>
                Lista de todas as peças e componentes disponíveis no estoque central.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead className="text-center">Ponto de Pedido</TableHead>
                        <TableHead className="text-right w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComponents.length > 0 ? (
                        filteredComponents.map((component) => {
                          const isLowStock = component.reorderPoint !== undefined && component.quantityInStock <= component.reorderPoint;
                          return (
                          <TableRow key={component.partNumber} className={cn(isLowStock && component.quantityInStock > 0 && "bg-yellow-500/10", component.quantityInStock === 0 && "bg-destructive/10")}>
                            <TableCell className="font-mono text-muted-foreground">{component.partNumber}</TableCell>
                            <TableCell className="font-medium">{component.name}</TableCell>
                             <TableCell className="font-mono">{component.cost ? component.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={getStockBadgeVariant(component.quantityInStock, component.reorderPoint)}>
                                {component.quantityInStock}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn("text-center font-medium", isLowStock && "text-yellow-600 font-bold")}>
                                  {component.reorderPoint ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <ReceiveItemDialog item={component} type="component" onItemUpdated={fetchData}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5 text-green-600"/></Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Registrar Entrada</p></TooltipContent>
                                    </Tooltip>
                                  </ReceiveItemDialog>
                                  <CheckoutItemDialog item={component} type="component" onItemUpdated={fetchData}>
                                     <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon"><MinusCircle className="h-5 w-5 text-destructive"/></Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Registrar Saída</p></TooltipContent>
                                    </Tooltip>
                                  </CheckoutItemDialog>
                                  <EditItemDialog item={component} type="component" onItemUpdated={fetchData}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Editar Item</p></TooltipContent>
                                      </Tooltip>
                                  </EditItemDialog>
                                </div>
                            </TableCell>
                          </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            {showLowStockOnly ? "Nenhum componente com estoque baixo." : "Nenhum componente em estoque."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="insumos">
          <Card>
            <CardHeader>
              <CardTitle>Estoque de Insumos</CardTitle>
              <CardDescription>
                Lista de todos os consumíveis disponíveis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead className="text-center">Ponto de Pedido</TableHead>
                        <TableHead className="text-right w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInsumos.length > 0 ? (
                        filteredInsumos.map((insumo) => {
                          const isLowStock = insumo.reorderPoint !== undefined && insumo.quantityInStock <= insumo.reorderPoint;
                          return (
                          <TableRow key={insumo.id} className={cn(isLowStock && insumo.quantityInStock > 0 && "bg-yellow-500/10", insumo.quantityInStock === 0 && "bg-destructive/10")}>
                            <TableCell className="font-medium">{insumo.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{insumo.type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">{insumo.cost ? insumo.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={getStockBadgeVariant(insumo.quantityInStock, insumo.reorderPoint)}>
                                      {insumo.quantityInStock}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn("text-center font-medium", isLowStock && "text-yellow-600 font-bold")}>
                              {insumo.reorderPoint ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <ReceiveItemDialog item={insumo} type="insumo" onItemUpdated={fetchData}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5 text-green-600"/></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Registrar Entrada</p></TooltipContent>
                                      </Tooltip>
                                    </ReceiveItemDialog>
                                    <CheckoutItemDialog item={insumo} type="insumo" onItemUpdated={fetchData}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon"><MinusCircle className="h-5 w-5 text-destructive"/></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Registrar Saída</p></TooltipContent>
                                      </Tooltip>
                                    </CheckoutItemDialog>
                                    <EditItemDialog item={insumo} type="insumo" onItemUpdated={fetchData}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Editar Item</p></TooltipContent>
                                        </Tooltip>
                                    </EditItemDialog>
                                  </div>
                            </TableCell>
                          </TableRow>
                          )
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            {showLowStockOnly ? "Nenhum insumo com estoque baixo." : "Nenhum insumo em estoque."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos em Estoque</CardTitle>
              <CardDescription>
                Lista de todos os equipamentos guardados no estoque central para futura alocação.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Nº Patrimônio</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Localização Atual</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.length > 0 ? (
                        equipment.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
                            <TableCell>{item.model}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.location?.manualAddress}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <MoveEquipmentDialog equipment={item} stores={stores} onEquipmentMoved={fetchData}>
                                      <Button variant="outline" size="sm">
                                          <Truck className="mr-2 h-4 w-4"/>
                                          Mover
                                      </Button>
                                  </MoveEquipmentDialog>
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/equipment/${item.id}`}>
                                      Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                           Nenhum equipamento encontrado no estoque.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WarehouseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-12 w-96" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(6)].map((_, i) => (
                    <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
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


import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllEquipment, getWarehouseInsumos } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Insumo, Equipment, WarehouseInsumo } from "@/lib/types";
import { Droplets, ArrowRight, Warehouse, History, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface InsumoUsageInfo {
    name: string;
    type: string;
    description?: string;
    quantityInStock: number;
    usageHistory: {
        equipmentId: string;
        equipmentName: string;
        count: number;
    }[];
    totalUsage: number;
}


export default async function InsumosPage() {
  const [allEquipment, warehouseInsumos] = await Promise.all([
      getAllEquipment(),
      getWarehouseInsumos()
  ]);

  // Group insumos by name and track usage history and stock
  const insumoData = allEquipment.reduce((acc, equipment: Equipment) => {
    
    // Initialize insumos listed in equipment specs
    (equipment.insumos || []).forEach(insumo => {
        if (!acc[insumo.name]) {
            acc[insumo.name] = {
                name: insumo.name,
                type: insumo.type,
                description: insumo.description,
                quantityInStock: 0, // Will be filled later
                usageHistory: [],
                totalUsage: 0,
            };
        }
    });

    // Track usage from maintenance history
    (equipment.maintenanceHistory || []).forEach(log => {
        const match = log.userRequest.match(/Substituição do insumo: (.+)/);
        if (match) {
            const insumoName = match[1].trim();
            if (acc[insumoName]) {
                acc[insumoName].totalUsage += 1;
                const historyEntry = acc[insumoName].usageHistory.find(h => h.equipmentId === equipment.id);
                if (historyEntry) {
                    historyEntry.count += 1;
                } else {
                    acc[insumoName].usageHistory.push({
                        equipmentId: equipment.id,
                        equipmentName: equipment.name,
                        count: 1,
                    });
                }
            }
        }
    });
    return acc;
  }, {} as Record<string, InsumoUsageInfo>);

  // Add stock info and include items that are in warehouse but not in any equipment spec
   warehouseInsumos.forEach(stockItem => {
    if (insumoData[stockItem.name]) {
      insumoData[stockItem.name].quantityInStock = stockItem.quantityInStock;
    } else {
      insumoData[stockItem.name] = {
        name: stockItem.name,
        type: stockItem.type,
        description: stockItem.description,
        quantityInStock: stockItem.quantityInStock,
        usageHistory: [],
        totalUsage: 0,
      };
    }
  });
  
  const insumosArray = Object.values(insumoData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Análise de Consumo de Insumos</h1>
        <p className="text-muted-foreground">
          Visualize o histórico de consumo e o estoque disponível de cada insumo de manutenção.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Insumos</CardTitle>
          <CardDescription>
            Agrupados por nome para analisar a frequência de troca, o estoque e os equipamentos associados.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Accordion type="single" collapsible className="w-full">
            {insumosArray.length > 0 ? (
              insumosArray.map((insumo) => (
                <AccordionItem value={insumo.name} key={insumo.name}>
                   <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full">
                         <Droplets className="h-5 w-5 text-muted-foreground" />
                         <div className="flex-1 text-left">
                            <p className="font-semibold">{insumo.name}</p>
                            <p className="text-sm text-muted-foreground">{insumo.description || insumo.type}</p>
                         </div>
                         <div className="flex items-center gap-4 mr-4">
                            <Badge variant="outline" className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                {insumo.totalUsage} trocas
                            </Badge>
                             <Badge variant={insumo.quantityInStock > 5 ? "default" : insumo.quantityInStock > 0 ? "secondary" : "destructive"}>
                                {insumo.quantityInStock} em estoque
                            </Badge>
                         </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <div className="pl-6 border-l-2 ml-2">
                        <h4 className="font-semibold mb-2">Histórico de Utilização:</h4>
                        {insumo.usageHistory.length > 0 ? (
                             <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Equipamento</TableHead>
                                            <TableHead className="text-center">Trocas Realizadas</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {insumo.usageHistory.map(instance => (
                                            <TableRow key={`${insumo.name}-${instance.equipmentId}`}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground"/>
                                                    {instance.equipmentName}
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-semibold">{instance.count}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/dashboard/equipment/${instance.equipmentId}`}>
                                                            Ver Equipamento <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-4 border-dashed border-2 rounded-md">
                                <p>Nenhum registro de troca encontrado para este insumo.</p>
                            </div>
                        )}
                        <Button asChild variant="secondary" size="sm" className="mt-4">
                            <Link href="/dashboard/warehouse">
                                Gerenciar Estoque <Warehouse className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
                <div className="h-24 text-center flex items-center justify-center">
                    <p>Nenhum insumo encontrado.</p>
                </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

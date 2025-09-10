
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
import { getAllEquipment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Component, Equipment } from "@/lib/types";
import { Puzzle, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";


interface ComponentWithEquipmentInfo extends Component {
  equipmentId: string;
  equipmentName: string;
}

interface GroupedComponent {
    partNumber: string;
    name: string;
    description: string;
    instances: ComponentWithEquipmentInfo[];
}

export default async function ComponentsPage() {
  const allEquipment = await getAllEquipment();

  // Create a flat list of all components, adding equipment info to each
  const allComponents: ComponentWithEquipmentInfo[] = allEquipment.flatMap((equipment: Equipment) =>
    (equipment.components || []).map((component: Component) => ({
      ...component,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
    }))
  );

  // Group components by partNumber
  const groupedComponents = allComponents.reduce((acc, component) => {
    const key = component.partNumber;
    if (!acc[key]) {
      acc[key] = {
        partNumber: component.partNumber,
        name: component.name,
        description: component.description || "Sem descrição",
        instances: [],
      };
    }
    acc[key].instances.push(component);
    return acc;
  }, {} as Record<string, GroupedComponent>);

  const componentsArray = Object.values(groupedComponents);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Catálogo de Componentes</h1>
        <p className="text-muted-foreground">
          Visualize todos os tipos de componentes e em quais equipamentos eles estão instalados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Componentes por Part Number</CardTitle>
          <CardDescription>
            Agrupados por número de peça (Part Number) para ver onde cada tipo de componente é usado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {componentsArray.length > 0 ? (
              componentsArray.map((group) => (
                <AccordionItem value={group.partNumber} key={group.partNumber}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full">
                         <Puzzle className="h-5 w-5 text-muted-foreground" />
                         <div className="flex-1 text-left">
                            <p className="font-semibold">{group.name}</p>
                            <p className="text-sm text-muted-foreground font-mono">{group.partNumber}</p>
                         </div>
                         <Badge variant="outline">Instalado em {group.instances.length} equip.</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-6 border-l-2 ml-2">
                        <h4 className="font-semibold mb-2">Instâncias Instaladas:</h4>
                        <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Equipamento</TableHead>
                                    <TableHead>ID do Patrimônio</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.instances.map(instance => (
                                    <TableRow key={`${instance.equipmentId}-${instance.id}`}>
                                        <TableCell className="font-medium">{instance.equipmentName}</TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{instance.equipmentId}</TableCell>
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
                <div className="h-24 text-center flex items-center justify-center">
                    <p>Nenhum componente encontrado.</p>
                </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

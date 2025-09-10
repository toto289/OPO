

import Link from "next/link";
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { PackagePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAllEquipment, getStores } from "@/lib/api";
import { EquipmentList, EquipmentListSkeleton } from "./_components/equipment-list";

async function EquipmentListLoader({ searchTerm, storeFilter }: { searchTerm: string, storeFilter: string }) {
    const [allEquipment, stores] = await Promise.all([
        getAllEquipment(),
        getStores(),
    ]);
    
    const filteredEquipment = allEquipment
        .filter((item) => storeFilter === 'all' || item.storeId === storeFilter)
        .filter(
            (item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return <EquipmentList equipment={filteredEquipment} stores={stores} />;
}


export default async function EquipmentListPage({ searchParams }: { searchParams: { search?: string, store?: string } }) {
    const searchTerm = searchParams.search || "";
    const storeFilter = searchParams.store || "all";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Gerenciamento de Ativos</h1>
                    <p className="text-muted-foreground">
                        Visualize, filtre e gerencie todos os equipamentos cadastrados.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/dashboard/equipment/new">
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Registrar Novo Equipamento
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle>Inventário de Equipamentos</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<EquipmentListSkeleton />}>
                        <EquipmentListLoader searchTerm={searchTerm} storeFilter={storeFilter} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}

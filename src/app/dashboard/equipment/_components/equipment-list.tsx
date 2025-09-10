
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import EquipmentCard from "@/components/equipment-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Equipment, Store } from "@/lib/types";
import { useDebouncedCallback } from "use-debounce";


interface EquipmentListProps {
    equipment: Equipment[];
    stores: Store[];
}

export function EquipmentList({ equipment, stores }: EquipmentListProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const searchTerm = searchParams.get('search') || "";
    const storeFilter = searchParams.get('store') || "all";
    
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFilterByStore = (storeId: string) => {
        const params = new URLSearchParams(searchParams);
        if (storeId && storeId !== "all") {
            params.set('store', storeId);
        } else {
            params.delete('store');
        }
        replace(`${pathname}?${params.toString()}`);
    };


    return (
        <div>
            <div className="flex flex-col md:flex-row items-center justify-end gap-4 mb-4">
                <Select value={storeFilter} onValueChange={handleFilterByStore}>
                    <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="Filtrar por loja" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Lojas</SelectItem>
                        {stores.map(store => (
                            <SelectItem key={store.id} value={store.id}>{`${store.id}: ${store.name}`}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative flex-grow w-full md:w-auto md:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome ou ID..."
                        className="pl-9 w-full"
                        defaultValue={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {equipment.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {equipment.map((item) => {
                        const store = stores.find(s => s.id === item.storeId);
                        return <EquipmentCard key={item.id} equipment={item} store={store} />
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">Nenhum equipamento encontrado.</p>
                    <p className="text-sm text-muted-foreground">Tente ajustar seus filtros de busca ou cadastre um novo item.</p>
                </div>
            )}
        </div>
    );
}

export function EquipmentListSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
            ))}
        </div>
    )
}

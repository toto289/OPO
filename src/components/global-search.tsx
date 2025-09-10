"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { Search, Package, Users, Puzzle, Droplets } from "lucide-react";
import { getAllEquipment, getWarehouseComponents, getWarehouseInsumos, getUsers } from "@/lib/api";
import type { Equipment, User, WarehouseComponent, WarehouseInsumo } from "@/lib/types";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [searchData, setSearchData] = React.useState<{
    equipment: Equipment[],
    users: User[],
    components: WarehouseComponent[],
    insumos: WarehouseInsumo[],
  } | null>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      const [equipment, users, components, insumos] = await Promise.all([
        getAllEquipment(),
        getUsers(),
        getWarehouseComponents(),
        getWarehouseInsumos(),
      ]);
      setSearchData({ equipment, users, components, insumos });
      setLoading(false);
    }
    fetchData();
  }, [open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite para buscar equipamentos, usuários, componentes..." />
        <CommandList>
          {loading && <CommandEmpty>Carregando dados...</CommandEmpty>}
          {!loading && searchData && (
            <>
              {searchData.equipment.length === 0 && searchData.users.length === 0 && searchData.components.length === 0 && searchData.insumos.length === 0 && (
                 <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              )}
              {searchData.equipment.length > 0 && (
                <CommandGroup heading="Equipamentos">
                  {searchData.equipment.map((item) => (
                    <CommandItem
                      key={`eq-${item.id}`}
                      value={`Equipamento ${item.name} ${item.id}`}
                      onSelect={() => runCommand(() => router.push(`/dashboard/equipment/${item.id}`))}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchData.users.length > 0 && (
                <CommandGroup heading="Usuários">
                  {searchData.users.map((user) => (
                    <CommandItem
                      key={`user-${user.id}`}
                      value={`Usuário ${user.name} ${user.email}`}
                      onSelect={() => runCommand(() => router.push(`/dashboard/users`))}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>{user.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchData.components.length > 0 && (
                <CommandGroup heading="Componentes em Estoque">
                  {searchData.components.map((item) => (
                    <CommandItem
                      key={`comp-${item.partNumber}`}
                      value={`Componente ${item.name} ${item.partNumber}`}
                      onSelect={() => runCommand(() => router.push(`/dashboard/warehouse`))}
                    >
                      <Puzzle className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchData.insumos.length > 0 && (
                <CommandGroup heading="Insumos em Estoque">
                  {searchData.insumos.map((item) => (
                    <CommandItem
                      key={`insumo-${item.id}`}
                      value={`Insumo ${item.name}`}
                      onSelect={() => runCommand(() => router.push(`/dashboard/warehouse`))}
                    >
                      <Droplets className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

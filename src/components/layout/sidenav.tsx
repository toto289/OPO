
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building, Package, ScanLine, User, Users, ClipboardList, Warehouse, CalendarCheck, ChevronRight, ListOrdered, ShoppingCart, Puzzle, Droplets, Wrench, LayoutDashboard, Archive, Settings, Briefcase, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { AtivoOSLogoIcon } from "../icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

const navConfig = [
  {
    title: "Dashboards",
    label: "Dashboards",
    icon: LayoutDashboard,
    subItems: [
        { href: "/dashboard", label: "Visão Geral", icon: Home },
        { href: "/dashboard/maintenance-dashboard", label: "Manutenção", icon: Wrench },
        { href: "/dashboard/stock-dashboard", label: "Estoque", icon: Archive },
        { href: "/dashboard/admin-dashboard", label: "Administrativo", icon: Building },
        { href: "/dashboard/audit", label: "Auditoria e Riscos", icon: ShieldAlert },
    ]
  },
  {
    title: "Ativos",
    label: "Ativos",
    icon: Briefcase,
    subItems: [
        { href: "/dashboard/equipment", label: "Equipamentos", icon: Package },
        { 
            title: "Peças e Insumos",
            label: "Peças e Insumos", 
            icon: Archive,
            subItems: [
                { href: "/dashboard/warehouse", label: "Gestão de Estoque", icon: Warehouse },
                { href: "/dashboard/mrp", label: "Necessidade (MRP)", icon: ListOrdered },
                { href: "/dashboard/purchasing", label: "Ordens de Compra", icon: ShoppingCart },
                { href: "/dashboard/components", label: "Catálogo de Peças", icon: Puzzle },
                { href: "/dashboard/insumos", label: "Consumo de Insumos", icon: Droplets },
            ]
        },
    ]
  },
  {
    title: "Planos e Ordens",
    label: "Planos e Ordens",
    icon: Wrench,
    subItems: [
        { href: "/dashboard/corrective", label: "Ordens Corretivas", icon: Wrench },
        { href: "/dashboard/preventive", label: "Planos Preventivos", icon: CalendarCheck },
    ]
  },
  {
    title: "Configurações",
    label: "Configurações",
    icon: Settings,
    subItems: [
      { href: "/dashboard/stores", label: "Unidades (Lojas)", icon: Building },
      { href: "/dashboard/users", label: "Usuários", icon: Users },
      { href: "/dashboard/roles", label: "Papéis e Permissões", icon: ClipboardList },
    ]
  },
];

const secondaryNavItems = [
    { href: "/dashboard/scan", label: "Escanear QR Code", icon: ScanLine, isAction: true },
]


export default function SideNav() {
  const pathname = usePathname();
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);
  
  const isSubItemActive = (subItems: any[]): boolean => {
    return subItems.some(item => {
        if (item.href && pathname.startsWith(item.href)) return true;
        if (item.subItems) return isSubItemActive(item.subItems);
        return false;
    });
  }

  useEffect(() => {
    const activeParents = navConfig
        .filter(item => item.subItems && isSubItemActive(item.subItems))
        .map(item => item.title);
    
    if (activeParents.length > 0) {
      setOpenCollapsibles(prev => [...new Set([...prev, ...activeParents])]);
    }
  }, [pathname]);

  const handleOpenChange = (title: string, isOpen: boolean) => {
    setOpenCollapsibles(prev => 
        isOpen ? [...prev, title] : prev.filter(item => item !== title)
    );
  };


  const renderNavLink = (item: any, isSubItem = false) => {
    const isActive = (item.href === '/dashboard' && pathname === item.href) || 
                     (item.href !== '/dashboard' && pathname.startsWith(item.href));

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isSubItem && "text-sm",
          isActive && "bg-muted text-primary hover:text-primary",
          item.isAction && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground mt-4 mb-2"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  const renderCollapsibleLink = (item: any, level = 0) => {
    const isParentActive = item.subItems && isSubItemActive(item.subItems);
    const isOpen = openCollapsibles.includes(item.title);

    return (
        <Collapsible key={item.title} open={isOpen} onOpenChange={(open) => handleOpenChange(item.title, open)}>
            <CollapsibleTrigger asChild>
                <div className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary cursor-pointer",
                    level > 0 && "text-sm",
                    isParentActive && "bg-muted text-primary hover:text-primary"
                    )}
                >
                    <div className="flex items-center gap-3">
                         <item.icon className="h-4 w-4" />
                         {item.label}
                    </div>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("space-y-1 py-1", level > 0 ? "pl-9" : "pl-6")}>
                {item.subItems.map((subItem: any) => (
                    subItem.subItems ? renderCollapsibleLink(subItem, level + 1) : renderNavLink(subItem, true)
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
            <AtivoOSLogoIcon className="h-8 w-8 text-primary" />
            <span className="">AtivoOS</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
             {navConfig.map((item) => (
                <div key={item.title}>
                     {item.subItems ? renderCollapsibleLink(item) : renderNavLink(item)}
                </div>
             ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
             <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                {secondaryNavItems.map((item) => renderNavLink(item, false))}
             </nav>
        </div>
      </div>
    </div>
  );
}

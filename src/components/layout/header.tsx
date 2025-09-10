
"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Menu, Home, Package, Building, ScanLine, Users, PackagePlus, ClipboardList, Warehouse, CalendarCheck, Puzzle, Droplets, ListOrdered, ShoppingCart, Wrench, LayoutDashboard, Archive, ChevronRight, Settings, Briefcase, ShieldAlert } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { AtivoOSLogoIcon } from "../icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import type { User as UserType } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible";
import { GlobalSearch } from "../global-search";


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


interface HeaderProps {
    user: UserType | null;
}

export default function Header({ user }: HeaderProps) {
    const pathname = usePathname();

  const renderNavLink = (item: any) => {
     const isActive = (item.href === '/dashboard' && pathname === item.href) || 
                       (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
         <Link
            key={item.href}
            href={item.href!}
            className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground", 
            isActive && "bg-muted text-primary"
            )}
        >
            <item.icon className="h-5 w-5" />
            {item.label}
        </Link>
    )
  }

  const renderCollapsible = (item: any) => {
    const isParentActive = item.subItems.some((sub:any) => {
        if(sub.href && pathname.startsWith(sub.href)) return true;
        if(sub.subItems) return sub.subItems.some((s:any) => pathname.startsWith(s.href))
        return false;
    });

    return(
       <Collapsible key={item.title} className="mx-[-0.65rem] rounded-xl" defaultOpen={isParentActive}>
           <CollapsibleTrigger className="flex w-full items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground [&[data-state=open]>div>svg.chevron]:rotate-90">
               <item.icon className="h-5 w-5" />
               {item.label}
               <div className="ml-auto"><ChevronRight className="h-4 w-4 chevron transition-transform"/></div>
           </CollapsibleTrigger>
           <CollapsibleContent className="pl-10 space-y-1">
               {item.subItems.map((subItem: any) => {
                    return subItem.subItems ? renderCollapsible(subItem) : renderNavLink(subItem)
               })}
           </CollapsibleContent>
       </Collapsible>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
            <SheetTrigger asChild>
                <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
                >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                        >
                        <AtivoOSLogoIcon className="h-8 w-8 text-primary" />
                        <SheetTitle className="sr-only">AtivoOS</SheetTitle>
                        <span>AtivoOS</span>
                    </Link>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium">
                 {navConfig.map((item) => (
                   <div key={item.title}>
                     {item.subItems ? renderCollapsible(item) : renderNavLink(item)}
                   </div>
                 ))}
                </nav>
            </SheetContent>
        </Sheet>

      <div className="w-full flex-1">
        <GlobalSearch />
      </div>
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            {user ? (
                 <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
            ) : (
                <Skeleton className="h-8 w-8 rounded-full" />
            )}
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user ? user.name : "Carregando..."}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

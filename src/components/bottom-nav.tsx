
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ScanLine, Warehouse, Users, Wrench, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/dashboard/equipment", label: "Ativos", icon: Briefcase },
  { href: "/dashboard/corrective", label: "Ordens", icon: Wrench },
  { href: "/dashboard/warehouse", label: "Estoque", icon: Warehouse },
  { href: "/dashboard/scan", label: "Escanear", icon: ScanLine },
  { href: "/dashboard/profile", label: "Perfil", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-6 items-center px-2">
        {navItems.map((item) => {
          const isActive = (item.href === '/dashboard' && pathname === item.href) || 
                           (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary",
                isActive && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

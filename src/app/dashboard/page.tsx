
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Wrench, Archive, LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardClientContent } from "./_components/dashboard-client-content";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard Geral</h1>
          <p className="text-muted-foreground">
            Visão geral e consolidada dos seus ativos e manutenções.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard/maintenance-dashboard"><Wrench className="mr-2 h-4 w-4"/> Dash Manutenção</Link>
            </Button>
             <Button variant="outline" asChild>
                <Link href="/dashboard/stock-dashboard"><Archive className="mr-2 h-4 w-4"/> Dash Estoque</Link>
            </Button>
        </div>
      </div>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <DashboardClientContent />
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
             <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-3 w-1/3 mt-1" />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
             <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <div className="text-xs text-muted-foreground">
                     <Skeleton className="h-3 w-1/3 mt-1" />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            <CardDescription asChild>
                <div>
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-52 w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top 5 Equipamentos com Mais Manutenções</CardTitle>
              <CardDescription>Equipamentos que mais necessitaram de reparos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
      </div>
    </>
  )
}

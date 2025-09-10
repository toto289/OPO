
"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  value: {
    label: "Valor",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface MaintenanceChartProps {
    data: { name: string; [key: string]: any }[];
    dataKey: string;
    formatAsCurrency?: boolean;
}

export function MaintenanceChart({ data, dataKey, formatAsCurrency = false }: MaintenanceChartProps) {
  
  const tooltipFormatter = (value: number) => {
    if (formatAsCurrency) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return value.toString();
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis tickFormatter={(value) => formatAsCurrency ? `R$${value/1000}k` : value} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" formatter={tooltipFormatter} />}
        />
        <Bar dataKey={dataKey} fill="var(--color-value)" radius={4} name={formatAsCurrency ? 'Custo' : 'Contagem'} />
      </BarChart>
    </ChartContainer>
  )
}

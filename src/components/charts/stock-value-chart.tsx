
"use client"

import * as React from "react"
import { Pie, PieChart, Tooltip } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"

interface StockValueChartProps {
    data: { name: string; value: number; fill: string; }[];
}

const chartConfig = {
  valor: {
    label: "Valor (R$)",
  },
  componentes: {
    label: "Componentes",
    color: "hsl(var(--chart-1))",
  },
  insumos: {
    label: "Insumos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function StockValueChart({ data }: StockValueChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel indicator="dot" formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
          labelLine={false}
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            value,
            index,
          }) => {
            const RADIAN = Math.PI / 180
            const radius = 12 + innerRadius + (outerRadius - innerRadius) * 0.5
            const x = cx + radius * Math.cos(-midAngle * RADIAN)
            const y = cy + radius * Math.sin(-midAngle * RADIAN)

            return (
              <text
                x={x}
                y={y}
                className="fill-muted-foreground text-xs"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
              >
                {data[index].name.slice(0, 3)}
              </text>
            )
          }}
        >
        </Pie>
         <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}

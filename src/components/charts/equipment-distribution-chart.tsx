
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface EquipmentDistributionChartProps {
    data: { name: string; value: number; }[];
}

const chartConfig = {
  equipamentos: {
    label: "Equipamentos",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function EquipmentDistributionChart({ data }: EquipmentDistributionChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 0,
          top: 5,
          right: 30,
          bottom: 5,
        }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 15) + (value.length > 15 ? '...' : '')}
          className="text-xs"
        />
        <XAxis dataKey="value" type="number" hide />
         <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar dataKey="value" layout="vertical" fill="var(--color-equipamentos)" radius={4}>
           <LabelList
            dataKey="value"
            position="right"
            offset={8}
            className="fill-foreground font-semibold"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

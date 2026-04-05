"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { TrendData } from "@/types"

export const description = "Income vs expense trend"

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-2)",
  },
  expense: {
    label: "Expense",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface TrendLineProps {
  data: TrendData[] | undefined;
  loading?: boolean;
}

export function TrendLine({ data, loading }: TrendLineProps) {
  if (loading) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Loading data...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Showing trend over time</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <span className="text-sm text-muted-foreground">No trend data available</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>
            Showing trend over the periods
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const parts = String(value).split('-');
                if (parts.length >= 2) {
                  const [year, month] = parts;
                  const d = new Date(Number(year), Number(month) - 1);
                  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }
                return value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    const parts = String(value).split('-');
                    if (parts.length >= 2) {
                      const [year, month] = parts;
                      const d = new Date(Number(year), Number(month) - 1);
                      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                    }
                    return value;
                  }}
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
                    // Adding currency formatting to tooltip values
                    const val = new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(Number(value));
                    return val;
                  }}
                />
              }
            />
            <Area
              dataKey="expense"
              name="Expense"
              type="natural"
              fill="url(#fillExpense)"
              stroke="var(--color-expense)"
              fillOpacity={0.4}
            />
            <Area
              dataKey="income"
              name="Income"
              type="natural"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              fillOpacity={0.4}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

"use client"

import { TrendingUp, AlertTriangle } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { BudgetVsActual } from "@/types"

interface BudgetGaugeProps {
  data: BudgetVsActual[] | undefined;
  loading?: boolean;
  title?: string;
}

const chartConfig = {
  utilization: {
    label: "Utilization",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function BudgetGauge({ data, loading, title = 'Budget Utilization' }: BudgetGaugeProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No budget data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    teamName: item.teamName,
    utilization: Math.round(item.utilizationPercent),
    actual: item.actual,
    budgeted: item.budgeted,
    fill: item.utilizationPercent > 100 
      ? "var(--chart-5)" 
      : item.utilizationPercent > 80 
        ? "var(--chart-4)" 
        : "var(--color-utilization)",
  }))

  const totalActual = data.reduce((acc, curr) => acc + curr.actual, 0)
  const totalBudgeted = data.reduce((acc, curr) => acc + curr.budgeted, 0)
  const totalUtilization = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0
  const isOverBudget = totalUtilization > 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>Budget vs actual</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 10,
              right: 20,
            }}
          >
            <XAxis type="number" dataKey="utilization" hide />
            <YAxis
              dataKey="teamName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 15)}
              width={100}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="utilization" radius={5} minPointSize={2} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          <span className={isOverBudget ? "text-destructive" : "text-emerald-500"}>
            Overall {totalUtilization.toFixed(1)}% utilized
          </span>
          {isOverBudget ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing budget utilization for {data.length} {data.length === 1 ? 'team' : 'teams'}
        </div>
      </CardFooter>
    </Card>
  )
}

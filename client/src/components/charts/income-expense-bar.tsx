"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
import type { TeamAnalytics } from "@/types"

interface IncomeExpenseBarProps {
  data: TeamAnalytics[] | undefined;
  loading?: boolean;
  title?: string;
}

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

export function IncomeExpenseBar({ data, loading, title = 'Team Breakdown' }: IncomeExpenseBarProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
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
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No team data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0)
  const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0)
  const isNetPositive = totalIncome >= totalExpense
  const netAmount = Math.abs(totalIncome - totalExpense)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>Income vs expense per team</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="teamName"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).length > 15 ? String(value).slice(0, 15) + '...' : value}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value: any) => {
                     const formatted = new Intl.NumberFormat('en-US', {
                       style: 'currency',
                       currency: 'USD',
                       minimumFractionDigits: 0,
                     }).format(Number(value));
                     return formatted;
                  }}
                />
              }
            />
            <Bar dataKey="income" name="Income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {isNetPositive ? (
            <span className="text-emerald-500">Net positive by ${netAmount.toLocaleString()}</span>
          ) : (
            <span className="text-destructive">Net negative by ${netAmount.toLocaleString()}</span>
          )}
          {isNetPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing income vs expense breakdown across {data.length} {data.length === 1 ? 'team' : 'teams'}
        </div>
      </CardFooter>
    </Card>
  )
}

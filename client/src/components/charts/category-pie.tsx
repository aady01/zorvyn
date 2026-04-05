"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
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
import type { CategoryAnalytics } from "@/types"

export const description = "Expenses by category"

interface CategoryPieProps {
  data: CategoryAnalytics[] | undefined;
  loading?: boolean;
}

export function CategoryPie({ data, loading }: CategoryPieProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data
      .filter((item) => item.expense > 0)
      .map((item, index) => ({
        category: item.category,
        expense: item.expense,
        fill: `var(--chart-${(index % 5) + 1})`,
      }));
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color?: string }> = {
      expense: {
        label: "Expense",
      },
    };
    
    chartData.forEach((item, index) => {
      // Create a safely formatted key for the config
      const key = item.category.toLowerCase().replace(/[^a-z0-9]/g, '_');
      config[key] = {
        label: item.category,
        color: item.fill,
      };
    });
    
    return config as ChartConfig;
  }, [chartData]);

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 p-6 flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>No expense data available</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 p-6 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">No data to display</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription>Expense Breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-auto h-[250px] w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  hideLabel 
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
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
            <Pie 
              data={chartData} 
              dataKey="expense" 
              nameKey="category" 
              outerRadius="80%"
              label={({ payload, ...props }) => {
                return (
                  <text
                    cx={props.cx}
                    cy={props.cy}
                    x={props.x}
                    y={props.y}
                    textAnchor={props.textAnchor}
                    dominantBaseline={props.dominantBaseline}
                    fill="currentColor"
                    fontSize={12}
                  >
                    {payload.category}
                  </text>
                );
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}


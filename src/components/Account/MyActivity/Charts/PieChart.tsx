import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "User activity distribution"

type PieSlice = { name: string; value: number }

export function ChartPieDonutText({ data, title = "Activity Breakdown", desc = "PDF vs Audio" }: { data: PieSlice[]; title?: string; desc?: string }) {
  const total = React.useMemo(() => {
    return (Array.isArray(data) ? data : []).reduce((acc, curr) => acc + Number(curr.value || 0), 0)
  }, [data])

  const colored = React.useMemo(() => {
    const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
    return (Array.isArray(data) ? data : []).map((d, i) => ({ ...d, fill: colors[i % colors.length] }))
  }, [data])

  const chartConfig = React.useMemo(() => {
    return { value: { label: "Value" } } as ChartConfig
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={colored} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
import { Bar, BarChart as RBarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "Monthly totals bar chart"

type BarPoint = { month: string; pdf: number; audio: number }

const chartConfig = {
  pdf: { label: "PDF", color: "#fb7185" },
  audio: { label: "Audio", color: "#0891b2" },
} satisfies ChartConfig

export function ChartBarDefault({ data, title = "Totals by Month", desc = "Last 12 months" }: { data: BarPoint[]; title?: string; desc?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <RBarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="pdf" stackId="a" fill="var(--color-pdf)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="audio" stackId="a" fill="var(--color-audio)" radius={[4, 4, 0, 0]} />
          </RBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

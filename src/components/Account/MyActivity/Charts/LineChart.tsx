import { CartesianGrid, Line, LineChart as RLineChart, XAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "User monthly activity (12 months)"

type LinePoint = { month: string; pdf: number; audio: number }

const chartConfig = {
  pdf: { label: "PDF", color: "#fb7185" },
  audio: { label: "Audio", color: "#0891b2" },
} satisfies ChartConfig

export function ChartLineMultiple({ data, title = "Monthly Activity", desc = "Last 12 months", className }: { data: LinePoint[]; title?: string; desc?: string; className?: string }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer config={chartConfig}>
          <RLineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line dataKey="pdf" type="monotone" stroke="var(--color-pdf)" strokeWidth={2} dot={false} />
            <Line dataKey="audio" type="monotone" stroke="var(--color-audio)" strokeWidth={2} dot={false} />
          </RLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

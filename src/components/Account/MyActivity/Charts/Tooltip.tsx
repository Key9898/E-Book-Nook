import * as React from "react"
import { Bar, BarChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "Weekly activity with tooltip"

type WeekPoint = { date: string; reading: number; audio: number }

export function ChartTooltipLabelFormatter({ data, title = "Weekly Activity", desc = "Last 7 days (Sun-Sat)" }: { data: WeekPoint[]; title?: string; desc?: string }) {
  const chartConfig = React.useMemo(() => {
    return {
      reading: { label: "Reading", color: "var(--chart-1)" },
      audio: { label: "Audio", color: "var(--chart-2)" },
    } satisfies ChartConfig
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", { weekday: "short" })
              }}
            />
            <Bar dataKey="reading" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="audio" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                  }}
                />
              }
              cursor={false}
              defaultIndex={0}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

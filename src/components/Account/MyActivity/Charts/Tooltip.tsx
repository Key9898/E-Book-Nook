import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "Weekly activity line chart"

type WeekPoint = { date: string; reading: number; audio: number }

export function ChartLineWeekly({ data, title = "Weekly Activity", desc = "Last 7 days (Sun-Sat)" }: { data: WeekPoint[]; title?: string; desc?: string }) {
  const chartConfig = React.useMemo(() => {
    return {
      reading: { label: "Reading (min)", color: "#fb7185" },
      audio: { label: "Audio (sessions)", color: "#0891b2" },
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
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", { weekday: "short" })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                  }}
                />
              }
            />
            <Line dataKey="reading" type="monotone" stroke="var(--color-reading)" strokeWidth={2} dot={false} />
            <Line dataKey="audio" type="monotone" stroke="var(--color-audio)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

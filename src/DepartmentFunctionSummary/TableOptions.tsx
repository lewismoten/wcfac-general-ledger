import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Stack from "@mui/material/Stack"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import type { FunctionComponent } from "react"
import type { ViewMode } from "./types"
import { baseOptions } from "./helpers"

interface TableOptionsProps {
  viewMode: ViewMode,
  setViewMode: (viewMode: ViewMode) => void,
  baseThresholdCents: number,
  setBaseThresholdCents: (baseThresholdCents: number) => void
}

export const TableOptions: FunctionComponent<TableOptionsProps> = ({
  viewMode,
  setViewMode,
  baseThresholdCents,
  setBaseThresholdCents
}) => (
  <Card>
    <CardContent>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, v: ViewMode | null) => v && setViewMode(v)}
        >
          <ToggleButton value="top10">Top 10</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={baseThresholdCents}
          onChange={(_, v: number | null) => v !== null && setBaseThresholdCents(v)}
        >
          {baseOptions.map(({ label, cents }) => (
            <ToggleButton key={cents} value={cents}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

      </Stack>
    </CardContent>
  </Card>)

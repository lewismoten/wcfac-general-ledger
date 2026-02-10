import type { FunctionComponent } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { formatMonthYear, formatRange } from "./helpers";
import type { DeptFunctionSummaryResponse } from "./types";

interface ContextHeaderProps {
  data: DeptFunctionSummaryResponse
}
export const ContextHeader: FunctionComponent<ContextHeaderProps> = ({ data }) => {
  const {
    fy,
    fm,
    ranges: {
      month: { start },
      fytd: {
        start: fytdStart,
        end_exclusive: fytdEnd
      },
      prior_fytd: {
        start: priorFytdStart,
        end_exclusive: priorFytdEnd
      }
    }
  } = data;
  return (<Card>
    <CardContent>
      <Typography variant="h6">
        Department Outflow · FY{fy} · Fiscal Month {fm}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.85 }}>
        Month: {formatMonthYear(start)} · FYTD:{" "}
        {formatRange(fytdStart, fytdEnd)} · Compared to prior FYTD:{" "}
        {formatRange(priorFytdStart, priorFytdEnd)}
      </Typography>
    </CardContent>
  </Card>
  );
}
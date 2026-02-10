import type { FunctionComponent } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

export const QueryStatus: FunctionComponent<{
  isFetching: boolean, 
  isLoading: boolean,
  isError: boolean,
  error: Error | null
}> = ({isFetching, isLoading, isError, error}) => {
  const components = [];
  if(isError) {
    components.push(<Alert key="error" severity="error">
          {error === null ? 'Error' : error.message}
        </Alert>);
  }
  if(isLoading) {
    components.push(<Stack key="loading" direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <div>Loading…</div>
        </Stack>
    );
  }
  if(isFetching && !isLoading) {
   components.push(<Alert key="updating" severity="info">Updating…</Alert>);
  }
  if(components.length === 0) return null;
  if(components.length === 1) return components[0];
  return components;
}
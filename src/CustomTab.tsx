import Tab from "@mui/material/Tab";
import type { TabProps } from '@mui/material/Tab';

type CustomTabProps = TabProps & {
  index: number;
}

export const CustomTab = ({
  index = 0,
  ...props
}: CustomTabProps) => {
  const id = props.id ?? `tab-${index}`;
  const controls = (props['aria-controls'] as string | undefined) ?? `tab-panel-${index}`;
  return <Tab {...props} id={id} aria-controls={controls} />;
}
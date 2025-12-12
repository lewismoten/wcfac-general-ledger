import Box from "@mui/system/Box";

interface TabPanelProps {
  index: number;
  selectedIndex: number;
  children?: React.ReactNode;
  id?: string,
  "aria-labelledby"?: string
}

export const CustomTabPanel = ({ children, selectedIndex = 0, index=0, id = `tab-panel-${index}`, "aria-labelledby": labelId = `tab-${index}` }: TabPanelProps) => 
    <div
      role="tabpanel"
      hidden={selectedIndex !== index}
      id={id}
      aria-labelledby={labelId}
    >
      {selectedIndex === index ? <Box sx={{ p: 2 }}>{children}</Box> : null}
    </div>
  
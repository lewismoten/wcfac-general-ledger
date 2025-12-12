import Grid from "@mui/material/Grid";
import { FyLookup } from "./FyLookup";
import { LedgerLookup } from "./LedgerLookup";
import { CoaLookup } from "./CoaLookup";
import { InvoiceLookup } from "./InvoiceLookup";

  const SIZE = { xs: 12, sm:6, md: 3 };

export const Filters = () => 
  <Grid container spacing={1}>
        <Grid  size={SIZE}>
          <FyLookup name='fy' label="Fiscal Year" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='bat' label="Batch" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='re' label="R/E" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='ol1' label="OL1" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='ol1Func' label="Function" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='ol2' label="OL2" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='dept' label="Department" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='acct' label="Account" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='vend' label="Vendor" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='po' label="P/O" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='chk' label="Check" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="1" label="Invoice[1]" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="2" label="Invoice[2]" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="3" label="Invoice[3]" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="-1" label="Invoice" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='des' label="Description" />
        </Grid>
      </Grid>

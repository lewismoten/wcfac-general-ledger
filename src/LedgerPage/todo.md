# In Progress
- [x] Preserve selected tab in local state

# Under consideration

## Export
- [ ] Ability to download reports as PDF
- [ ] Display QR Code that can be downloaded

## Import
- [ ] Handle invoice numbers beginning with months "SEPT003655 3422" to remove or swap month in INVOICE_NO_1

## Data
- [ ] Ability to add notes to named query
- [ ] Ability to add notes to individual entries
- [ ] Ability to import additional csv data
- [ ] Use/display account description overrides from COA
  - [ ] Override & Toggle Lookups (Dept Names, Account Names, etc.)
- [ ] Categorize vendors in categories (Water & Sewage, Electric, Office Supplies, etc.)
- [ ] Add metadata for vendors (web page, address, contact info, categories)
- [ ] Save filter parameters as a named query
- [ ] Consolidate vendors/accounts, and add ability to toggle consolidation

## User Data
- [ ] Shared info from #Data
  - [ ] Make Public
  - [ ] Accessible by link only
  - [ ] Restrict to users / groups / roles


## Search
- [ ] Search bar above tabs to simply search for text anywhere
  - [ ] setup search bar to parse quick filters 
    - [ ] vend:12345
    - [ ] amount>10000
    - [ ] date:2024-01...2024-06
- [ ] Provide simple/advanced filter interface
  - [ ] Search [ string ] Range [start] and [end]
  - [ ] Display "chips" in simple interface
- [ ] Filter Range for Check Date
- [ ] Filter Range for Invoice Date
- [ ] Filter Range for Account Paid
- [ ] Filter for days between Invoice/Check Date
- [ ] Filter with "Exclude" option (ie - all fiscal years except 2026)

## Charts
- [ ] Control line thickness, dash pattern, or mono-colors based on distinct label level
- [ ] Change Grid to display Year, Week, Day, All-Time

## User Interface
- [ ] Convert pagination for chart to MUI control
- [ ] Set Lookups to query API based on what is searched to bypass limit
- [ ] Display statistics (total records, earliest check date, latest check date, etc.)
- [ ] Add links in reports, etc. to add additional filters. ie - clicking a vendor number adds that vendor to the filtered list, and hides all other vendors.
- [ ] Make ledger data columns sortable in table
- [ ] Mobile Friendly / Responsive

## Analysis
- [ ] Create queries to detect discrepencies
- [ ] Detect missing invoices based on large gaps in days
- [ ] Determine if all check dates in a batch always match and update lookup accordingly

# Done
- [x] Pie Chart for category / sub-category ?
- [x] Filter Description
- [x] Ability to download matches as CSV / Excel Spreadsheet
- [x] Ability to create reports

# Chart of Accounts

1. Locate all Chart of Account PDF files:

Files:
- MAJORS (DEPARTMENTS).pdf
- FUND NUMBERS.pdf
- ACCOUNTS (OBJECTS).pdf

2. Copy the text of the full document into corresponding txt files in `./data/chart-of-accounts/`.
- departments.txt
- funds.txt
- accounts.txt

3. Remove all page headers such as:
```js
11/07/2025 *GL065B* G/L CHART OF ACCOUNTS PAGE 1
WARREN COUNTY
Major# Description
------- -----------
```

4. Run a script to convert all text files to JSON
```bash
npm run convert-chart-of-accounts
```

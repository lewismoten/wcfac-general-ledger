import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { parse } from 'csv-parse/sync';
import { createObjectCsvWriter } from 'csv-writer';

const targetFolder = './data/gl'
function buildHeaders(rawRows) {
  const headerRow1Index = 2;
  const headerRow2Index = 3;

  if (rawRows.length <= headerRow2Index) {
    throw new Error(`Only ${rawRows.length} rows. Not enough rows to extract two-line header.`);
  }

  const row1 = rawRows[headerRow1Index];
  const row2 = rawRows[headerRow2Index];

  const maxLen = Math.max(row1.length, row2.length);
  const headers = [];

  for (let i = 0; i < maxLen; i++) {
    const part1 = (row1[i] || '').trim();
    const part2 = (row2[i] || '').trim();
    const combined = `${part1} ${part2}`.trim();

    headers.push(combined || `col_${i + 1}`);
  }

  // console.log(`Headers:\n${headers.map((h, i) => `${i + 1}. ${h}`).join('\n')}`)
  return { headers, dataStartIndex: headerRow2Index + 1 };
}

const seen = [];

function buildRecordsFromRawRows(rawRows, headers, dataStartIndex, sourceFile) {
  const records = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row.length) continue;
    if (!seen.includes(row[0])) {
      // console.log(`PO Number: '${row[0]}'`);
      seen.push(row[0])
    }
    if (!/^\d{7}$/.test(row[0] ?? '')) continue;

    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? String(row[idx]).trim() : '';
    });

    //obj._sourceFile = sourceFile;
    records.push(obj);
  }

  return records;
}

async function convertAllCsvToOneJson(folder) {
  try {
    const files = await readdir(folder);
    const csvFiles = files.filter(f => !f.startsWith("._") && extname(f).toLowerCase() === '.csv' && !f.startsWith('general-ledger'));

    console.log(`Found ${csvFiles.length} CSV files.\n`, csvFiles.map((f, i) => `${i + 1}. ${f}`).join('\n'))
    if (csvFiles.length === 0) {
      console.log('No CSV files found in:', folder);
      return;
    }

    const allRows = [];
    let headers;

    for (const file of csvFiles) {
      const filePath = join(folder, file);
      console.log(`Reading ${filePath} ...`);

      const text = await readFile(filePath, 'utf8');

      const rawRows = parse(text, {
        skip_empty_lines: true,
        relax_column_count: true,
      });

      const foo = buildHeaders(rawRows);
      headers = headers ?? foo.headers;
      const dataStartIndex = foo.dataStartIndex;

      const records = buildRecordsFromRawRows(rawRows, headers, dataStartIndex, file);
      console.log(`  -> ${records.length} valid data rows from ${file}`);

      allRows.push(...records);
    }

    const outPath = join(targetFolder, 'general-ledger.json');
    await writeFile(outPath, JSON.stringify(allRows, null, 2), 'utf8');
    console.log(`Wrote ${allRows.length} total rows to ${outPath}`);

    console.log(headers);
    const outCsv = join(targetFolder, 'general-ledger.csv');
    const csvWriter = createObjectCsvWriter({
      path: outCsv,
      header: headers.map(id => ({ id, title: id })),
      alwaysQuote: false,

    });
    await csvWriter.writeRecords(allRows);
    console.log(`Wrote ${allRows.length} total rows to ${outCsv}`);

    // sql
    const sqlPath = join(targetFolder, 'general-ledger.sql');

    // const maxLengths = {};
    // const allDigits = {};
    // const allMoney = {};
    // const allDate = {};
    // headers.forEach(header => {
    //   maxLengths[header] = 1;
    //   allDigits[header] = true;
    //   allMoney[header] = true;
    //   allDate[header] = true;
    // });
    // allRows.forEach((row, idx) => {
    //   headers.forEach((header) => {
    //     const value = row[header].replace(/[-\s]+$/g, '');
    //     const l = value.length;
    //     if (l > maxLengths[header]) {
    //       maxLengths[header] = l;
    //     }
    //     const d = /^\d*$/.test(value);
    //     if (!d) {
    //       allDigits[header] = false;
    //     }
    //     const f = /^[\d]*(\.\d\d?)?$/.test(value);
    //     if (!f) {
    //       allMoney[header] = false;
    //     }
    //     const da = /^\d?\d\/\d?\d\/\d\d\d\d$/.test(value) ||
    //       /^\d\d\d\d\/\d\d$/.test(value);
    //     if (!da) {
    //       allDate[header] = false;
    //     }
    //   })
    // });
    // console.log(`sql stats`);
    // console.log(`maxLengths`, maxLengths);
    // console.log(`digits`, allDigits);
    // console.log(`money`, allMoney);
    // console.log(`date`, allDate);

    let sql = `
DROP TABLE IF EXISTS LEDGER;

CREATE TABLE LEDGER (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    PURCHASE_ORDER INT NOT NULL,
    VENDOR_NO INT NOT NULL,
    VENDOR_NAME VARCHAR(25) NOT NULL,
    INVOICE_NO VARCHAR(19) NULL,
    INVOICE_NO_1 VARCHAR(19) NULL,
    INVOICE_NO_2 VARCHAR(17) NULL,
    INVOICE_NO_3 VARCHAR(15) NULL,
    INVOICE_DATE DATE NOT NULL,
    ACCOUNT_RE INT NOT NULL,
    ACCOUNT_OL1 INT,
    ACCOUNT_OL1_FUNC INT,
    ACCOUNT_OL2 INT,
    ACCOUNT_FUND INT NOT NULL,
    ACCOUNT_DEPT INT NOT NULL,
    ACCOUNT_NO INT NOT NULL,
    ACCOUNT_PAID DATE NOT NULL,
    NET_AMOUNT DECIMAL(10,2) NOT NULL,
    CHECK_NO INT NOT NULL,
    CHECK_DATE DATE NOT NULL,
    DESCRIPTION VARCHAR(30) NOT NULL,
    BATCH INT NOT NULL
);
`

    sql += allRows.map(row => {
      const invoiceDate = row[headers[4]].split('/').map(part => parseInt(part, 10).toString(10));
      const accountPaid = row[headers[6]].split('/').map(part => parseInt(part, 10).toString(10));
      const checkDate = row[headers[9]].split('/').map(part => parseInt(part, 10).toString(10));
      const netAmount = parseFloat(row[headers[7]]).toFixed(2);
      const accountNo = row[headers[5]].replace(/[-\s]+$/g, '').split('-').map(part => parseInt(part));
      const invoiceNos = row[headers[3]].replace(/[-\s]/g, '-').split('-');
      const accountRE = parseInt(accountNo[0].toString().padStart(4, '0')[0]);
      let ol1 = 'NULL';
      let ol1Func = 'NULL';
      let ol2 = 'NULL';
      if (accountRE === 4) {
        // Expenditures
        const major = accountNo[1].toString().padStart(5, '0');
        ol1 = major[0];
        ol1Func = major[1];
        ol2 = major[2];
      }
      return `INSERT INTO LEDGER (
        PURCHASE_ORDER,
        VENDOR_NO,
        VENDOR_NAME,
        INVOICE_NO,
        INVOICE_NO_1,
        INVOICE_NO_2,
        INVOICE_NO_3,
        INVOICE_DATE,
        ACCOUNT_RE,
        ACCOUNT_OL1,
        ACCOUNT_OL1_FUNC,
        ACCOUNT_OL2,
        ACCOUNT_FUND,
        ACCOUNT_DEPT,
        ACCOUNT_NO,
        ACCOUNT_PAID,
        NET_AMOUNT,
        CHECK_NO,
        CHECK_DATE,
        DESCRIPTION,
        BATCH
      ) VALUES (
       ${parseInt(row[headers[0]])},
       ${parseInt(row[headers[1]])},
       ${stringOrNull(row[headers[2]])},
       ${stringOrNull(row[headers[3]])},
       ${stringOrNull(invoiceNos[0])},
       ${stringOrNull(invoiceNos[1])},
       ${stringOrNull(invoiceNos[2])},
       '${invoiceDate[2].padStart(4, '0')
        }-${invoiceDate[0].padStart(2, '0')
        }-${invoiceDate[1].padStart(2, '0')
        }',
        ${accountRE},
        ${ol1},
        ${ol1Func},
        ${ol2},
       ${accountNo[0]},
       ${accountNo[1]},
       ${accountNo[2]},
       '${accountPaid[0].padStart(4, '0')
        }-${accountPaid[1].padStart(2, '0')
        }-01',
       ${netAmount.endsWith('.00') ? parseInt(netAmount) : netAmount},
       ${parseInt(row[headers[8]])},
       '${checkDate[2].padStart(4, '0')
        }-${checkDate[0].padStart(2, '0')
        }-${checkDate[1].padStart(2, '0')
        }',
       ${stringOrNull(row[headers[10]])},
       ${parseInt(row[headers[11]])}
      );`
    }).join('\n');
    await writeFile(sqlPath, sql, 'utf8');
    console.log(`✅ Wrote ${sql.length} bytes to ${sqlPath}`);


  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

const stringOrNull = value => {
  if (!value) return 'NULL';
  const escaped = value.trim()
    // escape appostrophee
    .replace(/'/g, '\'\'')
    // single space
    .replace(/  /g, ' ')
    // asterisk prefix
    .replace(/^[*\s]/g, '')
    // remove asterisk suffix
    .replace(/[*\s]$/g, '');
  if (escaped.length === 0) return 'NULL';
  return `'${escaped}'`;
}

const main = async () => {
  const json = await readFile('config.json', 'utf8');
  const config = JSON.parse(json);
  await convertAllCsvToOneJson(config.apRegisterFolder);
}

main();

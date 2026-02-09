import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { ApiError } from '../LedgerPage/ApiError';
import { API_ROOT } from '../utils/API_ROOT';
import { MonthSelect } from '../SearchInputs/MonthSelect';
import { YearSelect } from '../SearchInputs/YearSelect';

interface ExpectedData {
  hello: string,
}

const MONTH_KEY = 'fm';
const YEAR_KEY = 'fy';
const KEYS = [YEAR_KEY, MONTH_KEY];

const subParams = (params: URLSearchParams, ...ids: string[]) => {
  const subset: URLSearchParams = new URLSearchParams();
  ids.forEach(id => {
    if(params.has(id)) 
      subset.set(id, params.get(id)??'')
    }
    );
  return subset.toString();
}

export const FinancialHealthSnapshot = () => {
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');

  const query = useMemo(() => subParams(searchParams, ...KEYS), [searchParams]);

  const { data, error } = useQuery<ExpectedData>({
    queryKey: ['financial-health-snapshot', query],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`${API_ROOT}/financial-health-snapshot.php?${query}`);
      return res.json().then((data: ExpectedData | ApiError) => {
        if ('error' in data) {
          console.error(data);
          setErrorMessage(data.error);
          throw data.details;
        }
        setErrorMessage('');
        return data;
      })
    }
  });

  // select year, month
  // show total spend [current month, prior fiscal year month]
  // show total spend [fiscal ytd, prior fiscal year YTD same month]

  // ie: selected December 2025
  // Total Spend [SUM(December 2025), SUM(July 2025 to December 2025)]
  // Prior Spend [SUM(December 2024), SUM(July 2024 to December 2024)]

  // Charts
  // Line - [SUM(January 2023), SUM(February 2023), ..., SUM(December 2025)]
  // Bar - [Jul 2024 vs 2025, Aug 2024 vs 2025, ... Dec 2024 vs 2025, Jan 2025 vs null, ..., Jun 2026 vs null]

  /* DATA {
    totalSpend: {
      month: {
        fiscalMonth: 6,
        value: 9223.12
      },
      fiscalYear: {
        fiscalYear: 2025,
        value: 42119.12
      }
    },
    priorTotalSpend: {
      month: {
        fiscalMonth: 6,
        value: 9323.12
      },
      fiscalYear: {
        fiscalYear: 2024,
        value: 40119.12
      }
    },
    monthlyTotalSpend: [
      {
        fiscalMonth: 1,
        fiscalYear: 2024,
        value: 4111
      },
      ...
      {
        fiscalMonth: 6,
        fiscalYear: 2025,
        value: 4111
      }
    ],
    currentPriorSpend: [
      {
        fiscalMonth: 1,
        values: [
          {
            fiscalYear: 2024,
            value: 1243
          }, 
          {
            fiscalYear: 2025,
            value: 49101
          }
        ]
      },
    ]
    
    [
      ['FY2025', 9923.12],
      ['FY2024', '1881.12]
    ],
    months: [
    ]
  }
  */

  // Are we spending more or less than last year

  return <div>
    <MonthSelect id={MONTH_KEY} fiscal />
    <YearSelect id={YEAR_KEY} fiscal />
    {error ? `Error: ${errorMessage}` : `Hello: ${data?.hello}`}
  </div>
}
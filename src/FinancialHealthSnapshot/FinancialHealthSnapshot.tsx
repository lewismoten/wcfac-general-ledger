import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { ApiError } from '../LedgerPage/ApiError';
import { API_ROOT } from '../utils/API_ROOT';

interface ExpectedData {
  hello: string,
}

export const FinancialHealthSnapshot = () => {
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const { data, error } = useQuery<ExpectedData>({
    queryKey: ['financial-health-snapshot', searchParams.toString()],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`${API_ROOT}/financial-health-snapshot.php?${searchParams.toString()}`);
      return res.json().then((data: ExpectedData | ApiError) => {
        if ('error' in data) {
          console.error(data);
          setErrorMessage(data.error);
          throw data.details;
        }
        setErrorMessage('');
        return data;
      }
      )
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

  // Are we spending more or less than last year
  
  return <div>{error ? `Error: ${errorMessage}` : `Hello: ${data?.hello}`}</div>
}
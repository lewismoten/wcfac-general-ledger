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

  return <div>{error ? `Error: ${errorMessage}` : `Hello: ${data?.hello}`}</div>
}
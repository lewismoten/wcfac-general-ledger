import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query';

function App() {
  const ff = useQuery({
    queryKey: ['chartData'],
    enabled: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/test.php');
      return res.json();
    }
  });

  const getData = () => {
    if (ff.isFetching) return;

    ff.refetch();
  }

  const prettyData = useMemo(() => {
    if (!ff.data) return null;
    return <pre>{JSON.stringify(ff.data, null, '  ')}</pre>
  }, [ff.data])

  return (
    <>
      <h1>General Ledger</h1>
      <button onClick={getData}>{ff.isFetching ? 'Loading...' : 'Get Data'}</button>
      {ff.error ? <b>{ff.error.message}</b> : null}
      {prettyData}

    </>
  )
}

export default App

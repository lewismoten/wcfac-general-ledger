import type { ChangeEventHandler } from "react"
import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom";

const PAGE_SIZES = [10, 25, 50, 100, 250, 500, 1000, 1200, 1500, 2000];

export const Paginator = ({
  totalCount
}: {
  totalCount: number
}
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageNumber, pageSize] = useMemo(() => {
    const page = parseInt(searchParams.has('pg') ? searchParams.get('pg') ?? '1' : '1');
    const size = parseInt(searchParams.has('ps') ? searchParams.get('ps') ?? '1200' : '1200');
    return [page, size];
  },
    [searchParams]);
  const pageCount = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  const [setPageNumber, setPageSize] = useMemo(() => {
    const setPageNumber = (number: number) => {
      searchParams.set('pg', number.toString());
      setSearchParams(searchParams);
    }
    const setPageSize = (size: number) => {
      searchParams.set('ps', size.toString());
      setSearchParams(searchParams);
    }
    return [setPageNumber, setPageSize];
  }, [searchParams, setSearchParams])

  return <div>
    <JumpFirst pageNumber={pageNumber} setPageNumber={setPageNumber} />
    <JumpPrior pageNumber={pageNumber} setPageNumber={setPageNumber} />
    <PageList pageNumber={pageNumber} pageCount={pageCount} setPageNumber={setPageNumber} />
    <SizeList pageSize={pageSize} setPageSize={setPageSize} />
    <JumpNext pageNumber={pageNumber} pageCount={pageCount} setPageNumber={setPageNumber} />
    <JumpLast pageNumber={pageNumber} pageCount={pageCount} setPageNumber={setPageNumber} />
  </div>

}

const JumpFirst = ({ pageNumber, setPageNumber }: { pageNumber: number, setPageNumber: (page: number) => void }) => {
  const disabled = pageNumber <= 1;
  return <button disabled={disabled} onClick={() => setPageNumber(1)}>⏮️</button>
}
const JumpPrior = ({ pageNumber, setPageNumber }: { pageNumber: number, setPageNumber: (page: number) => void }) => {
  const disabled = pageNumber <= 1;
  return <button disabled={disabled} onClick={() => setPageNumber(pageNumber - 1)}>⏪</button>
}
const JumpNext = ({ pageNumber, pageCount, setPageNumber }: { pageNumber: number, pageCount: number, setPageNumber: (page: number) => void }) => {
  const disabled = pageNumber >= pageCount;
  return <button disabled={disabled} onClick={() => setPageNumber(pageNumber + 1)}>⏩</button>
}
const JumpLast = ({ pageNumber, pageCount, setPageNumber }: { pageNumber: number, pageCount: number, setPageNumber: (page: number) => void }) => {
  const disabled = pageNumber >= pageCount;
  return <button disabled={disabled} onClick={() => setPageNumber(pageCount)}>⏭️</button>
}

const PageList = ({
  pageNumber,
  pageCount,
  setPageNumber
}: {
  pageNumber: number,
  pageCount: number,
  setPageNumber: (page: number) => void
}) => {
  const change = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
    const page = parseInt(event.currentTarget.selectedOptions[0].value, 10);
    setPageNumber(page);
  }, [setPageNumber])

  const disabled = pageCount <= 1;

  const isSelected = useCallback((page: number) => page === pageNumber, [pageNumber]);

  const pageText = useCallback((page: number) =>
    isSelected(page) ? `Page ${page} of ${pageCount}` : `Page ${page}`
    , [isSelected, pageCount]);

  const pages = useMemo(() => {

    return new Array(pageCount)
      .fill(0)
      .map((_v, idx) => {
        const page = idx + 1;
        return <option value={page} selected={isSelected(page)}>
          {pageText(page)}
        </option>
      });
  }, [pageCount, isSelected])

  return <select disabled={disabled} onChange={change}>{pages}</select>
}

const SizeList = ({ pageSize, setPageSize }: { pageSize: number, setPageSize: (size: number) => void }) => {
  const change = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
    const size = parseInt(event.currentTarget.selectedOptions[0].value, 10);
    setPageSize(size)
  }, [setPageSize]);
  const isSelected = useCallback((size: number) => size === pageSize, [pageSize]);

  const pages = useMemo(() => PAGE_SIZES
    .map((size) => {
      return <option value={size} selected={isSelected(size)}>
        {size.toLocaleString()}
      </option>
    })
    , [isSelected]);

  return <select onChange={change}>{pages}</select>
}
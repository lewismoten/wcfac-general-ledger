import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiError } from './ApiError';
import { useSearchParams } from 'react-router-dom';
import { colors, formatCurrency } from './utils';
import {
  Tooltip,
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Sector
} from "recharts";

interface LedgerReportVendor {
  no: number,
  name: string,
  [key: number]: number
}
interface LedgerReportAccount {
  no: number,
  name: string,
  vendors: { [key: number]: LedgerReportVendor }
}
interface LedgerReportDepartment {
  no: number,
  name: string,
  accounts: { [key: number]: LedgerReportAccount }
}
type LedgerReport = {
  years: number[],
  departments: { [key: number]: LedgerReportDepartment }
}
type PieRow = {
  level: "department" | "account" | "vendor";
  id: number;
  name: string;
  value: number;
  parentId?: number
};
type LedgerTooltipProps = {
  active?: boolean;
  payload?: { payload: PieRow }[];
}
const StableSector = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};
const Tipped = ({ level, id, name, value }: PieRow) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ccc",
        padding: "8px 10px",
        fontSize: "9pt",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>
        {level.toUpperCase()}
      </div>

      <div>
        <strong>No:</strong>{" "}
        {id.toString().padStart(
          level === "department" ? 6 :
            level === "account" ? 5 : 6,
          "0"
        )}
      </div>

      <div>
        <strong>Name:</strong> {name}
      </div>

      <div style={{ marginTop: 4, textAlign: "right" }}>
        <strong>{formatCurrency(value)}</strong>
      </div>
    </div>
  );
}
export const LedgerPie = () => {
  const [searchParams] = useSearchParams();
  const [hovered, setHovered] = useState<PieRow | null>(null);
  const LedgerPieTooltip = ({ active }: LedgerTooltipProps) => (!active || !hovered) ? null : <Tipped {...hovered} />

  const localParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    ['series', 'pg', 'ps'].forEach(key => {
      if (params.has(key)) params.delete(key);
    });
    return params.toString();
  }, [searchParams]);

  const { data } = useQuery<LedgerReport | ApiError>({
    queryKey: ['ledger-report', localParams],
    placeholderData: keepPreviousData,
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/ledger-report.php?${localParams}`);
      return res.json();
    }
  });

  const { deptData, acctData, vendData } = useMemo(() => {


    const deptArr: PieRow[] = [];
    const acctArr: PieRow[] = [];
    const vendArr: PieRow[] = [];

    if (data === null || data === void 0 || "error" in data) return {
      deptData: deptArr,
      acctData: acctArr,
      vendData: vendArr,
    };

    const { years, departments } = data ?? {};
    const yearList = years ?? [];

    Object.keys(departments).forEach(deptKey => {
      const deptNo = parseInt(deptKey, 10);
      const department = departments[deptNo];

      let deptTotal = 0;

      Object.keys(department.accounts).forEach(acctKey => {
        const acctNo = parseInt(acctKey, 10);
        const account = department.accounts[acctNo];

        let acctTotal = 0;

        Object.keys(account.vendors).forEach(vendKey => {
          const vendNo = parseInt(vendKey, 10);
          const vendor = account.vendors[vendNo];

          const vendorTotal = yearList.reduce(
            (sum, year) => sum + (vendor[year] ?? 0),
            0
          );

          if (vendorTotal > 0) {
            vendArr.push({
              level: 'vendor',
              id: vendNo,
              name: vendor.name,
              value: vendorTotal,
              parentId: acctNo,
            });
          }

          acctTotal += vendorTotal;
        });

        if (acctTotal > 0) {
          acctArr.push({
            level: 'account',
            id: acctNo,
            name: account.name,
            value: acctTotal,
            parentId: deptNo,
          });
        }

        deptTotal += acctTotal;
      });

      if (deptTotal > 0) {
        deptArr.push({
          level: 'department',
          id: deptNo,
          name: department.name,
          value: deptTotal,
        });
      }
    });

    return {
      deptData: deptArr,
      acctData: acctArr,
      vendData: vendArr,
    };
  }, [data]);

  if (data === null || data === void 0) {
    return null;
  }
  if ("error" in data) {
    return <p>{data.error}</p>;
  }

  if (
    !("departments" in data) ||
    (Array.isArray(data.departments) && data.departments.length === 0) ||
    Object.keys(data.departments).length === 0
  ) {
    return <>No information to display.</>;
  }

  const renderLabel = (prefix: string, pad: number) => (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, id, percent } = props;
    if (percent <= 0.04) return null;
    let fontSize = 14;
    let fontWeight = "normal";
    if (percent < .05) fontSize = 10;
    else if (percent < .1) fontSize = 12;
    else {
      fontSize = 14;
      fontWeight = "bold";
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;

    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={fontWeight}
      >
        {prefix}: {id.toString().padStart(pad, '0')}
      </text>
    );
  };

  const width = 800;
  const height = 800;
  const maxRadius = Math.min(width, height) / 2;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            content={<LedgerPieTooltip />}
          />
          <Pie
            data={deptData}
            dataKey="value"
            nameKey="name"
            innerRadius={maxRadius * 0.16}
            outerRadius={maxRadius * 0.44}
            label={renderLabel('Dpt', 6)}
            onMouseEnter={entry => setHovered(entry as PieRow)}
            onMouseLeave={() => setHovered(null)}
            shape={StableSector}
            isAnimationActive={false}
          >
            {deptData.map((entry, index) => (<Cell key={`dept-${entry.id}`} fill={colors[index % colors.length]} />))}
          </Pie>

          <Pie
            data={acctData}
            dataKey="value"
            nameKey="name"
            innerRadius={maxRadius * 0.48}
            outerRadius={maxRadius * 0.72}
            label={renderLabel('Act', 5)}
            onMouseEnter={entry => setHovered(entry as PieRow)}
            onMouseLeave={() => setHovered(null)}
            shape={StableSector}
            isAnimationActive={false}
          >
            {acctData.map((entry, index) => (<Cell key={`acct-${entry.id}`} fill={colors[index % colors.length]} />))}
          </Pie>

          <Pie
            data={vendData}
            dataKey="value"
            nameKey="name"
            innerRadius={maxRadius * 0.76}
            outerRadius={maxRadius * 1.0}
            label={renderLabel('Vnd', 6)}
            onMouseEnter={entry => setHovered(entry as PieRow)}
            onMouseLeave={() => setHovered(null)}
            shape={StableSector}
            isAnimationActive={false}
          >
            {vendData.map((entry, index) => (<Cell key={`vend-${entry.id}`} fill={colors[index % colors.length]} />))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};


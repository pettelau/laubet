import React from "react";

import {
  SimplePieChartProps,
  PositiveAndNegativeBarChartProps,
  SuccessRateData,
} from "../../types";

import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@mui/material";

const COLORS = ["#303C6C", "#00C49F"];

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          dataKey="value"
          isAnimationActive={false}
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label={(entry) => `${entry.name} - ${entry.value}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: string | number }[];
  label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`Antall kort : ${label}`}</p>
        <p className="value">{`Gj.snitt forskjell : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export const PositiveAndNegativeBarChart: React.FC<
  PositiveAndNegativeBarChartProps
> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        stackOffset="sign"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" stackId="stack">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.value < 0 ? COLORS[0] : COLORS[1]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const RADIAN = Math.PI / 180;
const data = [
  { name: "A", color: COLORS[0] },
  { name: "B", color: COLORS[1] },
];
const total = 10; // -5 to 5

const cx = 150;
const cy = 200;
const iR = 50;
const oR = 100;

const needle = (
  value: number,
  cx: number,
  cy: number,
  iR: number,
  oR: number,
  color: string
) => {
  const ang = 180 - 180 * ((value + 5) / total); // Transform the value range from [-5,5] to [0,180]
  const length = (iR + 2 * oR) / 3;
  const sin = Math.sin(-RADIAN * ang);
  const cos = Math.cos(-RADIAN * ang);
  const r = 5;
  const x0 = cx;
  const y0 = cy;
  const xba = x0 + r * sin;
  const yba = y0 - r * cos;
  const xbb = x0 - r * sin;
  const ybb = y0 + r * cos;
  const xp = x0 + length * cos;
  const yp = y0 + length * sin;

  return [
    <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" />,
    <path
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="none"
      fill={color}
    />,
  ];
};

export const GaugeWithNeedle: React.FC<{ value: number }> = ({ value }) => {
  return (
    <PieChart width={400} height={200}>
      <Pie
        dataKey="value"
        startAngle={180}
        endAngle={0}
        data={data.map((d) => ({ ...d, value: total / data.length }))}
        cx={cx}
        cy={cy}
        innerRadius={iR}
        outerRadius={oR}
        fill="#8884d8"
        stroke="none"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      {needle(value, cx, cy, iR, oR, "#d0d000")}
    </PieChart>
  );
};

export const SuccessRates: React.FC<{ successRateData: SuccessRateData }> = ({
  successRateData,
}) => {
  // const successRateData: SuccessRateData = {
  //   2: { 0: 55, 1: 63, 2: 44 },
  //   3: { 0: 44, 1: 68, 2: 32, 3: 33 },
  //   4: { 0: 58, 1: 77, 2: 44, 3: 30, 4: 38 },
  //   5: { 0: 60, 1: 70, 2: 50, 3: 40, 4: 30, 5: 20 },
  //   6: { 0: 65, 1: 75, 2: 55, 3: 45, 4: 35, 5: 25, 6: 15 },
  //   7: {
  //     0: 66,
  //     1: 76,
  //     2: 56,
  //     3: 46,
  //     4: 36,
  //     5: 26,
  //     6: 16,
  //     7: 10,
  //   },
  //   8: {
  //     0: 67,
  //     1: 77,
  //     2: 57,
  //     3: 47,
  //     4: 37,
  //     5: 27,
  //     6: 17,
  //     7: 11,
  //     8: 9,
  //   },
  //   9: {
  //     0: 68,
  //     1: 78,
  //     2: 58,
  //     3: 48,
  //     4: 38,
  //     5: 28,
  //     6: 18,
  //     7: 12,
  //     8: 10,
  //     9: 8,
  //   },
  //   10: {
  //     0: 69,
  //     1: 79,
  //     2: 59,
  //     3: 49,
  //     4: 39,
  //     5: 29,
  //     6: 19,
  //     7: 13,
  //     8: 11,
  //     9: 9,
  //     10: 7,
  //   },
  //   11: {
  //     0: 70,
  //     1: 80,
  //     2: 60,
  //     3: 50,
  //     4: 40,
  //     5: 30,
  //     6: 20,
  //     7: 14,
  //     8: 12,
  //     9: 10,
  //     10: 8,
  //     11: 6,
  //   },
  //   12: {
  //     0: 71,
  //     1: 81,
  //     2: 61,
  //     3: 51,
  //     4: 41,
  //     5: 31,
  //     6: 21,
  //     7: 15,
  //     8: 13,
  //     9: 11,
  //     10: 9,
  //     11: 7,
  //     12: 5,
  //   },
  //   13: {
  //     0: 72,
  //     1: 82,
  //     2: 62,
  //     3: 52,
  //     4: 42,
  //     5: 32,
  //     6: 22,
  //     7: 16,
  //     8: 14,
  //     9: 12,
  //     10: 10,
  //     11: 8,
  //     12: 6,
  //     13: 4,
  //   },
  // };

  // const successRateData: SuccessRateData = {
  //   "2": {
  //     "0": 75.0,
  //     "1": 0.0,
  //     "2": 100.0,
  //   },
  //   "3": {
  //     "0": 80.0,
  //     "1": 50.0,
  //     "2": 100.0,
  //   },
  //   "4": {
  //     "0": 75.0,
  //     "1": 50.0,
  //     "2": 100.0,
  //     "4": 100.0,
  //   },
  //   "5": {
  //     "0": 75.0,
  //     "1": 100.0,
  //     "2": 0.0,
  //     "4": 100.0,
  //   },
  //   "6": {
  //     "0": 66.67,
  //     "2": 100.0,
  //     "3": 50.0,
  //     "4": 50.0,
  //   },
  //   "7": {
  //     "0": 100.0,
  //     "3": 100.0,
  //     "4": 50.0,
  //   },
  //   "8": {
  //     "0": 100.0,
  //     "1": 100.0,
  //     "4": 100.0,
  //     "5": 0.0,
  //   },
  //   "9": {
  //     "0": 0.0,
  //     "1": 100.0,
  //     "5": 100.0,
  //   },
  //   "10": {
  //     "1": 100.0,
  //     "3": 50.0,
  //     "4": 100.0,
  //   },
  //   "11": {
  //     "2": 100.0,
  //     "4": 100.0,
  //     "7": 0.0,
  //   },
  //   "12": {
  //     "0": 50.0,
  //     "3": 100.0,
  //     "5": 0.0,
  //   },
  //   "13": {
  //     "0": 40.0,
  //     "2": 100.0,
  //     "4": 50.0,
  //   },
  // };

  const numberOfDIfferentTricks = Object.keys(successRateData).length;
  const numberOfRows = numberOfDIfferentTricks + 1;

  const rowKeys = Object.keys(successRateData).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const getColor = (value: number) => {
    let red = 255;
    let green = Math.floor(255 * (value / 100));

    if (value > 50) {
      red = Math.floor(255 * ((100 - value) / 50));
    }

    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <>
      <Table>
        {Array.from({ length: numberOfRows + 1 }, (_, index) => (
          <TableRow>
            <TableCell sx={{ backgroundColor: "blanchedalmond" }}>
              <b>{numberOfRows - index}</b>
            </TableCell>
            {rowKeys.map((rowKey, rowIndex) => {
              console.log(numberOfRows - index);
              if (Number(rowKey) >= numberOfRows - index) {
                return (
                  <TableCell
                    sx={{
                      color: "white",
                      backgroundColor: getColor(
                        successRateData[Number(rowKey)][numberOfRows - index]
                      ),
                    }}
                  >
                    {/* {successRateData[numberOfRows - index][0]} */}
                    {/* {rowKey} <br />
                    {rowIndex} <br />
                    {index} <br />
                    {numberOfRows - index} */}
                    {successRateData[Number(rowKey)][numberOfRows - index]}
                  </TableCell>
                );
              } else {
                return <TableCell>-</TableCell>;
              }
            })}
          </TableRow>
        ))}
        <TableRow sx={{ backgroundColor: "blanchedalmond" }}>
          <TableCell></TableCell>
          {rowKeys.map((rowKey, rowIndex) => {
            return (
              <TableCell>
                <b>{rowKey}</b>
              </TableCell>
            );
          })}
        </TableRow>
      </Table>
    </>
  );
};

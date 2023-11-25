import React from "react";

import {
  SimplePieChartProps,
  PositiveAndNegativeBarChartProps,
  SuccessRateData,
  PlayerEarnings,
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
  TableBody,
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
      <Table sx={{ maxWidth: 500 }}>
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
                    {successRateData[Number(rowKey)][numberOfRows - index] !==
                    undefined ? (
                      successRateData[Number(rowKey)][
                        numberOfRows - index
                      ].toFixed(0)
                    ) : (
                      <div style={{ color: "black" }}>-</div>
                    )}
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

export const PlayerEarningsTable: React.FC<{
  playerEarnings: PlayerEarnings;
}> = ({ playerEarnings }) => {
  const earningsArray = Object.entries(playerEarnings);

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={10}>
              <b>#</b>
            </TableCell>
            <TableCell>
              <b>Spiller</b>
            </TableCell>
            <TableCell align="right">
              <b>Balanse</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {earningsArray.map(([nickname, earnings], index: number) => (
            <TableRow key={nickname}>
              <TableCell component="th" scope="row">
                {index +1}.
              </TableCell>
              <TableCell component="th" scope="row">
                {nickname}
              </TableCell>
              <TableCell align="right">{earnings} kr</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

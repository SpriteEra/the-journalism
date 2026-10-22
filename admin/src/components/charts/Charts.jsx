import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Chart colours come from the design tokens (styles/theme.css), so charts follow light / dark automatically. */
export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const axis = { stroke: "var(--fg-faint)", fontSize: 12, tickLine: false, axisLine: false };

function Tip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-fg">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-fg-muted">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill }} />{p.name}: <b className="text-fg">{Number(p.value).toLocaleString("en-IN")}{unit}</b>
        </p>
      ))}
    </div>
  );
}

/** series = [{ key, name }] ; data = [{ x, key1, key2 }] */
export function TrendChart({ data, series, xKey = "bucket", height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[i]} stopOpacity={0.28} /><stop offset="100%" stopColor={SERIES[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} minTickGap={24} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ stroke: "var(--line-strong)" }} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--fg-subtle)" }} />}
        {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={SERIES[i]} strokeWidth={2} fill={`url(#g-${s.key})`} />)}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranking bars. data=[{name, value}] */
export function RankBars({ data, valueKey = "value", nameKey = "name", height, color = SERIES[0], label = "Value" }) {
  const h = height || Math.max(180, data.length * 34 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey={nameKey} width={110} {...axis} tickFormatter={(v) => (String(v).length > 16 ? `${String(v).slice(0, 15)}…` : v)} />
        <Tooltip content={<Tip />} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey={valueKey} name={label} fill={color} radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
          {data.map((d, i) => <Cell key={d.name} fill={SERIES[i % SERIES.length]} />)}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--fg-subtle)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** weekday × hour heat map (analytics.heatmap) */
export function Heatmap({ grid }) {
  const max = Math.max(1, ...grid.flat().map((c) => c.views));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="ml-10 grid grid-cols-24 gap-0.5 text-[10px] text-fg-faint" style={{ gridTemplateColumns: "repeat(24, minmax(0,1fr))" }}>
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center">{h % 3 === 0 ? h : ""}</span>)}
        </div>
        {grid.map((row, d) => (
          <div key={d} className="mt-0.5 flex items-center gap-2">
            <span className="w-8 text-xs text-fg-subtle">{days[d]}</span>
            <div className="grid flex-1 gap-0.5" style={{ gridTemplateColumns: "repeat(24, minmax(0,1fr))" }}>
              {row.map((c) => (
                <span key={c.hour} title={`${days[d]} ${c.hour}:00 – ${c.articles} stories, ${c.views} reads`} className="aspect-square rounded-[3px] bg-primary" style={{ opacity: c.views ? 0.12 + (c.views / max) * 0.88 : 0.06 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Vertical columns. series = [{ key, name }], data = [{ [xKey]: label, key1: n }] — stacked when `stacked`. */
export function ColumnChart({ data, series, xKey = "name", height = 240, stacked, tickFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} minTickGap={12} tickFormatter={tickFormatter} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "var(--surface-2)" }} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--fg-subtle)" }} />}
        {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} stackId={stacked ? "a" : undefined} fill={s.color || SERIES[i]} radius={stacked ? 0 : [6, 6, 0, 0]} maxBarSize={32} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Two-axis-free multi line chart (up to 6 series). */
export function LinesChart({ data, series, xKey = "name", height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} minTickGap={24} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ stroke: "var(--line-strong)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--fg-subtle)" }} />
        {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color || SERIES[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Single-value gauge, 0–100 (consistency, approval rate …). */
export function Gauge({ value = 0, label, color = SERIES[2], height = 180 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: v, fill: color }]} startAngle={210} endAngle={-30}>
          <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "var(--surface-3)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div><p className="text-xl sm:text-3xl font-semibold text-fg">{Math.round(v)}%</p>{label && <p className="text-[10px] sm:text-xs text-fg-subtle">{label}</p>}</div>
      </div>
    </div>
  );
}

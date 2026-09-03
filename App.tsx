import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import './style/App.css'

// ---- Signature visual: an animated trend line with settling data points ----
// Stands in for the reference's particle field, but built from the site's
// own subject matter (a drawn data series) instead of decorative stars.
function LiveChart() {
  const points: [number, number][] = [
    [10, 150], [55, 120], [100, 135], [145, 90],
    [190, 105], [235, 60], [280, 78], [325, 40], [370, 55],
  ];
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");
  const area = `${path} L 370 190 L 10 190 Z`;

  return (
    <svg viewBox="0 0 390 200" className="chart-svg" role="img" aria-label="Animated data trend">
      <defs>
        <linearGradient id="areaFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8A54B" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#E8A54B" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* baseline grid */}
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="10" y1={y} x2="370" y2={y} className="grid-line" />
      ))}

      <path d={area} fill="url(#areaFade)" className="area-fill" />
      <path d={path} className="trend-line" />

      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="3.5"
          className="trend-dot"
          style={{ animationDelay: `${0.9 + i * 0.09}s` }}
        />
      ))}
    </svg>
  );
}

// ---- Reusable chart cards (recharts) ----
const ACCENT = "#E8963C";
const GRID_LINE = "#242830";
const TEXT_MUTED = "#8A8F98";
const PIE_SHADES = ["#E8963C", "#C97A28", "#F2B36B", "#8A5A1E", "#FAD9A8"];

const TOOLTIP_STYLE = {
  background: "#1A1E23",
  border: "none",
  borderRadius: "8px",
} as const;

type Datum = Record<string, string | number>;

interface ChartCardProps {
  title: string;
  data: Datum[];
  statLabel?: string;
  statValue?: string;
}

function CardHeader({ title, statLabel, statValue }: { title: string; statLabel?: string; statValue?: string }) {
  return (
    <div className="chart-card-head">
      <span>{title}</span>
      {statValue && (
        <span className="chart-stat">
          <span className="chart-stat-label">{statLabel} </span>
          <span className="chart-stat-value">{statValue}</span>
        </span>
      )}
    </div>
  );
}

// ---------- Line chart (matches the reference image) ----------
export function LineChartCard({ title, data, statLabel = "trend", statValue }: ChartCardProps) {
  return (
    <div className="chart-card">
      <CardHeader title={title} statLabel={statLabel} statValue={statValue} />
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="x" hide />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: TEXT_MUTED }} />
          <Area
            type="monotone"
            dataKey="y"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#lineFill)"
            dot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Bar chart ----------
export function BarChartCard({ title, data, statLabel, statValue }: ChartCardProps) {
  return (
    <div className="chart-card">
      <CardHeader title={title} statLabel={statLabel} statValue={statValue} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis
            dataKey="category"
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            axisLine={{ stroke: GRID_LINE }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(232,150,60,0.08)" }}
          />
          <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Histogram (zero gap = reads as continuous bins) ----------
export function HistogramCard({ title, data, statLabel, statValue }: ChartCardProps) {
  return (
    <div className="chart-card">
      <CardHeader title={title} statLabel={statLabel} statValue={statValue} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap={0}>
          <XAxis
            dataKey="category"
            tick={{ fill: TEXT_MUTED, fontSize: 10 }}
            axisLine={{ stroke: GRID_LINE }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis hide />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill={ACCENT} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Pie chart ----------
export function PieChartCard({ title, data, statLabel, statValue }: ChartCardProps) {
  return (
    <div className="chart-card">
      <CardHeader title={title} statLabel={statLabel} statValue={statValue} />
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="category"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={String(entry.category)}
                fill={PIE_SHADES[i % PIE_SHADES.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Scatter chart ----------
export function ScatterChartCard({ title, data, statLabel, statValue }: ChartCardProps) {
  return (
    <div className="chart-card">
      <CardHeader title={title} statLabel={statLabel} statValue={statValue} />
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart>
          <XAxis
            dataKey="x"
            type="number"
            tick={{ fill: TEXT_MUTED, fontSize: 10 }}
            axisLine={{ stroke: GRID_LINE }}
            tickLine={false}
          />
          <YAxis dataKey="y" hide />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={TOOLTIP_STYLE} />
          <Scatter data={data} fill={ACCENT} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Demo data for the landing-page preview ----
const trendData: Datum[] = [
  { x: "Jan", y: 34 }, { x: "Feb", y: 38 }, { x: "Mar", y: 31 },
  { x: "Apr", y: 45 }, { x: "May", y: 42 }, { x: "Jun", y: 52 },
  { x: "Jul", y: 49 }, { x: "Aug", y: 61 }, { x: "Sep", y: 58 },
  { x: "Oct", y: 67 }, { x: "Nov", y: 72 }, { x: "Dec", y: 79 },
];

const categoryData: Datum[] = [
  { category: "CSV", count: 48 }, { category: "Excel", count: 36 },
  { category: "SQL", count: 27 }, { category: "JSON", count: 19 },
  { category: "Parquet", count: 14 }, { category: "TSV", count: 9 },
];

const histogramData: Datum[] = [
  { category: "0–5", count: 12 }, { category: "6–10", count: 31 },
  { category: "11–15", count: 44 }, { category: "16–20", count: 38 },
  { category: "21–25", count: 26 }, { category: "26–30", count: 17 },
  { category: "31+", count: 8 },
];

const sourceData: Datum[] = [
  { category: "Direct", count: 41 }, { category: "Referral", count: 28 },
  { category: "Organic", count: 19 }, { category: "Paid", count: 12 },
];

const scatterData: Datum[] = [
  { x: 1, y: 18 }, { x: 2, y: 24 }, { x: 3, y: 17 }, { x: 4, y: 31 },
  { x: 5, y: 38 }, { x: 6, y: 27 }, { x: 7, y: 44 }, { x: 8, y: 39 },
  { x: 9, y: 52 }, { x: 10, y: 47 }, { x: 11, y: 61 }, { x: 12, y: 55 },
  { x: 13, y: 68 }, { x: 14, y: 72 },
];

const activeUserData: Datum[] = [
  { x: "Mon", y: 240 }, { x: "Tue", y: 285 }, { x: "Wed", y: 262 },
  { x: "Thu", y: 310 }, { x: "Fri", y: 348 }, { x: "Sat", y: 290 },
  { x: "Sun", y: 335 },
];

// ---- Footer ----
const footerSections = [
  {
    title: "Company",
    links: ["About us", "Product updates", "Terms of service", "Privacy policy", "Report a bug"],
  },
  {
    title: "Product",
    links: ["Dashboard", "Upload data", "Chart gallery", "Ask AI"],
  },
  {
    title: "Resources",
    links: ["Help center", "Getting started guide", "Features overview", "Blog"],
  },
  {
    title: "Use cases",
    links: ["Students", "Analysts", "Researchers"],
  },
  {
    title: "Alternatives",
    links: ["Tableau alternatives", "Power BI alternatives", "Excel charting alternatives"],
  },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-sections">
        {footerSections.map((section) => (
          <div key={section.title} className="footer-column">
            <h4 className="footer-heading">{section.title}</h4>
            <ul className="footer-links">
              {section.links.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Your project name. All rights reserved.</span>
        <span>contact@yourproject.com</span>
      </div>
    </footer>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const chartGridRef = useRef<HTMLDivElement>(null);
  const [chartsVisible, setChartsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Pop the chart cards in the first time the grid scrolls into view
  useEffect(() => {
    const el = chartGridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`page ${ready ? "is-ready" : ""}`}>
      <nav className="nav">
        <div className="brand">
          <span className="brand-mark" />
          <span className="display">Contour</span>
        </div>
        <ul className="nav-links">
          <li><a href="#">Product</a></li>
          <li><a href="#">Workflow</a></li>
          <li><a href="#">Pricing</a></li>
        </ul>
        <button className="btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
      </nav>

      <div className="hero">
        <div className="hero-copy">
          <h1 className="headline display">
            See what your data has been trying to tell you
          </h1>
          <p className="subhead">
            Upload your data and Get cleaned columns,
            statistical summaries, and interactive charts back — no notebook,
            no boilerplate.
          </p>
          <div className="cta-row">
            <button className="btn-primary">Try it with sample data</button>
            <button className="btn-secondary">See how it works</button>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel-head">
            <span className="chart-title">monthly_revenue.csv</span>
            <span className="chart-value">trend <span>+18.4%</span></span>
          </div>
          <LiveChart />
        </div>
      </div>

      <div className="strip">
        <div className="strip-item">
          <h3>Reads what you already have</h3>
          <p>CSV, Excel, and SQL exports go in as-is — column typing and cleanup happen automatically.</p>
        </div>
        <div className="strip-item">
          <h3>Built on pandas, not a black box</h3>
          <p>Every transform maps to a readable pandas operation, so you can see exactly what ran.</p>
        </div>
        <div className="strip-item">
          <h3>Charts you can hand off</h3>
          <p>Export any view as a static image or an embeddable chart for a report or a deck.</p>
        </div>
      </div>
      <div className="marquee-container">
        <div className="marquee-track">
          <div className="floating-feature"><h3>Upload history</h3><p>Every dataset you've analyzed, saved and revisitable anytime.</p></div>
          <div className="floating-feature"><h3>Ask the AI</h3><p>Built-in chatbot to dig into trends and patterns in your data.</p></div>
          <div className="floating-feature"><h3>Smart chart suggestions</h3><p>AI picks the chart type that actually fits your data.</p></div>
          <div className="floating-feature"><h3>Upload history</h3><p>Every dataset you've analyzed, saved and revisitable anytime.</p></div>
          <div className="floating-feature"><h3>Ask the AI</h3><p>Built-in chatbot to dig into trends and patterns in your data.</p></div>
          <div className="floating-feature"><h3>Smart chart suggestions</h3><p>AI picks the chart type that actually fits your data.</p></div>
        </div>
      </div>
      <div className="charts-section">
        <h1 className="display">Visualize Your Data</h1>
        <div ref={chartGridRef} className={`chart-grid ${chartsVisible ? "is-visible" : ""}`}>
          <LineChartCard title="monthly_revenue.csv" data={trendData} statValue="+18.4%" />
          <BarChartCard title="uploads_by_format.csv" data={categoryData} statLabel="top" statValue="CSV" />
          <HistogramCard title="row_count_distribution.csv" data={histogramData} statLabel="peak" statValue="11–15" />
          <PieChartCard title="traffic_sources.csv" data={sourceData} statLabel="lead" statValue="Direct" />
          <ScatterChartCard title="session_vs_rows.csv" data={scatterData} statLabel="avg" statValue="4.2 min" />
          <LineChartCard title="daily_active_users.csv" data={activeUserData} statValue="+6.1%" />
        </div>
      </div>
      <div className="slogan">
        <h2 className="display">Stop staring at rows. Start seeing the story.</h2>
        <p>Upload once — Contour handles the cleanup, the charts, and the patterns in between.</p>
      </div>
      <Footer />
    </div>
  );
}
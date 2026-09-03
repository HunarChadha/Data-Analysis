import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

export type ChartEntry = { category: string; count: number };

// Colors follow the app-wide theme (src/style/App.css and the Login/Signup
// pages): charcoal surfaces with a warm amber accent.
const ACCENT = '#E8A54B';
const SURFACE = '#171B20';
const BORDER = '#262B32';
const TEXT = '#ECEEF1';
const MUTED = '#90979F';
const TOOLTIP_BG = '#1A1E23';

// Amber family shades, matching the pie palette used on the landing page.
const PIE_COLORS = ['#E8A54B', '#C97A28', '#F2B36B', '#8A5A1E', '#FAD9A8'];
// Fixed colors for binary (0/1) columns so the same value always keeps the
// same color across every pie on the dashboard. Dark/light ambers stay on
// theme while keeping the two values distinguishable.
const BINARY_COLORS: Record<string, string> = {'0': '#C97A28', '1': '#F2B36B'};

const TOOLTIP_STYLE = {
    backgroundColor: TOOLTIP_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    color: TEXT,
} as const;

function Barchart(data: ChartEntry[] | undefined, title?: string) {
    return (
        <div style={{width: '100%'}}>
            {title && <h3 style={{textAlign: 'center', margin: '0 0 0.5rem', color: TEXT}}>{title}</h3>}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{fill: MUTED, fontSize: 12}} axisLine={{stroke: BORDER}} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{fill: MUTED, fontSize: 12}} axisLine={{stroke: BORDER}} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: 'rgba(232, 165, 75, 0.08)'}} />
                    <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function Piechart(data: ChartEntry[] | undefined, title?: string) {
    return (
        <div style={{width: '100%'}}>
            {title && <h3 style={{textAlign: 'center', margin: '0 0 0.5rem', color: TEXT}}>{title}</h3>}
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Legend wrapperStyle={{color: MUTED, fontSize: 12}} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Pie data={data} dataKey="count" nameKey="category" outerRadius={100}
                         label={{fill: TEXT, fontSize: 12}} labelLine={{stroke: BORDER}}>
                        {(data ?? []).map((entry, i) => (
                            <Cell key={i} fill={BINARY_COLORS[entry.category] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// Visible fallback so empty/malformed chart data shows up instead of leaving a blank hole
function Emptychart(title?: string) {
    return (
        <div style={{
            width: '100%', height: 300, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px dashed ${BORDER}`, borderRadius: 8,
        }}>
            <p style={{color: MUTED, margin: 0}}>No chartable data{title ? ` for "${title}"` : ''}</p>
        </div>
    );
}

export {Barchart, Piechart, Emptychart};
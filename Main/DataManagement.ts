import type {ReactNode} from "react"
import {Barchart, Piechart, Emptychart, type ChartEntry} from "./ChartTypes.tsx"

const chartsData: ReactNode[] = []

function rows(raw: any): any[] {
    return Array.isArray(raw) && Array.isArray(raw[0]) ? raw[0] : raw;
}

function normalize(raw: any): ChartEntry[] {
    return rows(raw)
        .filter((row: any) => row && typeof row === 'object')
        .map((row: any): ChartEntry => {
            if ('others' in row) return { category: 'Others', count: Number(row.others) || 0 };
            if (row.category !== undefined) return { category: String(row.category), count: Number(row.count) || 0 };
            const catKey = Object.keys(row).find(k => k !== 'counts') ?? '';
            return { category: String(row[catKey] ?? ''), count: Number(row.counts) || 0 };
        });
}

function chartTitle(raw: any): string | undefined {
    const row = rows(raw).find((r: any) => r && typeof r === 'object');
    if (!row) return undefined;
    if (typeof row.col === 'string') return row.col;   // histogram carries its column name
    return Object.keys(row).find(k => k !== 'counts' && k !== 'others'); // bar/pie: key IS the column name
}

function selectChartType(chart_type: string, chart_data: any) {
    switch (chart_type) {
        case "bar":
        case "histogram": {
            const entries = normalize(chart_data);
            const title = chartTitle(chart_data);
            chartsData.push(entries.length ? Barchart(entries, title) : Emptychart(title));
            break;
        }
        case "pie": {
            const entries = normalize(chart_data);
            const title = chartTitle(chart_data);
            chartsData.push(entries.length ? Piechart(entries, title) : Emptychart(title));
            break;
        }
    }
}

function manage_data(results: any) {
    chartsData.length = 0; // rebuild fresh each call — no duplicates across re-renders/navigations
    for (const entry of results['results']) {
        for (const [key, value] of Object.entries(entry)) {
            selectChartType(key, value);
        }
    }
}

export {manage_data, chartsData};
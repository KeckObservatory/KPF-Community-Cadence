import React from 'react';
import Plot from 'react-plotly.js';
import dayjs from 'dayjs';
import { PlotData, Layout } from 'plotly.js';

// Type definitions
interface Value {
    date: string;
    percent_complete: number;
}
interface Lines {
    values: Value[];
    name: string;
    total_observations_requested: number;
}

interface Starinfo {
    dec: number;
    ra: number;
    exptime?: number;
    gaia_id?: string;
    gmag?: number | string;
    jmag?: number | string;
    n_exp?: number;
    n_inter_max?: number;
    n_intra_max?: number;
    n_intra_min?: number;
    pmdec: number | string;
    pmra: number | string;
    program_code: string;
    starname: string;
    tau_inter: number;
    tau_intra: number;
    teff?: number;
    unique_id: string;
    weather_band?: number;
}

export interface COFChartProps {
    width?: number;
    height?: number;
    startdate: string;
    enddate: string;
    date: string;
    starinfo: Starinfo[];
    lines: Lines[];
}

// Color constants
const GRAY = 'rgb(210,210,210)';
const CLEAR = 'rgba(255,255,255,1)';
const DEFAULT_LABEL_SIZE = 38;

const generate_dates_array = (start: string, end: string): string[] => {
    const dates: string[] = [];
    let current = dayjs(start);
    const last = dayjs(end);
    while (current.isBefore(last) || current.isSame(last, 'day')) {
        dates.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
    }
    return dates;
}

export const COFChart: React.FC<COFChartProps> = ({
    startdate,
    enddate,
    date,
    starinfo,
    lines,
    width = 1400,
    height = 1000,
}) => {
    // Generate even burn rate line
    const generateBurnLine = (): number[] => {
        const burnLine: number[] = [];
        // Generate array of dates from startdate to enddate (inclusive)
        const dates = generate_dates_array(startdate, enddate);
        const length = dates.length;

        for (let idx = 0; idx < length; idx++) {
            const burnRate = (100 * idx) / (length - 1);
            burnLine.push(Math.round(burnRate * 100) / 100); // Round to 2 decimal places
        }

        return burnLine;
    };

    // Calculate total COF data
    const calculateTotalCofData = () => {
        const dates = generate_dates_array(startdate, enddate);
        const cumeObserve = new Array(dates.length).fill(0);
        let maxValue = 0;

        lines.forEach(line => {
            line.values.forEach((obs) => {
                const idx = dates.indexOf(obs.date);
                if (idx !== -1) {
                    cumeObserve[idx] += obs.percent_complete;
                }
            });
            maxValue += line.total_observations_requested;
        });

        const cumeObservePct = cumeObserve.map(obs => (obs / maxValue) * 100);

        return { cumeObservePct, maxValue };
    };

    const burnLine = generateBurnLine();
    const { cumeObservePct, maxValue } = calculateTotalCofData();
    const dates = generate_dates_array(startdate, enddate);

    // Create plot data
    const plotData: PlotData[] = [];

    // Add even burn rate line
    const trace = {
        x: dates,
        y: burnLine,
        mode: 'lines',
        line: {
            color: 'black',
            width: 2,
            dash: 'dash'
        },
        name: 'Even Burn Rate',
        hovertemplate: 'Date: %{x}<br>% Complete: %{y}<extra></extra>',
        type: 'scatter'
    } as PlotData;
    plotData.push(trace);

    // Add Total trace
    if (lines.length > 0) {
        const trace = {
            x: dates,
            y: cumeObservePct,
            mode: 'lines',
            line: {
                // color: lines[0].program_color_rgb,
                width: 2
            },
            name: 'Total',
            hovertemplate: `Date: %{x}<br>% Complete: %{y}<br># Obs Requested: ${maxValue}<extra></extra>`,
            type: 'scatter'
        } as PlotData;
        plotData.push(trace);
    }

    // Add individual star traces
    lines.forEach((line, index) => {
        const star = starinfo[index];
        let percComplete = 0
        const y = dates.map(date => {
            const val = line.values.find(v => v.date === date)
            if (val) {
                percComplete = val.percent_complete || 0
            }
            return percComplete
        });
        const trace = {
            x: dates,
            y:  y,
            mode: 'lines',
            line: {
                // color: line.line_color_rgb,
                width: 2
            },
            name: line.name,
            hovertemplate: `${star.starname}<br>Date: %{x}<br>% Complete: %{y}<br># Obs Requested: ${line.total_observations_requested}<extra></extra>`,
            type: 'scatter'
        } as PlotData;
        plotData.push(trace);
    });

    // Create layout
    const layout: Partial<Layout> = {
        width,
        height,
        plot_bgcolor: GRAY,
        paper_bgcolor: CLEAR,
        xaxis: {
            title: {
                text: 'Calendar Date',
                font: { size: DEFAULT_LABEL_SIZE}
            },
            tickfont: { size: DEFAULT_LABEL_SIZE - 4 },
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            title: {
                text: 'Request % Complete',
                font: { size: DEFAULT_LABEL_SIZE}
            },
            tickfont: { size: DEFAULT_LABEL_SIZE - 4 },
            showgrid: false,
            zeroline: false
        },
        showlegend: true,
        legend: {
            orientation: 'h',
            x: 0.5,
            y: -0.15,
            xanchor: 'center',
            yanchor: 'top',
            bgcolor: 'rgba(255,255,255,0.7)',
            bordercolor: 'black',
            borderwidth: 1,
            font: { size: DEFAULT_LABEL_SIZE- 18 },
            itemsizing: 'constant',
            itemwidth: 30,
            groupclick: 'toggleitem',
            tracegroupgap: 5,
            traceorder: 'normal'
        },
        margin: {
            b: 200,
            t: 50,
            l: 100,
            r: 50
        },
        // Add vertical line for "today"
        shapes: [{
            type: 'line',
            x0: date,
            x1: date,
            y0: 0,
            y1: 1,
            yref: 'paper',
            line: {
                color: 'black',
                width: 2,
                dash: 'dash'
            }
        }],
        annotations: [{
            x: date,
            y: 1,
            yref: 'paper',
            text: 'Today',
            showarrow: false,
            yanchor: 'bottom',
            xanchor: 'left',
            font: { color: 'black' }
        }]
    };

    return (
        <Plot
            data={plotData}
            layout={layout}
            style={{ width: '100%', height: '100%' }}
        />
    );
};
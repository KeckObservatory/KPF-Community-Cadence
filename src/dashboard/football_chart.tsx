import React from 'react';
import Plot from 'react-plotly.js';
import { Layout, Shape, Annotations } from 'plotly.js';

// Type definitions based on the Python function
interface Program {
    dec: number;
    ra: number;
    starname: string;
    program_code: string;
}

export interface FootballChartProps {
    programs: Program[]
    dec_grid: number[][];
    ra_grid: number[][];
    nights_grid: number[][];
}

export const FootballChart: React.FC<FootballChartProps> = ({
    programs,
    dec_grid,
    ra_grid,
    nights_grid,
}) => {
    // Process star data
    const traces: Plotly.Data[] = [];
    const height = 600;
    const width = 900;

    // Add dummy contour for colorbar
    traces.push({
        type: 'heatmap',
        z: nights_grid,
        x: ra_grid[0].map(val => val - 180),
        y: dec_grid.map(row => row[0]),
        showscale: true,
        hoverongaps: false,
        colorscale: 'Greys',
        contours: {
            start: 70,
            end: 184,
            size: 10
        },
        opacity: 1, 
        colorbar: {
            title: 'Observable<br>Nights',
            titleside: 'top',
            x: -0.15, // Place on left of plot
            len: 0.75,
            thickness: 15,
            tickfont: { size: 12, color: 'white' } as Plotly.Font,
        }
    });

    programs.forEach((star: Program) => {
        traces.push({
            type: 'scattergeo',
            lon: [star.ra - 180],
            lat: [star.dec],
            mode: 'markers',
            name: star.starname,
            marker: {
                symbol: 'star',
                size: programs.length > 1 ? 6 : 20,
                color: star.program_code
            },
            text: `${star.starname} in ${star.program_code}`,
            hovertemplate: '%{text}<br>RA: %{lon:.2f}°, Dec: %{lat:.2f}°<extra></extra>'
        });
    });

    // Create layout
    const shapes: Partial<Shape>[] = [{
        type: 'circle',
        xref: 'paper',
        yref: 'paper',
        x0: 0.0,
        y0: 0.0,
        x1: 1.0,
        y1: 1.0,
        line: {
            color: 'black',
            width: 2
        }
    }];

    const annotations: Partial<Annotations>[] = [
        {
            text: 'RA (deg)',
            x: 0.5,
            y: -0.10,
            xref: 'paper',
            yref: 'paper',
            showarrow: false,
            font: { size: 14 }
        },
        {
            text: 'Dec (deg)',
            x: -0.07,
            y: 0.5,
            xref: 'paper',
            yref: 'paper',
            showarrow: false,
            textangle: "-90",
            font: { size: 14 }
        }
    ];

    const layout: Partial<Layout> = {
        geo: {
            projection: { type: 'mollweide' },
            showland: false,
            showcoastlines: false,
            showframe: false,
            bgcolor: 'rgba(0,0,0,0)',
            lonaxis: { showgrid: false },
            lataxis: { showgrid: false }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        width,
        height,
        xaxis: {
            showgrid: false,
            visible: true
        },
        yaxis: {
            showgrid: false,
            visible: true
        },
        shapes,
        annotations
    };

    return (
        <Plot
            data={traces}
            layout={layout}
        />
    );
};

import React from 'react'
import dayjs from "dayjs"
import * as util from './sky_view_util.tsx'
import Plot from 'react-plotly.js';
import { Layout } from 'plotly.js';
import { VizRow, DomeChartProps, TargetView } from './dome_chart.tsx'; //uses same props as DomeChart
import { telLatLngEl, LngLatEl, time_format } from './constants.tsx';


const make_2d_traces = (targetView: TargetView[], time_format: string, lngLatEl: LngLatEl) => {

    //target trajectory traces
    let traces: Partial<Plotly.Data>[] = []
    console.log('making traces for targetView', targetView)
    //get times

    let [az_path, alt_path] = [[] as number[], [] as number[]]
    let dates = [] as Date[]
    let texts: string[] = []
    targetView.forEach((tgtv: TargetView) => {

        tgtv.visibility.forEach((viz: VizRow) => {
            //if target is not exposing, skip
            if (tgtv.time_started && viz.datetime <= new Date(tgtv.time_started)) {
                return
            }
            if (tgtv.time_ended && viz.datetime >= new Date(tgtv.time_ended)) {
                return
            }
            let txt = ""
            txt += `<b>${tgtv.human_starname}</b><br>`
            txt += `Az: ${viz.az.toFixed(2)}<br>`
            txt += `El: ${viz.alt.toFixed(2)}<br>`
            txt += `HT: ${dayjs(viz.datetime).format(time_format)}<br>`
            txt += `UTC: ${dayjs(viz.datetime).utc().format(time_format)}<br>`
            txt += `Airmass: ${util.air_mass(viz.alt, lngLatEl.el).toFixed(2)}<br>`

            texts.push(txt)
            dates.push(viz.datetime)
            alt_path.push(viz.alt)
            az_path.push(viz.az)
        })
    })

        // Azimuth trace
        traces.push({
            x: dates,
            y: az_path,
            mode: 'lines+markers',
            marker: { color: 'indigo' },
            name: 'Azimuth',
            text: texts,
            hovertemplate: '%{text}<br>Az: %{y}',
            xaxis: 'x',
            yaxis: 'y',
            type: 'scatter'
        });

        // Elevation trace
        traces.push({
            x: dates,
            y: alt_path,
            mode: 'lines+markers',
            marker: { color: 'seagreen' },
            name: 'Elevation',
            text: texts,
            hovertemplate: '%{text}<br>Alt: %{y}',
            xaxis: 'x2',
            yaxis: 'y2',
            type: 'scatter'
        });

        console.log('az el traces:', traces)

    return traces
}


export const AzElChart: React.FC<DomeChartProps> = ({
    targetView,
}) => {
    const height = 600;
    const width = 900;
    const dates = targetView.length > 0 ? targetView[0].visibility.map(v => v.datetime) : [];
    console.log('adding az/el chart' )
    const traces = make_2d_traces(targetView, time_format, telLatLngEl.keck);

    let layout: Partial<Layout> = {} 

        layout = {
            height,
            width,
            // template: 'plotly_white',
            grid: {
                rows: 2,
                columns: 1,
                pattern: 'independent',
                // subplots: [['xy'], ['x2y2']]
            },
            annotations: [
                {
                    text: 'Azimuth Path',
                    font: { size: 16 },
                    showarrow: false,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.5,
                    y: 0.95,
                    xanchor: 'center',
                    yanchor: 'bottom'
                },
                {
                    text: 'Elevation Path',
                    font: { size: 16 },
                    showarrow: false,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.5,
                    y: 0.45,
                    xanchor: 'center',
                    yanchor: 'bottom'
                }
            ],
            xaxis: {
                domain: [0, 1],
                anchor: 'y',
                tickmode: 'array',
                showticklabels: false
            },
            yaxis: {
                domain: [0.55, 1],
                anchor: 'x',
                title: 'Azimuth (deg)'
            },
            xaxis2: {
                domain: [0, 1],
                anchor: 'y2',
                tickmode: 'array',
                // tickvals: obsTime,
                // ticktext: timeLabels,
                title: 'Time (UTC)'
            },
            yaxis2: {
                domain: [0, 0.45],
                anchor: 'x2',
                title: 'Altitude (deg)'
            },
            shapes: []
        };

        // // Add wrap line if specified
        // if (wrap !== undefined && wrap !== null) {
        //     layout.shapes?.push({
        //         type: 'line',
        //         x0: obsTime[0],
        //         x1: obsTime[obsTime.length - 1],
        //         y0: wrap,
        //         y1: wrap,
        //         line: {
        //             color: 'red',
        //             dash: 'dash'
        //         },
        //         xref: 'x',
        //         yref: 'y'
        //     });

        //     // Add wrap annotation
        //     baseLayout.annotations?.push({
        //         x: obsTime[obsTime.length - 1],
        //         y: wrap,
        //         text: `Wrap = ${wrap}`,
        //         showarrow: false,
        //         font: { color: 'red' },
        //         xref: 'x',
        //         yref: 'y'
        //     });
        // }

        // Add observation interval rectangles
        for (let i = 0; i < dates.length - 1; i += 2) {
            // Azimuth subplot rectangle
            layout.shapes?.push({
                type: 'rect',
                x0: dates[i],
                x1: dates[i + 1],
                y0: 0,
                y1: 1,
                fillcolor: 'orange',
                opacity: 0.2,
                layer: 'below',
                line: { width: 0 },
                xref: 'x',
                yref: 'y domain'
            });

            // Elevation subplot rectangle
            layout.shapes?.push({
                type: 'rect',
                x0: dates[i],
                x1: dates[i + 1],
                y0: 0,
                y1: 1,
                fillcolor: 'orange',
                opacity: 0.2,
                layer: 'below',
                line: { width: 0 },
                xref: 'x2',
                yref: 'y2 domain'
            });
        }

    return (
        <Plot
            data={traces}
            layout={layout}
        />
    );
};
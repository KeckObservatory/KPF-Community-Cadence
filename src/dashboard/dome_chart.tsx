import dayjs from "dayjs"
import * as util from './sky_view_util.tsx'
import Plot from "react-plotly.js"
import { LngLatEl, GeoModel } from "./constants.tsx"
import { alt_az_observable, reason_to_color_mapping } from "./target_viz_chart.tsx"
import { tel_geometry, STEP_SIZE, telLatLngEl, time_format } from "./constants.tsx"


export type BlockReason = 'Deck Blocking' | 'Below Horizon' | 'Above Tracking Limits'

export interface VizRow {
    datetime: Date
    alt: number
    az: number
    observable: boolean
    reasons: BlockReason[]
}

export interface DomeTarget {
    ra: number,
    dec: number,
    exptime: number,
    expwithreadout: number,
    index: number,
    name: string,
    orderInNight: number[],
    priority: number,
    shots: number,
    target_name: string,
    te: number,
    tend: number[],
    tl: number,
    visits: number
}

export type Dome = "K1" | "K2"
const DOME = 'K1'

const height = 500
const width = 500



export interface TargetView extends DomeTarget {
    dome: Dome,
    date: Date,
    ra_deg: number,
    dec_deg: number,
    visibility: VizRow[],
    visibilitySum: number
}

const traceRadiusLimit = 90 - 2 //ignore points greater than the dome radius

interface DomeChartProps {
    targets: DomeTarget[]
    obsdate: string
    showCurrLoc: boolean
    times: Date[]
    time: Date 
}

export const moon_color = '#702963'

const make_disk_polar = (r1: number, r2: number, th1: number, th2: number) => {

    let rr1 = [] as number[]
    let tt1 = [] as number[]
    let rr2 = [] as number[]
    let tt2 = [] as number[]
    for (let th = th1; th < th2; th++) {
        rr1.push(r1)
        tt1.push(th)
        rr2.push(r2)
        tt2.push(th)
    }

    const r = [...rr1, ...rr2.reverse(), rr1[0]]
    const theta = [...tt1, ...tt2.reverse(), tt1[0]]

    const pTrace: Partial<Plotly.PlotData | any> = {
        r: r,
        theta: theta,
        opacity: .5,
        color: "rgb(0,0,0)",
        line: {
            color: "rgb(0,0,0)",
            width: 0
        },
        type: 'scatterpolar',
        fill: 'toself',
        mode: 'lines',
        showlegend: false,
        name: 'telescope bottom limit',
        hoverinfo: "none",
        hovermode: false,
    }
    return pTrace
}

const make_2d_traces = (targetView: TargetView[], showCurrLoc: boolean, time: Date,
    time_format: string, KG: GeoModel, lngLatEl: LngLatEl
) => {

    //target trajectory traces
    let traces: Partial<Plotly.Data>[] = []
    targetView.forEach((tgtv: TargetView, idx: number) => {
        let [rr, tt] = [[] as number[], [] as number[]]
        const texts: string[] = []
        let color: string[] = []
        tgtv.visibility.forEach((viz: VizRow) => {
            let txt = ""
            txt += `Az: ${viz.az.toFixed(2)}<br>`
            txt += `El: ${viz.alt.toFixed(2)}<br>`
            txt += `HT: ${dayjs(viz.datetime).format(time_format)}<br>`
            txt += `Visible for: ${tgtv.visibilitySum.toFixed(2)} hours<br>`
            txt += viz.observable ? '' : `<br>Not Observable: ${viz.reasons.join(', ')}`
            const radius = 90 - viz.alt
            if (radius > traceRadiusLimit + 1) return //ignore points greater than the radius 
            texts.push(txt)
            color.push(reason_to_color_mapping(viz.reasons))
            rr.push(90 - viz.alt)
            tt.push(viz.az)
            return txt
        })

        const trace = {
            r: rr,
            theta: tt,
            text: texts,
            hovorinfo: 'text',
            hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
            marker: {
                color: util.colors[idx % util.colors.length],
                opacity: 0,
                size: 4
            },
            line: {
                color: util.colors[idx % util.colors.length],
                width: 5
            },
            textposition: 'top left',
            type: 'scatterpolar',
            mode: 'lines+markers',
            namelength: -1,
            name: tgtv.target_name
        }
        traces.push(trace as Plotly.Data)
    })

    if (showCurrLoc) {

        //target current location traces
        targetView.forEach((tgtv: TargetView, idx: number) => { //add current location trace
            let [rr, tt] = [[] as number[], [] as number[]]
            let texts: string[] = []
            const ra = tgtv.ra_deg as number
            const dec = tgtv.dec_deg as number
            const azEl = util.get_target_traj(ra, dec, [time], lngLatEl) as [number, number][]
            const r = 90 - azEl[0][1]
            if (r <= traceRadiusLimit) {
                rr.push(r)
                tt.push(azEl[0][0])
                let txt = ""
                txt += `Az: ${azEl[0][0].toFixed(2)}<br>`
                txt += `El: ${azEl[0][1].toFixed(2)}<br>`
                txt += `Airmass: ${util.air_mass(azEl[0][1], lngLatEl.el).toFixed(2)}<br>`
                // txt += `Airmass: ${util.air_mass(azEl[0][1]).toFixed(2)}<br>`
                txt += `HT: ${dayjs(time).format(time_format)}`
                texts.push(txt)
            }

            const trace = {
                r: rr,
                theta: tt,
                text: texts,
                hovorinfo: 'text',
                showlegend: false,
                hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
                color: util.colors[idx % util.colors.length],
                textposition: 'top left',
                type: 'scatterpolar',
                mode: 'markers',
                marker: {
                    size: 12,
                    color: util.colors[idx % util.colors.length],
                    line: {
                        color: 'black',
                        width: 2
                    }
                },
                namelength: -1,
                name: 'Current location'
            }
            traces.push(trace as Plotly.Data)
        })
    }

    //add dome shapes
    const r0 = 90 - KG.r0
    const r1 = 90 - KG.r1
    const t0 = KG.t0
    const t1 = KG.t1
    const r2 = 90 - KG.r2
    const r3 = 90 - KG.r3
    const t2 = KG.t2
    const t3 = KG.t3
    const d1 = make_disk_polar(r0, r1, t0, t1)
    const d2 = make_disk_polar(r2, r3, t2, t3)
    const shape = {
        ...d1,
        r: [...d1.r, ...d2.r],
        theta: [...d1.theta, ...d2.theta]
    }

    traces.push(shape)

    //add tracking limits
    const rt1 = 0
    const rt2 = 5
    const tt0 = 0
    const tt1 = 361
    const d3 = make_disk_polar(rt1, rt2, tt0, tt1)
    const trackingshape = {
        ...d3,
        r: d3.r,
        theta: d3.theta
    }
    traces.push(trackingshape)
    return traces
}

export const DomeChart = (props: DomeChartProps) => {
    const { targets, showCurrLoc, times, obsdate, time } = props
    const KG = tel_geometry.keck[DOME]
    const lngLatEl = telLatLngEl.keck

    const dte = dayjs(obsdate).toDate()


    const targetView = targets.map((tgt: DomeTarget) => {
        const ra_deg = tgt.ra
        const dec_deg = tgt.dec
        // const visibility = util.get_target_visibility(tgt, times, lngLatEl) as VizRow[]
        const visibility = times.map((date) => {
            const [az, alt] = util.ra_dec_to_az_alt(ra_deg, dec_deg, date, lngLatEl)
            return alt_az_observable(az, alt, KG)
        })
        const visibilitySum = visibility.reduce((acc, viz) => acc + (viz.observable ? STEP_SIZE : 0), 0)
        return { ...tgt, ra_deg, dec_deg, date: dte, dome: DOME, visibility, visibilitySum } as TargetView
    })


    const traces = make_2d_traces(targetView,
        showCurrLoc,
        time,
        time_format,
        KG, lngLatEl)

    const layout: Partial<Plotly.Layout> = {
        width,
        height,
        title: { text: 'Target Trajectories' },
        hovermode: "closest",
        polar: {
            radialaxis: {
                showticklabels: true,
                tickmode: "array",
                tickvals: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
                ticktext: ['90', '80', '70', '60', '50', '40', '30', '20', '10', '0'],
            },
            angularaxis: {
                showticklabels: true,
                rotation: +90,
                direction: "clockwise"
            },
        },
        margin: {
            l: 40,
            r: 40,
            b: 40,
            t: 40,
            pad: 4
        },
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0.45,
            xanchor: 'right',
            y: 1,
            yanchor: 'middle',
            text: 'North',
            showarrow: false
        }, {
            xref: 'paper',
            yref: 'paper',
            x: 1,
            xanchor: 'left',
            y: .55,
            yanchor: 'top',
            text: 'East',
            showarrow: false
        }]
    }

    return (
        <>
            <Plot
                data={traces}
                layout={layout}
            />

        </>
    )
}
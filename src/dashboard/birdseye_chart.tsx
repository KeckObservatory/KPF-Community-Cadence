import React from 'react';
import { Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import { DomeChartProps, TargetView } from './dome_chart';
import { slot_date_format, LngLatEl, SLOT_SIZE, telLatLngEl, time_format, date_time_format, SEMESTER_RANGES } from './constants';
import dayjs from "dayjs"
import * as util from './sky_view_util.tsx'

const roundToSlot = (date: Date, slotSize: number): Date => {
    const d = dayjs(date);
    const minutes = d.minute();
    const roundedMinutes = Math.round(minutes / slotSize) * slotSize;
    return d.minute(roundedMinutes).second(0).millisecond(0).toDate();
}

interface HeatValue {
    color: string, //value to plot. e.g. semid or starname
    text: string // hover text to display
}

interface HeatMapDay {
    [key: string]: HeatValue //hour minute slot "00:00" to "23:55"
}

interface DateHeatMap {
    [key: string]: HeatMapDay //date string YYYY-MM-DD
}

const make_date_range = (start: dayjs.Dayjs, end: dayjs.Dayjs, nMin = SLOT_SIZE): dayjs.Dayjs[] => {
    const dates = [];
    for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(nMin, 'minute')) {
        dates.push(d);
    }
    return dates;
}

export const dayjs_range = (start: dayjs.Dayjs, end: dayjs.Dayjs, unit: dayjs.ManipulateType = 'day') => {
    const range = [];
    let current = start;
    while (!current.isAfter(end)) {
        range.push(current);
        current = current.add(1, unit);
    }
    return range;
}

const get_semester_dates = (semester: string) => {
    const sem = semester[semester.length - 1] as 'A' | 'B'
    const year = Number(semester.slice(0, 4))
    const plusYear = SEMESTER_RANGES[sem].plus_year ?? 0
    const endYear = year + plusYear
    const range = SEMESTER_RANGES[sem as 'A' | 'B']

    const startDate = dayjs().year(year).month(range.start_month).date(range.start_day)
    const endDate = dayjs().year(endYear).month(range.end_month).date(range.end_day)
    const ranges = dayjs_range(startDate, endDate, 'day')
    return ranges
}

const make_2d_traces = (targetView: TargetView[], time_format: string, lngLatEl: LngLatEl, semester: string) => {

    //target trajectory traces
    let traces: Partial<Plotly.Data>[] = []
    console.log('making traces for targetView', targetView)
    //get times
    const earliestDateSlot = dayjs(roundToSlot(new Date(Math.min(...targetView.map(t => new Date(t.time_started).getTime()))), SLOT_SIZE))
    const latestDateSlot = dayjs(roundToSlot(new Date(Math.max(...targetView.map(t => new Date(t.time_ended).getTime()))), SLOT_SIZE))
    const times = make_date_range(earliestDateSlot, latestDateSlot)
    const nSlots = Math.ceil((latestDateSlot.valueOf() - earliestDateSlot.valueOf()) / (SLOT_SIZE * 60 * 1000)) + 1
    console.log('earliestDateSlot, latestDateSlot, nSlots:', earliestDateSlot, latestDateSlot, nSlots)

    const semesterDates = get_semester_dates(semester)
    const heatmap = {} as DateHeatMap


    for (let dateSlot of semesterDates) { //loop over days
        const date = dayjs(dateSlot).format(slot_date_format)
        heatmap[date] = {} as HeatMapDay
        for (let slot of times) { //loop over slots in the day
            let time = slot.clone()
            time.set('year', dateSlot.year())
            time.set('month', dateSlot.month())
            time.set('date', dateSlot.date())
            heatmap[date][time.format(date_time_format)] = { color: '', text: '' }
        }
    }
    console.log('made empty heatmap', heatmap)
    const dates = Object.keys(heatmap).map(d => new Date(d)) //get all the dates in the heatmap

    const color_by_semid = (new Set(targetView.map(t => t.semid))).size > 1
    targetView.forEach((tgtv: TargetView) => {

        // Round to the nearest SLOT_SIZE minutes
        const startSlot = dayjs(roundToSlot(new Date(tgtv.time_started), SLOT_SIZE));
        const endSlot = dayjs(roundToSlot(new Date(tgtv.time_ended), SLOT_SIZE));
        const color = color_by_semid ? tgtv.semid : tgtv.human_starname;
        const slots = make_date_range(startSlot, endSlot)

        for (let slot of slots) {
            let txt = ""
            txt += `<b>${tgtv.human_starname}</b><br>`
            txt += `Az: ${tgtv.az_start.toFixed(2)}<br>`
            txt += `El: ${tgtv.alt_start.toFixed(2)}<br>`
            txt += `HT: ${dayjs(tgtv.time_started).format(time_format)}<br>`
            txt += `UTC: ${dayjs(tgtv.time_started).utc().format(time_format)}<br>`
            txt += `Airmass: ${util.air_mass(tgtv.alt_start, lngLatEl.el).toFixed(2)}<br>`
            const daySlots = heatmap[slot.format(slot_date_format)]
            const heatdatum: HeatValue = { color: color, text: txt }
            daySlots[slot.format(date_time_format)] = heatdatum
        }

    })

    // heatmap trace
    traces.push({
        x: times.map(t => t.toDate()),
        y: dates,
        z: Object.values(heatmap).map(day => Object.values(day).map(hv => hv.color)),
        mode: 'lines+markers',
        marker: { color: 'indigo' },
        name: 'Azimuth',
        text: Object.values(heatmap).flatMap(day => Object.values(day).map(hv => hv.text)),
        hovertemplate: '%{text}<br>Az: %{y}',
        xaxis: 'x',
        yaxis: 'y',
        type: 'scatter'
    });

    console.log('made heatmap traces', traces)


    return traces
}

interface BirdseyeChartProps extends DomeChartProps {
    semester: string //e.g. "2025A"
}



export const BirdseyeChart: React.FC<BirdseyeChartProps> = ({
    targetView,
    semester,
}) => {
    const height = 600;
    const width = 900;
    console.log('adding az/el chart')
    const traces = make_2d_traces(targetView, time_format, telLatLngEl.keck, semester);

    let layout: Partial<Layout> = {}

    layout = {
        height,
        width,
        xaxis: {
            anchor: 'y',
            tickmode: 'array',
        },
        yaxis: {
            anchor: 'x',
            title: 'Azimuth (deg)'
        },
    };
    return (
        <Plot
            data={traces}
            layout={layout}
        />
    );
};
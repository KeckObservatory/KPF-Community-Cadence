import { VizRow } from './dome_chart.tsx'
import {
    RADIUS_EARTH,
    ATMOSPHERE_HEIGHT,
    ROUND_MINUTES,
    STEP_SIZE,
    TIMES_START,
    TIMES_END,
    GeoModel,
    LngLatEl
} from './constants'
import { alt_az_observable } from './target_viz_chart.tsx';
import { TargetView } from './dome_chart.tsx';
import dayjs  from 'dayjs';

export const hidate = (date: Date, timezone: string) => {
    return dayjs(date).tz(timezone)
}


export const colors = [
    '#1f77b4',  // muted blue
    '#ff7f0e',  // safety orange
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick 
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf'   // blue-teal
];


export const date_to_juld = (date: Date) => {
    return (date.getTime() / 86400000) + 2440587.5 //do not offset
}

export const get_gmt = (date?: Date) => {
    //NOTE: This uses the 2000.00 equinox. This is the same as the GMST at 0h UT on 1 January 2000
    if (!date) date = new Date()
    const JD = date_to_juld(date)
    const T = (JD - 2451545) / 36525;
    let ThetaGMST = 67310.54841 + (876600 * 3600 + 8640184.812866) * T 
    + .093104 * (T**2) - ( 6.2 * 10**-6 ) * ( T**3 )
    ThetaGMST = ( ThetaGMST % ( 86400 * ( ThetaGMST / Math.abs(ThetaGMST) ) ) / 240) % 360
    return ThetaGMST 
}

export const ra_dec_to_deg = (time: string, dec = false) => {
    let [hours, min, sec] = time.split(':')
    let deg
    if (dec) {
        let sign = 1
        if (hours[0] === '+') hours = hours.substring(1);
        if (hours[0] === '-') {
            hours = hours.substring(1);
            sign = -1;
        }
        deg = sign * (parseInt(hours, 10) // dec is already in degrees
            + parseInt(min, 10) / 60
            + parseInt(sec, 10) / 60 ** 2)
    }

    else {
        deg = 15 * parseInt(hours, 10) // convert hours to deg
            + 15 * parseInt(min, 10) / 60
            + 15 * parseInt(sec, 10) / 60 ** 2
    }
    return deg
}

export const d2r = (deg: number) => {
    return deg * Math.PI / 180
}

export const r2d = (rad: number) => {
    return rad / d2r(1) 
}

export const cosd = (deg: number): number => {
    return Math.cos(d2r(deg))
}

export const sind = (deg: number): number => {
    return Math.sin(d2r(deg))
}

export const tand = (deg: number): number => {
    return Math.tan(d2r(deg))
}

export const ra_dec_to_az_alt = (ra: number, dec: number, date: Date, lngLatEl: LngLatEl): [number, number] => {
    /* Taken from Jean Meeus's Astronomical Algorithms textbook. Using equations
    13.5 & 13.6*/
    const hourAngle = (get_gmt(date) + lngLatEl.lng - ra) % 360
    const tanAzNum = sind(hourAngle)
    const tanAzDen = cosd(hourAngle) * sind(lngLatEl.lat) - tand(dec) * cosd(lngLatEl.lat)
    const az = Math.atan2(tanAzNum, tanAzDen) + Math.PI //radians (if reckoning from the north, subtract pi)
    // const az = Math.atan(tanAzNum/tanAzDen) //radians
    const sinEl = sind(lngLatEl.lat) * sind(dec) + cosd(lngLatEl.lat) * cosd(dec) * cosd(hourAngle)
    const el = Math.asin(sinEl) // radians
    return [r2d(az), r2d(el)]
}

export const add_hours = (date: Date, hours: number): Date => {
    const newDate = new Date(date.getTime())
    newDate.setTime(date.getTime() + hours * 3600000)
    return newDate
}

const round_date = (minutes: number, date: Date) => {
    const coeff = 1000 * 60 * minutes;
    return new Date(Math.round(date.getTime() / coeff) * coeff)
}

const round_date_up = (date: Date, minutes: number) => {
    const coeff = 1000 * 60 * minutes
    return new Date(Math.ceil(date.getTime() / coeff) * coeff)
}

const round_date_down = (date: Date, minutes: number) => {
    const coeff = 1000 * 60 * minutes
    return new Date(Math.floor(date.getTime() / coeff) * coeff)
}

export const get_day_times = (startDateTime: Date, endDateTime: Date, stepSize=STEP_SIZE) => {
    //Used for viz chart
    const start = round_date_up(startDateTime, stepSize) 
    const end = round_date_down(endDateTime, stepSize)
    const nLen = Math.round( ( end.getTime() - start.getTime() ) / (stepSize * 60 * 1000) )
    let times = Array.from({ length: nLen }, (_, idx) => new Date(start.getTime() + stepSize * 60 * 1000 * idx ))
    return [start, ...times, end] //and start and end
}

export const get_times_using_nadir = (nadir: Date, roundMin=ROUND_MINUTES, stepSize=STEP_SIZE) => {
    const nLen = Math.round( ( TIMES_END - TIMES_START ) / stepSize)
    const deltaNadir = Array.from({ length: nLen }, (_, idx) => TIMES_START + stepSize * idx )
    const roundedNadir = round_date(roundMin, nadir)
    return deltaNadir.map((hour: number) => {
        return add_hours(roundedNadir, hour)
    })
}


export const get_target_traj = (ra: number, dec: number, times: Date[], lngLatEl: LngLatEl): [number, number][] => {
    let traj: [number, number][] = []
    times.forEach((d: Date) => {
        traj.push(ra_dec_to_az_alt(ra, dec, d, lngLatEl))
    })
    return traj
}

export function alt_from_air_mass(am: number): number;
export function alt_from_air_mass(am: number, el: number): number;
export function alt_from_air_mass(am: number, el?: number) {
    if (el === undefined) {
        return 90 - r2d(Math.acos(1 / am))
    }
    const a = RADIUS_EARTH + el
    const b = ATMOSPHERE_HEIGHT + RADIUS_EARTH
    const s = am * ATMOSPHERE_HEIGHT
    const zenith = r2d(Math.acos(( a * a + s * s - b * b ) / (2 * a * s)))
    return 90 - zenith
}

export function air_mass(alt: number): number; //secant formula
export function air_mass(alt: number, el: number): number; // Homogeneous spherical atmosphsere with elevated observer
export function air_mass(alt: number, el?: number) {
    if (el === undefined) {
        const zenith = 90 + alt
        return 1 / cosd(zenith)
    }
    const y = el / ATMOSPHERE_HEIGHT
    const z = RADIUS_EARTH / ATMOSPHERE_HEIGHT
    const a2 = ATMOSPHERE_HEIGHT * ATMOSPHERE_HEIGHT
    const r = RADIUS_EARTH + el 
    const g = ATMOSPHERE_HEIGHT - el 
    const zenith = 90 - alt
    const firstTerm = (r * r) * cosd(zenith) * cosd(zenith) / ( a2 )
    const secondTerm = 2 * RADIUS_EARTH * (g) / a2
    const thirdTerm = y * y
    const forthTerm = (y + z) * cosd(zenith)
    const X = Math.sqrt(firstTerm + secondTerm - thirdTerm + 1) - forthTerm
    return X
}

export const get_air_mass = (ra: number, dec: number, times: Date[], lngLatEl: LngLatEl) => {
    const azAlt = get_target_traj(ra, dec, times, lngLatEl)
    const airmass = azAlt.map((a: [number, number]) => { return air_mass(a[1], lngLatEl.el) })
    // const airmass = azAlt.map((a: [number, number]) => { return air_mass(a[1]) })
    return airmass
}

export const add_pi = (angle: number) => {
    return angle + Math.PI
} 


export const get_curr_loc_trace = (targetView: TargetView[], 
    maxAirmass: number,
    minAirmass: number,
    time: Date, 
    lngLatEl: LngLatEl, 
    KG: GeoModel, 
    timezone: string, 
    date_time_format: string) => {
    //get curr marker
    const traces = targetView.map((tgtv: TargetView, idx: number) => { //add current location trace
            const ra = tgtv.ra_deg as number
            const dec = tgtv.dec_deg as number
            const azEl = ra_dec_to_az_alt(ra, dec, time, lngLatEl)
            const { observable, reasons } = alt_az_observable(azEl[1], azEl[0], KG)
            const viz: VizRow = {
                az: azEl[0],
                alt: azEl[1],
                datetime: time,
                observable,
                reasons,
            }
            const datum = viz.alt 
            const currTime = hidate(time, timezone)
            const airmass = air_mass(azEl[1], lngLatEl.el)
            maxAirmass = Math.max(maxAirmass, airmass)
            minAirmass = Math.min(minAirmass, airmass)
            let text = `<b>${tgtv.human_starname}</b><br>` 
            text += `Az: ${azEl[0].toFixed(2)}<br>`
            text += `El: ${azEl[1].toFixed(2)}<br>`
            text += `HT: ${currTime.format(date_time_format)}`

            const trace: Plotly.Data = {
                x: [currTime.toDate()],
                y: [datum],
                text: [text],
                hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
                showlegend: false,
                marker: {
                    size: 12,
                    // color: 'red',
                    color: colors[idx % colors.length],
                    line: {
                        color: 'black',
                        width: 3
                    }
                },
                textposition: 'top left',
                type: 'scatter',
                mode: 'markers',
                name: tgtv.human_starname
            }
            return trace
        })
    return traces
}
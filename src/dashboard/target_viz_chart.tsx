import { GeoModel } from "./constants";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { BlockReason } from "./dome_chart";
dayjs.extend(utc)
dayjs.extend(timezone)



export const alt_az_observable = (alt: number, az: number, KG: GeoModel) => {
    const minDeckAz = KG.t2
    const maxDeckAz = KG.t3
    const minAlt = KG.r1
    const deckAlt = KG.r3
    const trackLimit = KG.trackLimit

    const reasons: Array<BlockReason> = []
    //nasdeck is blocking the target?
    const targetOverlapsDeck = az >= minDeckAz && az <= maxDeckAz
    const targetBelowDeck = alt >= minAlt && alt <= deckAlt
    const deckBlocking = targetOverlapsDeck && targetBelowDeck
    deckBlocking && reasons.push('Deck Blocking')

    //target is below telescope horizon?
    const targetBelowHorizon = alt < minAlt
    targetBelowHorizon && reasons.push('Below Horizon')

    //target is above tracking limits?
    const targetAboveTrackingLimits = alt > trackLimit
    targetAboveTrackingLimits && reasons.push('Above Tracking Limits')

    const observable = !deckBlocking && !targetBelowHorizon && !targetAboveTrackingLimits
    return { observable, reasons }
}

export const date_normalize = (date: Date, utctz = false) => {
    //if date is before semester date set to next day
    let out = dayjs(date).set('year', 2000).set('month', 0).set('date', 1)
    out = out.get('hours') < 12 ? out.add(1, 'day') : out
    if (utctz) {
        return out.utc(true).toDate()
    }
    return out.toDate()
}

const colors = {
    'Deck Blocking': '#7570b3',
    'Below Horizon': '#e7298a',
    'Above Tracking Limits': '#d95f02'
}

export const reason_to_color_mapping = (reasons: string[]) => {
    const cols = reasons.map((reason: string) => colors[reason as keyof typeof colors])
    return cols.length ? cols[0] : '#1b9e77'
}
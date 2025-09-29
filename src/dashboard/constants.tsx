export const FOVlink = 'FEATURES.json'
export const ROUND_MINUTES = 10 // minutes
export const STEP_SIZE = 10 / 60 //hours
export const SLOT_SIZE = 5 // minutes
export const TIMES_START = -7 //hours
export const TIMES_END = 7 //hours
export const RADIUS_EARTH = 6378.1 // km
export const ATMOSPHERE_HEIGHT = 50 // km

export const TIMEZONE = 'Pacific/Honolulu'
export const SEMESTER_RANGES: SemesterRange = {
    'A': {
        start_day: 1,
        start_month: 2,
        end_day: 31,
        end_month: 7
    },
    'B': {
        start_day: 1,
        start_month: 8,
        end_day: 31,
        end_month: 1,
        plus_year: 1
    }
}

export const MARKER_SIZE = 10 //pxl radius

export const timezone = "Pacific/Honolulu"
export const slot_date_format = "YYYY/MM/DD"
export const time_format = "MM:DD HH:mm"
export const date_time_format = "YYYY/MM/DD HH:mm"
interface SemesterDates {
    start_day: number
    start_month: number
    end_day: number
    end_month: number
    plus_year?: number
}

interface SemesterRange {
    'A': SemesterDates
    'B': SemesterDates
}


export interface KeckGeoModel {
  K1: GeoModel
  K2: GeoModel
}

export interface GeoModel {
  r0: number,
  r1: number,
  r2: number,
  r3: number,
  t0: number,
  t1: number,
  t2: number,
  t3: number,
  left_north_wrap: number,
  right_south_wrap: number,
  trackLimit: number
}

export interface LngLatEl {
  lat: number,
  lng: number,
  el: number
}

export const telLatLngEl: Record<string, LngLatEl> = {
    keck: {
        "lat": 19.8283,
        "lng": 204.5253,
        "el": 4.160
    }
}
export const tel_geometry: Record<string, KeckGeoModel> = {
    keck: {
        "K1": {
            "r0": 0,
            "r1": 18,
            "r2": 0,
            "r3": 33.3,
            "t0": 0,
            "t1": 361,
            "t2": 5.3,
            "t3": 146.2,
            "left_north_wrap": 235,
            "right_south_wrap": 325,
            "trackLimit": 85
        },
        "K2": {
            "r0": 0,
            "r1": 18,
            "r2": 0,
            "r3": 36.8,
            "t0": 0,
            "t1": 361,
            "t2": 185.3,
            "t3": 332.8,
            "left_north_wrap": 235,
            "right_south_wrap": 325,
            "trackLimit": 85
        }
    }
}
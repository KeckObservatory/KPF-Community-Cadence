import React, { useState, useEffect } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useCommCadContext } from '../App';
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { DialogComponent } from '../dialog_component';
import { OB } from '../module_selector';
import { GeoModel, KeckGeoModel, LngLatEl, SEMESTER_RANGES, telLatLngEl, TIMEZONE } from './constants';
import dayjs, { Dayjs, ManipulateType } from 'dayjs';
import NightPicker from './night_picker';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { DOME, DomeChart, DomeTarget, TargetView, VizRow } from './dome_chart';
import TimeSlider from './time_slider';
import { get_day_times } from './sky_view_util';
import { mockedData } from './mock_dome_data';
import { alt_az_observable } from './target_viz_chart';
import { tel_geometry, STEP_SIZE } from "./constants.tsx"
import * as util from './sky_view_util.tsx'
import { COFChart, COFChartProps } from './cof_chart.tsx';
import { LadderChart, LadderChartProps } from './ladder_chart.tsx';
import { AzElChart } from './az_el_chart.tsx';
dayjs.extend(utc)
dayjs.extend(timezone)

interface DashboardDialogProps {
    open: boolean,
    ob: OB,
    setSelectedOB: (ob: OB) => void
    selectedOBs: OB[]
    handleClose: () => void
}

interface DashboardButtonProps {
    obs: OB[]
}

export const dayjs_range = (start: Dayjs, end: Dayjs, unit: ManipulateType = 'day') => {
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

export type DashboardChart = "Dome Plot" | "Cumulative Observation Function" | "Semester Schedule" | "Cadence Plot" | "Ladder Plot" | "Az/El Plot"
const visibility_chart_options: DashboardChart[] = [
    "Dome Plot",
    "Az/El Plot",
    "Cadence Plot",
    "Cumulative Observation Function",
    "Semester Schedule",
    "Ladder Plot"
]

interface ChartSelectProps {
    chartType: DashboardChart
    setChartType: (chartType: DashboardChart) => void
}

export const ChartSelectMenu = (props: ChartSelectProps) => {

    const handleChange = (event: SelectChangeEvent) => {
        props.setChartType(event.target.value as DashboardChart);
    }

    return (
        <FormControl sx={{ m: 0, minWidth: 200, display: 'flex' }}>
            <InputLabel id="viz-select-label">Chart Type</InputLabel>
            <Select
                label={"Chart Type"}
                id="viz-select-menu"
                defaultValue={props.chartType}
                onChange={handleChange}
            >
                {visibility_chart_options.map((option) => {
                    return <MenuItem value={option}>{option}</MenuItem>
                })}
            </Select>
        </FormControl>
    );
}

export const DashboardButton = (props: DashboardButtonProps) => {
    const { obs } = props
    let initOB = obs.at(0) ?? {} as OB
    const [ob, setOB] = useState<OB>(initOB)
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Tooltip title={`Click to view OB dashboard for ${ob?.target?.target_name ?? ob._id}`}>
                <IconButton color="primary" onClick={handleClickOpen}>
                    <VisibilityIcon />
                </IconButton>
            </Tooltip>
            <DashboardDialog
                open={open}
                ob={ob}
                setSelectedOB={setOB}
                selectedOBs={obs}
                handleClose={handleClose}
            />
        </>
    );
}

export const SemidSelect = () => {
    const context = useCommCadContext()
    const handleSemidChange = (semid?: string) => {
        if (semid) context.setSemid(semid)
    }
    return (
        <Tooltip title="Select Semid.">
            <Autocomplete
                disablePortal
                id="selected-semid"
                value={context.semid}
                onChange={(_, value) => value && handleSemidChange(value)}
                options={context.semids}
                sx={{ width: 250 }}
                renderInput={(params) => <TextField {...params} label={'Selected Semid'} />}
            />
        </Tooltip>
    )
}

export const hidate = (date: Date, timezone: string) => {
    return dayjs(date).tz(timezone)
}

const create_viz_row = (ra_deg: number, dec_deg: number, date: Date, lngLatEl: LngLatEl, KG: GeoModel) => {
    const [az, alt] = util.ra_dec_to_az_alt(ra_deg, dec_deg, date, lngLatEl)
    const viz: VizRow = {
        az: az,
        alt: alt,
        datetime: date,
        ...alt_az_observable(az, alt, KG)
    }
    return viz
}

export const DashboardDialog = (props: DashboardDialogProps) => {
    const context = useCommCadContext()
    const [chartType, setChartType] = useState<DashboardChart>("Dome Plot")
    const [availableDates, setAvailableDates] = useState<Dayjs[]>([])

    const today = hidate(new Date(), TIMEZONE)
    const [obsdate, setObsdate] = React.useState<Dayjs>(today)
    const [time, setTime] = useState<Date>(new Date())
    const [times, setTimes] = useState<Date[]>([])
    const [domeTargets, setDomeTargets] = useState<DomeTarget[]>([])
    const [cofData, setCofData] = useState<COFChartProps | null>(null)
    const [ladderData, setLadderData] = useState<LadderChartProps | null>(null)

    // target must have ra dec and be defined
    const { ob, setSelectedOB, selectedOBs, open } = props

    const [targetView, setTargetView] = useState<TargetView[]>([])

    const lngLatEl = telLatLngEl.keck

    useEffect(() => {
        const dte = dayjs(obsdate).toDate()
        const newTargetView = domeTargets.map((tgt: DomeTarget) => {
            const ra_deg = tgt.ra
            const dec_deg = tgt.dec
            const KG = tel_geometry.keck[DOME]
            let visibility = times.map((date) => {
                const viz = create_viz_row(ra_deg, dec_deg, date, lngLatEl, KG)
                return viz
            })

            const dateStarted = new Date(tgt.time_started)
            const dateEnded = new Date(tgt.time_ended)

            // TODO: include exposure start and end points in visibility
            // const vizStart = create_viz_row(ra_deg, dec_deg, dateStarted, lngLatEl, KG)
            // const vizEnd = create_viz_row(ra_deg, dec_deg, dateEnded, lngLatEl, KG)
            // visibility = [vizStart, ...visibility, vizEnd]
            // //sort by datetime
            // visibility.sort((a, b) => a.datetime.getTime() - b.datetime.getTime())

            const [az_start, alt_start] = util.ra_dec_to_az_alt(ra_deg, dec_deg, dateStarted, lngLatEl)
            const [az_end, alt_end] = util.ra_dec_to_az_alt(ra_deg, dec_deg, dateEnded, lngLatEl)
            const visibilitySum = visibility.reduce((acc, viz) => acc + (viz.observable ? STEP_SIZE : 0), 0)
            const tvis = {
                ...tgt,
                az_start, alt_start, az_end, alt_end,
                dec_deg, date: dte, dome: DOME, visibility, visibilitySum
            } as TargetView
            return tvis
        })
        console.log(`newTargetView`, newTargetView)
        setTargetView(newTargetView as TargetView[])
    }, [times, obsdate, domeTargets])

    const regexp = new RegExp("^[12][0-9]{3}[AB]$")

    useEffect(() => {
        if (!open) return
        const semester = context.semid.split('_')[0]
        const validSemester = regexp.test(semester)
        if (!validSemester) {
            return
        }
        const dates = get_semester_dates(semester)
        console.log('dates', dates)
        setAvailableDates(dates)
        const newDate = dates.includes(today) ? today : hidate((dates.at(0) as Dayjs).toDate(), TIMEZONE)
        setObsdate(newDate)
        //TODO: get data for the semid/ob
    }, [ob, context.semid])

    useEffect(() => {

        const get_dome_and_ladder_data = async () => {
            // const URL_BASE = 'http://vm-kpfcc:50002/data'
            // const semester = context.semid.split('_')[0]
            // const obsdatestr = obsdate.format('YYYY-MM-DD')
            // const band = 'band1'
            // const url = `${URL_BASE}/${semester}/${obsdatestr}/${band}/nightplan`
            // console.log('fetching', url)
            // const resp = await fetch(url)
            // if (resp.status !== 200) {
            //     console.error('Error fetching dome data', resp)
            //     return
            // }
            // const data = await resp.json()
            // const dome_data = data.slew_animation_data
            const dome_data = mockedData.slew_animation_data
            const myladderdata = { ladder_data: mockedData.ladder_data } as LadderChartProps
            setLadderData(myladderdata)
            const nightstart = new Date(dome_data.nightstart)
            const nightend = new Date(dome_data.nightends)
            const mytimes = get_day_times(nightstart, nightend, STEP_SIZE)
            console.log('dome data', dome_data)
            setTimes(mytimes)
            setTime(mytimes.at(0) as Date)
            setDomeTargets(dome_data.targets)
        }

        const get_cof_data = async () => {
            const cof_data = mockedData.cof as COFChartProps
            setCofData(cof_data)

        }

        if (chartType === "Dome Plot") {
            get_dome_and_ladder_data()
        }
        if (chartType === "Ladder Plot") {
            get_dome_and_ladder_data()
        }
        if (chartType === "Az/El Plot") {
            get_dome_and_ladder_data()
        }
        if (chartType === "Cumulative Observation Function") {
            get_cof_data()
        }
    }, [chartType, obsdate, context.semid])

    const onOBNameSelect = (name: string) => {
        console.log('name', name)
        const obName = ob.target.target_name ?? ob._id
        if (name !== obName) {
            let newOB = selectedOBs.find((o: OB) => o.target.target_name === name || o._id === name)
            if (!newOB) {
                console.error('OB not found', name)
                return
            }
            setSelectedOB(newOB)
        }
    }

    const handleDateChange = (newDate: Dayjs | null) => {
        if (!newDate) return
        const newHiDate = hidate(newDate.toDate(), TIMEZONE)
        setObsdate(newHiDate)
    }

    const dialogTitle = (
        <span>OB Cadence Chart</span>
    )


    let chart = <p>Graph goes here:</p>
    switch (chartType) {
        case "Az/El Plot":
            chart = <AzElChart
                targetView={targetView}
                showCurrLoc={true}
                time={time}
            />
            break
        case "Dome Plot":
            chart = <DomeChart
                targetView={targetView}
                showCurrLoc={true}
                time={time}
            />
            break
        case "Ladder Plot":
            ladderData && (chart = <LadderChart {...ladderData} />)
            break
        case "Cadence Plot":
            // chart = <CadencePlot ob={ob} obsdate={obsdate.format('YYYY-MM-DD')} />
            break
        case "Cumulative Observation Function":
            cofData && (chart = <COFChart {...cofData} />)
            break
        case "Semester Schedule":
            // chart = <SemesterSchedule ob={ob} />
            break
        default:
            chart = <p>Graph goes here:</p>
    }


    const dialogContent = (
        <Stack
            sx={{
                paddingTop: '16px',
                display: 'flex',
                flexWrap: 'wrap',
            }}
            direction='column'>
            <Stack direction='row' spacing={1}>
                <SemidSelect />
                {['Cadence Plot', 'Ladder Plot', 'Dome Plot'].includes(chartType) && (
                    <NightPicker date={obsdate} minDate={availableDates.at(0)}
                        maxDate={availableDates.at(-1)}
                        handleDateChange={handleDateChange} />
                )
                }
                {chartType === 'Cadence Plot' && (
                    <Tooltip title={'OB Name Select'}>
                        <Autocomplete
                            disablePortal
                            id="selected-ob-name"
                            value={ob.target.target_name ?? ob.target._id}
                            onChange={(_, value) => value && onOBNameSelect(value)}
                            options={selectedOBs.map(o => o.target.target_name ?? o._id)}
                            sx={{ width: 250 }}
                            renderInput={(params) => <TextField {...params} label={'Selected OB'} />}
                        />
                    </Tooltip>
                )}
                <ChartSelectMenu chartType={chartType} setChartType={setChartType} />
            </Stack>
            {chartType === "Dome Plot" && (
                <Stack direction="column" sx={{ paddingBottom: '50px' }} spacing={3}>
                    <TimeSlider
                        times={times}
                        time={time}
                        setTime={setTime}
                    />
                </Stack>
            )}
            {chart}
        </Stack>
    )

    return (
        <DialogComponent
            open={props.open}
            handleClose={props.handleClose}
            titleContent={dialogTitle}
            children={dialogContent}
            maxWidth="xl"
        />
    )
}

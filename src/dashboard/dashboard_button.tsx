import React, { useState, useEffect } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useCommCadContext } from '../App';
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { DialogComponent } from '../dialog_component';
import { OB } from '../module_selector';
import { SEMESTER_RANGES, TIMEZONE } from './constants';
import dayjs, { Dayjs, ManipulateType } from 'dayjs';
import NightPicker from './night_picker';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
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

export type DashboardChart = "Cumulative Observation Function" | "Semester Schedule" | "Cadence Plot" | "Night Plan"
const visibility_chart_options: DashboardChart[] = [
    "Cadence Plot",
    "Cumulative Observation Function",
    "Semester Schedule",
    "Night Plan",
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

    console.log('obs', obs, 'selected ob', ob)

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

export const DashboardDialog = (props: DashboardDialogProps) => {
    const context = useCommCadContext()
    const [chartType, setChartType] = useState<DashboardChart>("Cadence Plot")
    const [availableDates, setAvailableDates] = useState<Dayjs[]>([])

    const today = hidate(new Date(), TIMEZONE)
    const [obsdate, setObsdate] = React.useState<Dayjs>(today)

    // target must have ra dec and be defined
    const { ob, setSelectedOB, selectedOBs, open } = props

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
        if (availableDates.includes(newHiDate)) {
            setObsdate(newHiDate)
        }
    }

    const dialogTitle = (
        <span>OB Cadence Chart</span>
    )


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
                {['Cadence Plot', 'Night Plan'].includes(chartType) && (
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
            <p>Graph goes here:</p>
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

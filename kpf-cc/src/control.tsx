import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import React, { useEffect } from 'react'
// import { GetLogsArgs, log_functions } from './api/api_root'
import { NumberParam, StringParam, useQueryParam, withDefault } from 'use-query-params'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { Autocomplete, Box, Paper, Tooltip, Typography } from '@mui/material'

interface Props {
}


export const Control = (props: Props) => {

    // const [n_logs, setNLogs] = useQueryParam('n_logs', withDefault(NumberParam, 100))
    // const [minutes, setMinutes] = useQueryParam('log_minutes', withDefault(NumberParam, 0))
    // const [loggername, setLoggername] = useQueryParam('loggername', withDefault(StringParam, 'ddoi'))
    // const [startdatetime, setStartdatetime] = useQueryParam<string | undefined>('startdatetime')
    // const [enddatetime, setEnddatetime] = useQueryParam<string | undefined>('enddatetime')

    useEffect(() => {
    }, [])



    // Top 100 films as rated by IMDb users. http://www.imdb.com/chart/top
    const semesters = [
        { label: '2024B' },
        { label: '2024A' },
        { label: '2023B' },
        { label: '2023A' },
        { label: '2022B' },
        { label: '2022A' },
        { label: '2021B' },
    ]

    const programs = [
        { label: '123A' },
        { label: '123B' },
        { label: '123C' },
    ]

    const pis = [
        { label: 'Chet Baker' },
        { label: 'Sonny Rollins' },
        { label: 'Miles Davis' },
        { label: 'Louis Armstrong' },
        { label: 'Anita O\'Day' },
    ]

    return (
        <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
            <Tooltip title="Select semester">
                <Autocomplete
                    disablePortal
                    id="semester-selection"
                    options={semesters}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semester" />}
                />
            </Tooltip>
            <Tooltip title="Select program">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    options={programs}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Program" />}
                />
            </Tooltip>
            <Tooltip title="Select PI">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    options={pis}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="PI" />}
                />
            </Tooltip>
        </Stack>
    )
}
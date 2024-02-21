import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import React, { useEffect } from 'react'
import { StringParam, useQueryParam } from 'use-query-params'
import { Autocomplete, Tooltip } from '@mui/material'

interface Props {
}

export interface SPP {
    semester: string
    progid: string
    pi: string
}

export const Control = (props: Props) => {

    const [semester, setSemester] = useQueryParam('semester', StringParam)
    const [progid, setProgid] = useQueryParam('prog_id', StringParam)
    const [pi, setPI] = useQueryParam('pi', StringParam)

    useEffect(() => {
    }, [])

    const onChange = (key: String, value: string | undefined | null) => {
        if (value) {
            if (key === 'semester') {
                setSemester(value)
            }
            else if (key === 'progid') {
                setProgid(value)
            }
            else if (key === 'pi') {
                setPI(value)
            }
        }
    }

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
        { label: 'A123' },
        { label: 'B123' },
        { label: 'C123' },
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
                    value={semester ? { label: semester }: {label: 'input semester'}}
                    onChange={(_, value) => onChange('semester', value?.label)}
                    options={semesters}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semester" />}
                />
            </Tooltip>
            <Tooltip title="Select program">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    value={progid ? { label: progid }: {label: 'input program'}}
                    onChange={(_, value) => onChange('progid', value?.label)}
                    options={programs}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Program" />}
                />
            </Tooltip>
            <Tooltip title="Select PI">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    value={pi ? { label: pi }: {label: 'input pi'}}
                    onChange={(_, value) => onChange('pi', value?.label)}
                    options={pis}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="PI" />}
                />
            </Tooltip>
        </Stack>
    )
}
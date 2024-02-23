import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import React, { useEffect } from 'react'
import { StringParam, useQueryParam } from 'use-query-params'
import { Autocomplete, Tooltip } from '@mui/material'
import targets from './targets.json'

interface Props {
}

export interface SPP {
    semester: string
    progid: string
    pi: string
}

export const semesters = [...new Set(targets.map( (tgt) => {
return tgt.semester
}))]
export const prog_ids = [...new Set(targets.map( (tgt) => {
return tgt.prog_id
}))]
export const pis = [...new Set(targets.map( (tgt) => {
return tgt.pi
}))]


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

    return (
        <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
            <Tooltip title="Select semester">
                <Autocomplete
                    disablePortal
                    id="semester-selection"
                    value={semester ? { label: semester } : { label: 'input semester' }}
                    onChange={(_, value) => onChange('semester', value?.label)}
                    options={semesters.map((s) => { return { label: s } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semester" />}
                />
            </Tooltip>
            <Tooltip title="Select program">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    value={progid ? { label: progid } : { label: 'input program' }}
                    onChange={(_, value) => onChange('progid', value?.label)}
                    options={prog_ids.map((p) => { return { label: p } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Program" />}
                />
            </Tooltip>
            <Tooltip title="Select PI">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    value={pi ? { label: pi } : { label: 'input pi' }}
                    onChange={(_, value) => onChange('pi', value?.label)}
                    options={pis.map((p) => { return { label: p } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="PI" />}
                />
            </Tooltip>
        </Stack>
    )
}
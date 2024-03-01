import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect } from 'react'
import { Autocomplete, Tooltip } from '@mui/material'
import targets from './targets.json'
import { useCommCadContext } from './App'

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


export const Control = () => {

    const context = useCommCadContext()

    useEffect(() => {
    }, [])

    const onChange = (key: String, value: string | undefined | null) => {
        if (value) {
            if (key === 'semester') {
                context.setSemester(value)
            }
            else if (key === 'progid') {
                context.setProgId(value)
            }
            else if (key === 'pi') {
                context.setPi(value)
            }
        }
    }

    return (
        <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
            <Tooltip placement="top" title="Select semester">
                <Autocomplete
                    disablePortal
                    id="semester-selection"
                    //value={context.semester ? { label: context.semester } : { label: 'input semester' }}
                    value={context.semester ? { label: context.semester } : { label: 'semester' }}
                    onChange={(_, value) => onChange('semester', value?.label)}
                    options={context.semesters.map((s) => { return { label: s } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semester" />}
                />
            </Tooltip>
            <Tooltip placement="top" title="Select program">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    value={context.progId ? { label: context.progId } : { label: 'program' }}
                    onChange={(_, value) => onChange('progid', value?.label)}
                    options={context.prog_ids.map((p) => { return { label: p } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Program" />}
                />
            </Tooltip>
            <Tooltip placement="top" title="Select PI">
                <Autocomplete
                    disablePortal
                    id="program-selection"
                    value={context.pi ? { label: context.pi } : { label: 'pi' }}
                    onChange={(_, value) => onChange('pi', value?.label)}
                    options={context.pis.map((p) => { return { label: p } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="PI" />}
                />
            </Tooltip>
        </Stack>
    )
}
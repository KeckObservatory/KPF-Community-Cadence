import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect } from 'react'
import { Autocomplete, Tooltip, Typography } from '@mui/material'
import targets from './targets.json'
import { useCommCadContext } from './App'
import { get_all_targets } from './api/api_root';

export interface SPP {
    semester: string
    progid: string
    pi: string
}

export const semids = [...new Set(targets.map((tgt) => {
    return `${tgt.semester}_${tgt.prog_id}`
}))]


export const Control = () => {

    const context = useCommCadContext()

    useEffect(() => {
    }, [])

    const onChange = async (key: String, value: string | undefined | null) => {
        if (value) {
            if (key === 'semid') {
                context.setSemid(value)
                const resp = await get_all_targets(value);
                resp.success === 'SUCCESS' && (context.setTargets(resp.targets))
            }
        }
    }

    return (
        <Stack sx={{ marginBottom: '4px', marginTop: '8px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
            <Tooltip placement="top" title="Select semid">
                <Autocomplete
                    disablePortal
                    id="semester-selection"
                    //value={context.semester ? { label: context.semester } : { label: 'input semester' }}
                    value={context.semid ? { label: context.semid } : { label: 'semester' }}
                    onChange={(_, value) => onChange('semester', value?.label)}
                    options={context.semids.map((s) => { return { label: s } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semester" />}
                />
            </Tooltip>
            <Typography variant="h6" component="div">Total Hours: {(context.total_hours)?.toFixed(4)}</Typography>
            <Typography variant="h6" component="div">Total Observations: {context.total_observations}</Typography>

        </Stack>
    )
}
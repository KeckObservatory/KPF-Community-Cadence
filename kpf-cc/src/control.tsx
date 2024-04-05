import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect } from 'react'
import { Autocomplete, Tooltip, Typography } from '@mui/material'
import { useCommCadContext, useSnackbarContext } from './App'
import { get_all_targets } from './api/api_root';

export interface SPP {
    semid: string
    progid: string
    pi: string
}

export const Control = () => {

    const context = useCommCadContext()
    const snackbarContext = useSnackbarContext()

    useEffect(() => {
    }, [])

    const onChange = async (key: String, value: string | undefined | null) => {
        if (value) {
            if (key === 'semid' && value !== context.semid) {
                context.setSemid(value)
                const resp = await get_all_targets(value);
                if (resp.success === 'SUCCESS') {
                    context.setTotalHours(resp.total_hours)
                    context.setTotalObservations(resp.total_observations)
                    context.setTargets(resp.targets)
                }
                else {
                    snackbarContext.setSnackbarMessage(
                        {
                            severity: 'error',
                            message: `Error fetching targets for semid ${value}. Details: ${resp.details}`
                        })
                    context.setTotalHours(0)
                    context.setTotalObservations(0)
                    context.setTargets([])
                }
                if (resp.message.includes('NO_TARGETS_FOUND')) {
                    snackbarContext.setSnackbarMessage(
                        {
                            severity: 'error',
                            message: `No targets found for semid ${value}. Details: ${resp.details}`
                        })
                    context.setTotalHours(0)
                    context.setTotalObservations(0)
                    context.setTargets(resp.targets)
                }
            }
        }
    }

    return (
        <Stack sx={{ marginBottom: '4px', marginTop: '8px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
            <Tooltip placement="top" title="Select semid">
                <Autocomplete
                    disablePortal
                    id="semid-selection"
                    value={context.semid ? { label: context.semid } : { label: 'semid' }}
                    onChange={(_, value) => onChange('semid', value?.label)}
                    options={context.semids.map((s) => { return { label: s } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semid" />}
                />
            </Tooltip>
            <Typography variant="h6" component="div">Total Hours: {(context.total_hours)?.toFixed(4)}</Typography>
            <Typography variant="h6" component="div">Total Observations: {context.total_observations}</Typography>

        </Stack>
    )
}
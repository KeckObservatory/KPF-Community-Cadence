import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Autocomplete, Button, Tooltip, Typography } from '@mui/material'
import { useCommCadContext, useRefreshTableContext, useSnackbarContext } from './App'
import { SubmitResp, get_obs } from './api/api_root';

export interface SPP {
    semid: string
    progid: string
    pi: string
}

interface Props {
    isAdmin?: boolean
    notApproved?: boolean
}

const cartesian_product = (sets: string[][]) => {
    return sets.reduce((a, b) => a.flatMap(d => b.map(e => [d, e]).flat()));
}


export const Control = (props: Props) => {

    const context = useCommCadContext()
    const snackbarContext = useSnackbarContext()

    const refreshContext = useRefreshTableContext()
    const date = new Date()
    const semestersArr = cartesian_product([[date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1].map(s => String(s)),
    ['A', 'B']])
    const semesters = semestersArr.join('').split(/(?=\d{4}[AB])/)

    const onSemesterChange = (value: string | undefined | null) => {
        if (!value) return
        context.setSemester(value)
    }

    const handleResponse = (resp: SubmitResp, value: string | undefined | null) => {
        if (resp.success === 'SUCCESS') {
            console.log('setting observing blocks', resp)
            context.setTotalHours(resp.total_hours ?? 0)
            context.setTotalObservations(resp.total_observations ?? 0)
            context.setOBs(resp.observing_blocks ?? [])
        }
        else {
            snackbarContext.setSnackbarMessage(
                {
                    severity: 'error',
                    message: `Error fetching observing blocks for semid ${value}. Details: ${resp.details}`
                })
            context.setTotalHours(0)
            context.setTotalObservations(0)
            context.setOBs(resp.observing_blocks ?? [])
        }
        if (resp.message.includes('NO_OBS_FOUND')) {
            snackbarContext.setSnackbarMessage(
                {
                    severity: 'error',
                    message: `No observing blocks found for semid ${value}. Details: ${resp.details ?? resp.message}`
                })
            context.setTotalHours(0)
            context.setTotalObservations(0)
            context.setOBs(resp.observing_blocks ?? [])
        }
    }

    const onSemesterClick = async () => {
        if (!context.semester) return
        //const resp = await get_all_semester_targets(context.semester, props.notApproved)
        const resp = await get_obs(context.semester)
        handleResponse(resp, context.semester)
        refreshContext.setRefreshTable(refreshContext.refreshTable + 1)
    }


    const onSemidChange = async (semid: string | undefined | null) => {
        if (!semid) return
        const resp = await get_obs(undefined, semid)
        context.setSemester(undefined)
        handleResponse(resp, semid)
        context.setSemid(semid)
    }



    return (
        <Stack sx={{ marginBottom: '4px', marginTop: '8px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
            {props.isAdmin && (
                <>
                    <Tooltip placement="top" title="Select Semester (admin only)">
                        <Autocomplete
                            disablePortal
                            id="semid-selection"
                            value={{ label: context.semester ?? 'Semester' }}
                            onChange={(_, value) => onSemesterChange(value?.label)}
                            options={semesters.map((s) => { return { label: s } })}
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="Semester" />}
                        />
                    </Tooltip>
                    <Button onClick={onSemesterClick}>Get all semids for Semester</Button>
                </>
            )}
            <Tooltip placement="top" title="Select Semester Id.">
                <Autocomplete
                    disablePortal
                    id="semid-selection"
                    value={context.semid ? { label: context.semid } : { label: 'semid' }}
                    onChange={(_, value) => onSemidChange(value?.label)}
                    options={context.semids.map((s) => { return { label: s } })}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Semester ID" />}
                />
            </Tooltip>
            <Typography variant="h6" component="div">Total Hours: {(context.total_hours)?.toFixed(2)}</Typography>
            <Typography variant="h6" component="div">Total Observations: {context.total_observations}</Typography>

        </Stack>
    )
}
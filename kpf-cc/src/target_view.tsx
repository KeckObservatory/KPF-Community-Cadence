import { useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import {
    Box,
    FormControlLabel,
    FormGroup,
    Switch,
    Typography
} from '@mui/material'
import ValidationDialogButton from './validation_check_dialog'
import { StringParam, useQueryParam } from 'use-query-params'

export interface Props {

}

export interface Target {
    semester: string,
    prog_id: string,
    pi: string,
    target_name?: string,
    j_mag?: number,
    t_eff?: number,
    simucal_on?: boolean,
    nominal_exposure_time?: number
    maximum_exposure_time?: number,
    minimum_intranight_cadence?: number,
    minimum_internight_cadence?: number,
    num_observations_per_visit?: number,
    num_visits_per_night?: number,
    num_unique_nights_per_semester?: number
}

export const TargetView = () => {

    const [semester]= useQueryParam('semester', StringParam)
    const [progid] = useQueryParam('prog_id', StringParam)
    const [pi] = useQueryParam('pi', StringParam)

    const initTarget = {
        "semester": semester,
        "prog_id": progid,
        "pi": pi,
        "simucal_on": true,
    }
    const [target, setTarget] = useState(initTarget as Target)


    useEffect(() => {
        if (semester && progid && pi) {
            setTarget(prev => {
                return {
                    ...prev,
                    semester: semester,
                    prog_id: progid,
                    pi: pi
                }
            })
        }
    }, [semester, progid, pi])

    const handleTextChange = (key: string, value: string | number, isNumber=false) => {
        isNumber ? value = Number(value) : value
        setTarget((prev) => {
            return { ...prev, [key]: value }
        })
    }

    const handleSwitchChange = (key: string, event: React.SyntheticEvent<Element, Event>) => {
        const val = (event.target as any).checked
        setTarget((prev) => {
            return { ...prev, [key]: val }
        })
    }

    return (
        <Stack sx={{
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
        }}
            maxWidth='100%'
        >
            <Paper
                sx={{
                    padding: '12px',
                    margin: '6px',

                }}
                elevation={3}
            >
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Target Information
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Write Target Name Here.">
                            <TextField
                                // focused
                                label={'TargetName'}
                                id="target-name"
                                value={target.target_name}
                                onChange={(event) => handleTextChange('target_name', event.target.value)}

                            />
                        </Tooltip>
                        <Tooltip title="Write Magnitude Here.">
                            <TextField
                                // focused
                                label={'J-mag'}
                                id="j-magnitude"
                                value={target.j_mag}
                                onChange={(event) => handleTextChange('j_mag', event.target.value, true)}
                            />
                        </Tooltip>
                        <Tooltip title="Write Teff Here.">
                            <TextField
                                // focused
                                label={'Effective Temperature [K]'}
                                id="t-eff"
                                value={target.t_eff}
                                onChange={(event) => handleTextChange('t_eff', event.target.value, true)}
                            />
                        </Tooltip>
                    </Stack>
                </Box>
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Observation Info
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Is SimulCal On?">
                            <FormGroup>
                                <FormControlLabel
                                    onChange={(event) => handleSwitchChange('simucal_on', event)}
                                    value={target.simucal_on}
                                    control={<Switch defaultChecked />}
                                    label="Simucal On?" />
                            </FormGroup>
                        </Tooltip>
                        <Tooltip title="Write Nominal Exposure Time here (s).">
                            <TextField
                                // focused
                                label={'Nominal Exposure Time'}
                                id="exposure-time"
                                onChange={(event) => handleTextChange('nominal_exposure_time', event.target.value, true)}
                                value={target.nominal_exposure_time}
                            />
                        </Tooltip>
                        <Tooltip title="Write Maximum Exposure Time here (s).">
                            <TextField
                                // focused
                                label={'Maximum Exposure Time'}
                                onChange={(event) => handleTextChange('maximum_exposure_time', event.target.value, true)}
                                id="max-exposure-time"
                                value={target.maximum_exposure_time}
                            />
                        </Tooltip>
                    </Stack>
                </Box>
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Cadence Information
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Write Observation per visit here.">
                            <TextField
                                // focused
                                label={'Observation per visit'}
                                id="obs-per-visit"
                                onChange={(event) => handleTextChange('num_observations_per_visit', event.target.value, true)}
                                value={target.num_observations_per_visit}
                            />
                        </Tooltip>
                        <Tooltip title="Write Visits per night here.">
                            <TextField
                                // focused
                                label={'Visits per night'}
                                id="visits-per-night"
                                onChange={(event) => handleTextChange('num_visits_per_night', event.target.value, true)}
                                value={target.num_visits_per_night}
                            />
                        </Tooltip>
                        <Tooltip title="Write # unique nights per semester here.">
                            <TextField
                                // focused
                                label={'# unique nights per semester'}
                                id="unique-nights"
                                onChange={(event) => handleTextChange('num_unique_nights_per_semester', event.target.value, true)}
                                value={target.num_unique_nights_per_semester}
                            />
                        </Tooltip>
                    </Stack>
                    <Stack sx={{
                        marginBottom: '4px',
                    }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                        <Stack justifyContent='center' spacing={2}>
                            <Typography
                            >
                                Intra Night Cadence
                            </Typography>
                            <Tooltip title="Write minimum intra night cadence here." placement='left'>
                                <TextField
                                    // focused
                                    label={'Min Intranight Cadence'}
                                    id="min-intra-night-cadence"
                                    onChange={(event) => handleTextChange('minimum_intranight_cadence', event.target.value, true)}
                                    value={target.minimum_intranight_cadence}
                                />
                            </Tooltip>
                            <Tooltip title="Write minimum inter night cadence here." placement='left'>
                                <TextField
                                    // focused
                                    label={'Min Internight Cadence'}
                                    id="min-inter-night-cadence"
                                    onChange={(event) => handleTextChange('minimum_internight_cadence', event.target.value, true)}
                                    value={target.minimum_internight_cadence}
                                />
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Box>
                <Box>
                    <ValidationDialogButton target={target} />
                </Box>
            </Paper>
        </Stack>
    )

}
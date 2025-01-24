import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
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
import { ComponentRow } from '../ob_component_table';
import { Schedule } from '../module_selector';
import { input_label, text_change, switch_change, TextChangeInput, BaseChangeInput, SwitchChangeInput } from '../ob_edit_util';


interface Props {
    open: boolean
    schedule: Schedule & ComponentRow
    setSchedule: (schedule: Schedule & ComponentRow) => void
    handleClose: Function
}

export default function ScheduleForm(props: Props) {
    const componentName = 'schedule'
    const { schedule, open, handleClose, setSchedule } = props
    
    const schedule_input_label = (param: string, tooltip = false) => input_label(param, componentName, tooltip)

    const baseInput: BaseChangeInput = {
        row: schedule,
        saveFunction: setSchedule 
    }

    const handleTextChange = (key: string, value: string | number, isNumber = false) => {
        const input: TextChangeInput = {
            ...baseInput,
            key,
            value,
            isNumber
        }
        text_change(input)
    }

    const handleSwitchChange = (key: string, event: React.SyntheticEvent<Element, Event>) => {
        const input: SwitchChangeInput = {
            ...baseInput,
            key,
            event
        }
        console.log('input', input)
        switch_change(input)
    }

    return (
        <Dialog
            maxWidth="lg"
            onClose={() => handleClose()}
            open={open}
        >
            <DialogTitle>
                <>
                    <span>{componentName.toUpperCase()}</span>
                </>
            </DialogTitle>
            <DialogContent >
                <Stack sx={{
                    paddingTop: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
                    justifyContent='center'
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
                                align='center'
                                noWrap
                            >
                                Schedule Information
                            </Typography>
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={schedule_input_label('num_visits_per_night', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('num_visits_per_night')}
                                        id="visits-per-night"
                                        onChange={(event) => handleTextChange('num_visits_per_night', event.target.value, true)}
                                        value={schedule.num_visits_per_night}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('num_nights_per_semester', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('num_nights_per_semester')}
                                        id="unique-nights"
                                        onChange={(event) => handleTextChange('num_nights_per_semester', event.target.value, true)}
                                        value={schedule.num_nights_per_semester}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('nominal_exposure_time', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('nominal_exposure_time')}
                                        id="nominal-exposure-time"
                                        onChange={(event) => handleTextChange('nominal_exposure_time', event.target.value, true)}
                                        value={schedule.nominal_exposure_time}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('maximum_exposure_time', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('maximum_exposure_time')}
                                        id="maximum-exposure-time"
                                        onChange={(event) => handleTextChange('maximum_exposure_time', event.target.value, true)}
                                        value={schedule.maximum_exposure_time}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('fast_read_mode_requested', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('fast_read_mode_requested', event)}
                                            control={<Switch checked={schedule.fast_read_mode_requested} />}
                                            label={schedule_input_label('fast_read_mode_requested')} />
                                    </FormGroup>
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Stack justifyContent='center' spacing={2}>
                                    <Tooltip title={schedule_input_label('num_internight_cadence', true)}>
                                        <TextField
                                            // focused
                                            label={schedule_input_label('num_internight_cadence')}
                                            id="num-inter-night-cadence"
                                            value={schedule.num_internight_cadence}
                                            onChange={(event) => handleTextChange('num_internight_cadence', event.target.value, true)}
                                        />
                                    </Tooltip>
                                    <Tooltip
                                        title={`${schedule_input_label('num_intranight_cadence', true)}.${schedule.num_visits_per_night === 1 ? ' Disabled because num_visits_per_night is 1' : ''}`}
                                        placement='left'
                                    >
                                        <TextField
                                            // focused
                                            disabled={schedule.num_visits_per_night === 1}
                                            label={schedule_input_label('num_intranight_cadence')}
                                            id="num-intra-night-cadence"
                                            value={schedule.num_intranight_cadence}
                                            onChange={(event) => handleTextChange('num_intranight_cadence', event.target.value, false)}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Tooltip title={schedule_input_label('fixed_time_start', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('fixed_time_start')}
                                        id="fixed_time_start"
                                        onChange={(event) => handleTextChange('fixed_time_start', event.target.value, true)}
                                        value={schedule.fixed_time_start}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('fixed_time_end', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('fixed_time_end')}
                                        id="fixed_time_end"
                                        onChange={(event) => handleTextChange('fixed_time_end', event.target.value, true)}
                                        value={schedule.fixed_time_end}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('minimum_elevation', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('minimum_elevation')}
                                        id="minimum_elevation"
                                        onChange={(event) => handleTextChange('minimum_elevation', event.target.value, true)}
                                        value={schedule.minimum_elevation}
                                    />
                                </Tooltip>
                                <Tooltip title={schedule_input_label('minimum_moon_separation', true)}>
                                    <TextField
                                        // focused
                                        label={schedule_input_label('minimum_moon_separation')}
                                        id="minimum_moon_separation"
                                        onChange={(event) => handleTextChange('minimum_moon_separation', event.target.value, true)}
                                        value={schedule.minimum_moon_separation}
                                    />
                                </Tooltip>
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}

import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import {
    Box,
    Typography
} from '@mui/material'
import { ComponentRow } from '../ob_component_table';
import { Schedule } from '../module_selector';
import { text_change, switch_change, TextChangeInput, BaseChangeInput, SwitchChangeInput, make_text_field, make_switch_field } from '../ob_edit_util';


interface Props {
    open: boolean
    schedule: Schedule & ComponentRow
    setSchedule: (schedule: Schedule & ComponentRow) => void
    handleClose: Function
}

export default function ScheduleForm(props: Props) {
    const componentName = 'schedule'
    const { schedule, open, handleClose, setSchedule } = props
    

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

    const CreateTextField = (key: string, isNumber = false) => {
        return make_text_field(key, schedule, componentName, handleTextChange, isNumber)
    }

    const CreateSwitchField = (key: string) => {
        return make_switch_field(key, schedule, componentName, handleSwitchChange)
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
                                {CreateTextField('num_visits_per_night', true)}
                                {CreateTextField('num_nights_per_semester', true)}
                                {CreateTextField('nominal_exposure_time', true)}
                                {CreateTextField('max_exposure_time', true)}
                                {CreateSwitchField('fast_read_mode_requested')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Stack justifyContent='center' spacing={2}>
                                    {CreateTextField('num_internight_cadence', true)}
                                    {CreateTextField('num_intranight_cadence', true)}
                                </Stack>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateTextField('fixed_time_start', true)}
                                {CreateTextField('fixed_time_end', true)}
                                {CreateTextField('minimum_elevation', true)}
                                {CreateTextField('minimum_moon_separation', true)}
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}

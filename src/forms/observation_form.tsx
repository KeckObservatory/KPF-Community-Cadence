import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import {
    Autocomplete,
    Box,
    FormControlLabel,
    FormGroup,
    Switch,
    Typography
} from '@mui/material'
import { ComponentRow } from '../ob_component_table';
import { Observation } from '../module_selector';
import { make_text_field, input_label, text_change, switch_change, TextChangeInput, BaseChangeInput, SwitchChangeInput, enum_choices } from '../ob_edit_util';


interface Props {
    open: boolean
    observation: Observation & ComponentRow
    setObservation: (schedule: Observation & ComponentRow) => void
    handleClose: Function
}

export default function ObservationForm(props: Props) {
    const componentName = 'observation'
    const { observation, open, handleClose, setObservation } = props
    const observation_input_label = (param: string, tooltip = false) => input_label(param, componentName, tooltip)

    const baseInput: BaseChangeInput = {
        row: observation,
        saveFunction: setObservation 
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
        switch_change(input)
    }

    const CreateTextField = (key: string, isNumber = false) => {
        return make_text_field(key, observation, componentName, handleTextChange, isNumber)
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
                                Observation Information
                            </Typography>
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('object', false)}
                                {CreateTextField('exposure_time', true)}
                                {CreateTextField('num_exposures', true)}
                                {/* <Tooltip title={observation_input_label('object', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('object')}
                                        id="object-name"
                                        onChange={(event) => handleTextChange('object', event.target.value, true)}
                                        value={observation.object}
                                    />
                                </Tooltip>
                                <Tooltip title={observation_input_label('exposure_time', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('exposure_time')}
                                        id="exposure-time"
                                        onChange={(event) => handleTextChange('exposure_time', event.target.value, true)}
                                        value={observation.exposure_time}
                                    />
                                </Tooltip>
                                <Tooltip title={observation_input_label('num_exposures', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('num_exposures')}
                                        id="num_exposures"
                                        onChange={(event) => handleTextChange('num_exposures', event.target.value, true)}
                                        value={observation.num_exposures}
                                    />
                                </Tooltip> */}
                            </Stack>
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={observation_input_label('trigger_ca_h_k', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('trigger_ca_h_k', event)}
                                            control={<Switch checked={observation.trigger_ca_h_k} />}
                                            label={observation_input_label('trigger_ca_h_k')} />
                                    </FormGroup>
                                </Tooltip>
                                <Tooltip title={observation_input_label('trigger_green', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('trigger_green', event)}
                                            control={<Switch checked={observation.trigger_green} />}
                                            label={observation_input_label('trigger_green')} />
                                    </FormGroup>
                                </Tooltip>
                                <Tooltip title={observation_input_label('trigger_red', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('trigger_red', event)}
                                            control={<Switch checked={observation.trigger_red} />}
                                            label={observation_input_label('trigger_red')} />
                                    </FormGroup>
                                </Tooltip>
                                <Tooltip title={observation_input_label('block_sky', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('block_sky', event)}
                                            control={<Switch checked={observation.block_sky} />}
                                            label={observation_input_label('block_sky')} />
                                    </FormGroup>
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Tooltip title={observation_input_label('exp_meter_mode', true)}>
                                    <Autocomplete
                                        disablePortal
                                        id="exposure-meter-mode"
                                        value={observation.exp_meter_mode ?? 'input exposure meter mode'}
                                        onChange={(_, value) => handleTextChange('exp_meter_mode', value ?? "")}
                                        options={enum_choices('exp_meter_mode', componentName)}
                                        sx={{ width: 300 }}
                                        renderInput={(params) => <TextField {...params} label="Exposure Meter Mode" />}
                                    />
                                </Tooltip>
                                <Tooltip title={observation_input_label('auto_exp_meter', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('auto_exp_meter', event)}
                                            control={<Switch checked={observation.auto_exp_meter} />}
                                            label={observation_input_label('auto_exp_meter')} />
                                    </FormGroup>
                                </Tooltip>
                                {CreateTextField('exp_meter_exp_time', true)}
                                {CreateTextField('exp_meter_threshold', true)}
                                {/* <Tooltip title={observation_input_label('exp_meter_exp_time', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('exp_meter_exp_time')}
                                        id="exp_meter_exp_time"
                                        onChange={(event) => handleTextChange('exp_meter_exp_time', event.target.value, true)}
                                        value={observation.exp_meter_exp_time}
                                    />
                                </Tooltip>
                                <Tooltip title={observation_input_label('exp_meter_threshold', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('exp_meter_threshold')}
                                        id="exp_meter_threshold"
                                        onChange={(event) => handleTextChange('exp_meter_threshold', event.target.value, true)}
                                        value={observation.exp_meter_threshold}
                                    />
                                </Tooltip> */}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Tooltip title={observation_input_label('take_simulcal', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('take_simulcal', event)}
                                            control={<Switch checked={observation.take_simulcal} />}
                                            label={observation_input_label('take_simulcal')} />
                                    </FormGroup>
                                </Tooltip>
                                <Tooltip title={observation_input_label('auto_nd_filters', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('auto_nd_filters', event)}
                                            control={<Switch checked={observation.auto_nd_filters} />}
                                            label={observation_input_label('auto_nd_filters')} />
                                    </FormGroup>
                                </Tooltip>
                                <Tooltip title={observation_input_label('cal_n_d_1', true)}>
                                    <Autocomplete
                                        disablePortal
                                        id="cal_n_d_1"
                                        value={observation.cal_n_d_1 ?? 'input Cal ND 1'}
                                        onChange={(_, value) => handleTextChange('cal_n_d_1', value ?? "")}
                                        options={enum_choices('cal_n_d_1', componentName)}
                                        sx={{ width: 300 }}
                                        renderInput={(params) => <TextField {...params} label="Cal ND 1" />}
                                    />
                                </Tooltip>
                                <Tooltip title={observation_input_label('cal_n_d_2', true)}>
                                    <Autocomplete
                                        disablePortal
                                        id="cal_n_d_2"
                                        value={observation.cal_n_d_2 ?? 'input Cal ND 2'}
                                        onChange={(_, value) => handleTextChange('cal_n_d_2', value ?? "")}
                                        options={enum_choices('cal_n_d_2', componentName)}
                                        sx={{ width: 300 }}
                                        renderInput={(params) => <TextField {...params} label="Cal ND 2" />}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateTextField('nod_n', true)}
                                {CreateTextField('nod_e', true)}
                                {/* <Tooltip title={observation_input_label('nod_n', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('nod_n')}
                                        id="nod_n"
                                        onChange={(event) => handleTextChange('nod_n', event.target.value, true)}
                                        value={observation.nod_n}
                                    />
                                </Tooltip>
                                <Tooltip title={observation_input_label('nod_e', true)}>
                                    <TextField
                                        // focused
                                        label={observation_input_label('nod_e')}
                                        id="nod_e"
                                        onChange={(event) => handleTextChange('nod_e', event.target.value, true)}
                                        value={observation.nod_e}
                                    />
                                </Tooltip> */}
                                <Tooltip title={observation_input_label('guide_here', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('guide_here', event)}
                                            control={<Switch checked={observation.guide_here} />}
                                            label={observation_input_label('guide_here')} />
                                    </FormGroup>
                                </Tooltip>
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}
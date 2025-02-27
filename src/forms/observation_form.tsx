import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import {
    Box,
} from '@mui/material'
import { ComponentRow } from '../ob_component_table';
import { Observation } from '../module_selector';
import { make_text_field, text_change, switch_change, TextChangeInput, BaseChangeInput, SwitchChangeInput, make_autocomplete_field, make_switch_field } from '../ob_edit_util';
import { ob_schemas } from '../validation_check_dialog';


interface Props {
    open: boolean
    observation: Observation & ComponentRow
    setObservation: (schedule: Observation & ComponentRow) => void
    handleClose: Function
}

export default function ObservationForm(props: Props) {
    const componentName = 'observation'
    const { observation, open, handleClose, setObservation } = props
    const schemaProperties = ob_schemas[componentName].properties

    const baseInput: BaseChangeInput = {
        row: observation,
        saveFunction: setObservation
    }

    const handleTextChange = (key: string, value: string | number, isNumber = false) => {
        if (Object.keys(schemaProperties).includes(key) === false) {
            console.error(schemaProperties)
            console.error(`key ${key} not found in schema ${schemaProperties}`)
            return
        }
        const type = schemaProperties[key].type
        const input: TextChangeInput = {
            ...baseInput,
            key,
            value,
            type,
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

    const CreateAutocompleteField = (key: string,
        defaultValue: string = "",
        label: string = "",
        choices?: { label: string }[],
        disabled = false
    ) => {
        return make_autocomplete_field(key, observation, componentName, handleTextChange, defaultValue, label, choices, disabled)
    }

    const CreateSwitchField = (key: string) => {
        return make_switch_field(key, observation, componentName, handleSwitchChange)
    }

    const autoFiltersOn = observation.auto_nd_filters === true

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
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('object', false)}
                                {CreateTextField('exposure_time', true)}
                                {CreateTextField('num_exposures', true)}
                            </Stack>
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateSwitchField('trigger_ca_h_k')}
                                {CreateSwitchField('trigger_green')}
                                {CreateSwitchField('trigger_red')}
                                {CreateSwitchField('block_sky')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateAutocompleteField('exp_meter_mode', 'input exposure meter mode', 'Exposure Meter Mode')}
                                {CreateAutocompleteField('exp_meter_bin', 'input exposure meter bin', 'Exposure Meter Bin')}
                                {CreateSwitchField('auto_exp_meter')}
                                {CreateTextField('exp_meter_exp_time', true)}
                                {CreateTextField('exp_meter_threshold', true)}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateSwitchField('take_simulcal')}
                                {CreateSwitchField('auto_nd_filters')}
                                {CreateAutocompleteField('cal_n_d_1', 'input Cal ND Filter 1', 'Cal ND 1', undefined, autoFiltersOn)}
                                {CreateAutocompleteField('cal_n_d_2', 'input Cal ND Filter 2', 'Cal ND 2', undefined, autoFiltersOn)}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateTextField('nod_n', true)}
                                {CreateTextField('nod_e', true)}
                                {CreateSwitchField('guide_here')}
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}
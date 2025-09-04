import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import {
    Box,
    Button,
} from '@mui/material'
import { ComponentRow } from '../ob_component_table';
import { Schedule, TimeConstraint } from '../module_selector';
import {
    text_change, switch_change, TextChangeInput, BaseChangeInput, make_text_field, make_autocomplete_field,
    make_switch_field, SwitchChangeInput, make_array_time_constraint_field,
    time_constraint_array_change, ArrayChangeInput
} from '../ob_edit_util';
import { ob_schemas } from '../validation_check_dialog';


interface Props {
    open: boolean
    schedule: Schedule & ComponentRow
    setSchedule: (schedule: Schedule & ComponentRow) => void
    handleClose: Function
}

export default function ScheduleForm(props: Props) {
    const componentName = 'schedule'
    const { schedule, open, handleClose, setSchedule } = props
    const schemaProperties = ob_schemas[componentName].properties


    const baseInput: BaseChangeInput = {
        row: schedule,
        saveFunction: setSchedule
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
            type,
            value,
            isNumber
        }
        text_change(input)
    }

    const handleArrayChange = (arrayKey: string, arrayValue: TimeConstraint[]) => {
        if (Object.keys(schemaProperties).includes(arrayKey) === false) {
            console.error(schemaProperties)
            console.error(`key ${arrayKey} not found in schema ${schemaProperties}`)
            return
        }
        const input: ArrayChangeInput = {
            ...baseInput,
            key: arrayKey,
            value: arrayValue
        }
        time_constraint_array_change(input)
    }

    const handleSwitchChange = (key: string, event: React.SyntheticEvent<Element, Event>) => {
        const input: SwitchChangeInput = {
            ...baseInput,
            key,
            event
        }
        switch_change(input)
    }


    const CreateArrayTimeConstraintField = (key: string, subkey: string, index: number) => {
        return make_array_time_constraint_field(key, subkey, schedule, componentName, handleArrayChange, index)
    }


    const CreateTextField = (key: string, isNumber = false, width?: string) => {
        return make_text_field(key, schedule, componentName, handleTextChange, isNumber, width)
    }

    const CreateAutocompleteField = (key: string,
        defaultValue: string = "",
        label: string = "",
        choices?: { label: string }[],
        disabled = false
    ) => {
        return make_autocomplete_field(key, schedule, componentName, handleTextChange, defaultValue, label, choices, disabled)
    }

    const CreateSwitchField = (key: string) => {
        return make_switch_field(key, schedule, componentName, handleSwitchChange)
    }

    const add_time_constraint = () => {
        const newConstraints = schedule.custom_time_constraints ? [...schedule.custom_time_constraints] : []
        newConstraints.push({})
        handleArrayChange('custom_time_constraints', newConstraints)
    }

    const remove_time_constraint = () => {
        if (schedule.custom_time_constraints && schedule.custom_time_constraints.length > 0) {
            const newConstraints = [...schedule.custom_time_constraints]
            newConstraints.pop()
            handleArrayChange('custom_time_constraints', newConstraints)
        }
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
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateAutocompleteField('scheduling_mode', 'input scheduling mode', 'Scheduling Mode')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateSwitchField('weather_band_1')}
                                {CreateSwitchField('weather_band_2')}
                                {CreateSwitchField('weather_band_3')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('desired_num_visits_per_night', true)}
                                {CreateTextField('minimum_num_visits_per_night', true)}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('num_nights_per_semester', true)}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('num_intranight_cadence', true)}
                                {CreateTextField('num_internight_cadence', true)}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateTextField('minimum_elevation', true)}
                                {CreateTextField('minimum_moon_separation', true)}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                {CreateTextField('comment', false, '100%')}
                            </Stack>

                            <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Button variant="outlined"
                                    onClick={add_time_constraint}>
                                    Add Custom Time Constraint
                                </Button>
                            </Stack>
                            {
                                schedule.custom_time_constraints?.map((_, index) => (
                                    <Stack key={index} sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                        {CreateArrayTimeConstraintField('custom_time_constraints', 'start_datetime', index)}
                                        {CreateArrayTimeConstraintField('custom_time_constraints', 'end_datetime', index)}
                                    </Stack>
                                ))
                            }
                            {
                                (schedule.custom_time_constraints && schedule.custom_time_constraints.length > 0) &&
                                <Stack sx={{ marginBottom: '24px', }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                    <Button variant="outlined"
                                        onClick={remove_time_constraint}>
                                        Remove Last Time Constraint
                                    </Button>
                                </Stack>
                            }

                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}

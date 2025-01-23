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
    Typography
} from '@mui/material'
import { MuiChipsInput } from 'mui-chips-input';
import { useCommCadContext, useSnackbarContext } from '../App';
import { ComponentRow } from '../ob_component_table';
import { MetaData } from '../module_selector';
import { edit_ob, input_label, text_change, array_change, TextChangeInput, BaseChangeInput, ArrayChangeInput } from '../ob_edit_util';
import { useDebounceCallback } from '../use_debounce_callback';

interface Props {
    open: boolean
    metadata: ComponentRow & MetaData
    handleClose: Function
}

export default function MetadataForm(props: Props) {
    const componentName = 'metadata'
    const debounced_save = useDebounceCallback(edit_ob, 1000)

    const { metadata, open, handleClose, } = props
    const context = useCommCadContext()
    const snackbarContext = useSnackbarContext()

    const baseInput: BaseChangeInput = {
        obs: context.obs,
        setOBs: context.setOBs,
        setSnackbarMessage: snackbarContext.setSnackbarMessage,
        componentName: componentName,
        row: metadata,
        saveFunction: debounced_save
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

    const handleArrayChange = (key: string, value: string[]) => {
        const input: ArrayChangeInput = {
            ...baseInput,
            key,
            value
        }
        array_change(input)
    }


    return (
        <Dialog
            maxWidth="lg"
            onClose={() => handleClose()}
            open={open}

        >
            <DialogTitle>
                <>
                    <span>{componentName}</span>
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
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="column" justifyContent='center' spacing={2}>
                                <Typography
                                    component="h1"
                                    variant="h6"
                                    color="inherit"
                                    align='center'
                                    noWrap
                                >
                                    Program Information
                                </Typography>
                                <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                    <Tooltip title="Select semid"
                                    >
                                        <Autocomplete
                                            disablePortal
                                            id="semid-selection"
                                            value={metadata.semid ? { label: metadata.semid } : { label: 'input semid' }}
                                            onChange={(_, value) => handleTextChange('semid', value?.label ?? "")}
                                            options={context.semids.map((s) => { return { label: s } })}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label="Semid" />}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Box>
                        {/* <Box>
                            <Typography
                                component="h1"
                                variant="h6"
                                color="inherit"
                                align='center'
                                noWrap
                            >
                                Target Information
                            </Typography>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('target_name', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('target_name')}
                                        id="target-name"
                                        value={target.target_name}
                                        onChange={(event) => handleTextChange('target_name', event.target.value)}

                                    />
                                </Tooltip>
                                <Tooltip title={input_label('t_eff', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('t_eff')}
                                        id="t-eff"
                                        value={target.t_eff}
                                        onChange={(event) => handleTextChange('t_eff', event.target.value, true)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('ra', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('ra')}
                                        id="ra"
                                        value={target.ra}
                                        onChange={(event) => handleTextChange('ra', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('dec', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('dec')}
                                        id="dec"
                                        value={target.dec}
                                        onChange={(event) => handleTextChange('dec', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('j_mag', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('j_mag')}
                                        id="j-magnitude"
                                        value={target.j_mag}
                                        onChange={(event) => handleTextChange('j_mag', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('g_mag', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('g_mag')}
                                        id="g-magnitude"
                                        value={target.g_mag}
                                        onChange={(event) => handleTextChange('g_mag', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('gaia_id', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('gaia_id')}
                                        id="gaia-id"
                                        value={target.gaia_id}
                                        onChange={(event) => handleTextChange('gaia_id', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('tic_id', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('tic_id')}
                                        id="tic"
                                        value={target.tic_id}
                                        onChange={(event) => handleTextChange('tic_id', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('pm_ra', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('pm_ra')}
                                        id="pm-ra"
                                        value={target.pm_ra}
                                        onChange={(event) => handleTextChange('pm_ra', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('pm_dec', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('pm_dec')}
                                        id="pm-dec"
                                        value={target.pm_dec}
                                        onChange={(event) => handleTextChange('pm_dec', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('epoch', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('epoch')}
                                        id="epoch"
                                        value={target.epoch}
                                        onChange={(event) => handleTextChange('epoch', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('systemic_velocity', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('systemic_velocity')}
                                        id="rot-vel"
                                        value={target.systemic_velocity}
                                        onChange={(event) => handleTextChange('systemic_velocity', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                        </Box>
                        <Box>
                            <Typography
                                component="h1"
                                variant="h6"
                                color="inherit"
                                align='center'
                                noWrap
                            >
                                Observation Info
                            </Typography>
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('simulcal_on', true)}>
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('simulcal_on', event)}
                                            control={<Switch checked={target.simulcal_on} />}
                                            label={input_label('simulcal_on')} />
                                    </FormGroup>
                                </Tooltip>
                                <Tooltip title={input_label('nominal_exposure_time', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('nominal_exposure_time')}
                                        id="exposure-time"
                                        onChange={(event) => handleTextChange('nominal_exposure_time', event.target.value, true)}
                                        value={target.nominal_exposure_time}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('maximum_exposure_time', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('maximum_exposure_time')}
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
                                align='center'
                                noWrap
                            >
                                Cadence Information
                            </Typography>
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('num_exposures_per_visit', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('num_exposures_per_visit')}
                                        id="obs-per-visit"
                                        onChange={(event) => handleTextChange('num_exposures_per_visit', event.target.value, true)}
                                        value={target.num_exposures_per_visit}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('num_visits_per_night', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('num_visits_per_night')}
                                        id="visits-per-night"
                                        onChange={(event) => handleTextChange('num_visits_per_night', event.target.value, true)}
                                        value={target.num_visits_per_night}
                                    />
                                </Tooltip>
                                <Tooltip title={input_label('num_unique_nights_per_semester', true)}>
                                    <TextField
                                        // focused
                                        label={input_label('num_unique_nights_per_semester')}
                                        id="unique-nights"
                                        onChange={(event) => handleTextChange('num_unique_nights_per_semester', event.target.value, true)}
                                        value={target.num_unique_nights_per_semester}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{
                                marginBottom: '24px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Stack justifyContent='center' spacing={2}>
                                    <Tooltip title={input_label('num_internight_cadence', true)}>
                                        <TextField
                                            // focused
                                            label={input_label('num_internight_cadence')}
                                            id="num-inter-night-cadence"
                                            value={target.num_internight_cadence}
                                            onChange={(event) => handleTextChange('num_internight_cadence', event.target.value, true)}
                                        />
                                    </Tooltip>
                                    <Tooltip
                                        title={`${input_label('num_intranight_cadence', true)}.${target.num_visits_per_night === 1 ? ' Disabled because num_visits_per_night is 1' : ''}`}
                                        placement='left'
                                    >
                                        <TextField
                                            // focused
                                            disabled={target.num_visits_per_night === 1}
                                            label={input_label('num_intranight_cadence')}
                                            id="num-intra-night-cadence"
                                            value={target.num_intranight_cadence}
                                            onChange={(event) => handleTextChange('num_intranight_cadence', event.target.value, false)}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Box> */}
                        <Box>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('tags', componentName, true)}>
                                    <MuiChipsInput
                                        value={metadata.tags}
                                        onChange={(value: string[]) => handleArrayChange('tags', value)}
                                        label={input_label('tags', componentName)}
                                        id="tags"
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{
                                marginBottom: '4px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('comment', componentName, true)}>
                                    <TextField
                                        // focused
                                        multiline
                                        maxRows={4}
                                        label={input_label('comment', componentName)}
                                        id="comment"
                                        onChange={(event) => handleTextChange('comment', event.target.value)}
                                        value={metadata.comment}
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
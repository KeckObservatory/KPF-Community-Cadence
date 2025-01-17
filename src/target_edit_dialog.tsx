import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
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
import EditIcon from '@mui/icons-material/Edit';
import SimbadButton from './simbad_button';
import { MuiChipsInput } from 'mui-chips-input';
import { useCommCadContext, Target } from './App';
import target_schema from './schemas/cc_target_schema.json'

interface Props {
    target: Target
    setTarget: Function
}

interface TargetEditProps extends Props {
    handleClose: Function
    open: boolean
}

interface Items extends PropertyProps {
    properties?: { [key: string]: PropertyProps }
}

export interface PropertyProps {
    description: string,
    type: string | string[],
    short_description?: string,
    default?: unknown,
    pattern?: string,
    minLength?: number,
    maxLength?: number,
    not_editable_by_user?: boolean,
    enum?: string[],
    items?: Items
    translator_mapping?: string
}

export interface SchemaProps {
    [key: string]: PropertyProps
}

const SchemaProps = target_schema.properties as SchemaProps

export const format_tags = (tags: string[]) => {
    const pattern = /[,]/g
    tags = tags ?? [] //if tags is undefined, set to empty array
    tags = tags.map((tag) => tag.trim().replace(pattern, '')).filter((tag) => tag.length > 0) //no empty strings or whitespace
    tags = [...new Set(tags)]
    return tags
}

const sanitize_number = (value: string) => {
    const pattern = /[^\d.-]/g
    value = value.replace(pattern, '')
    const split = value.split('.')
    if (split.length > 2) {
        value = value.split('.').reduce((acc, val, idx) => {
            console.log('acc', acc, 'val', val, 'idx', idx)
            if (idx === 0) {
                return val + acc
            }
            return acc + val //concatenate strings after first decimal
        }, '.')
    }
    return value
}

export const format_edit_entry = (key: string, value?: string | number, isNumber = false) => {
    //add trailing zero if string ends in a decimal 
    if (isNumber) {
        value = sanitize_number(String(value))
        console.log('value', value)
    }
    if (value && (key === 'ra' || key === 'dec')) {
        key === 'ra' && String(value).replace(/[^+-]/, "")
        value = raDecFormat(value as string)
    }
    if (value && key === 'target_name') {
        value = String(value).replace(/[^\w^\-^\s]+/g, '') //remove non alphanumeric characters
        value = value.slice(0, 15) //truncate to 15 characters
    }
    value = String(value).replace(/\t/, '') //remove tabs
    return value
}

export const raDecFormat = (input: string) => {
    // Strip all characters from the input digits and keep pos/neg sign
    const sign = input.length > 0 ? input[0].replace(/[^+-]/, "") : ""
    input = input.replace(/[^0-9]+/g, "");

    // Based upon the length of the string, we add formatting as necessary
    var size = input.length;
    if (size < 2) {
        input = input;
    }
    else if (size < 3) {
        input = input + ':';
    } else if (size < 5) {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':';
    } else if (size < 6) {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6);
    } else if (size < 7) {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6) + '.';
    } else {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6) + '.' + input.substring(6);
    }
    return sign + input;
}

export const rowSetter = (tgt: Target, key: string, value?: string | number | boolean | string[]) => {
    tgt = { ...tgt, [key]: value, "state": 'TARGET_EDITED' }
    if (key.includes('exposure_time')) { //nominal equivalent to maximum
        tgt = {
            ...tgt,
            'nominal_exposure_time': Number(value),
            'maximum_exposure_time': Number(value)
        }
    }
    if (key.includes('num_visits_per_night') && value === 1) { //num_visits_per_night equivalent to num_exposures_per_visit
        tgt = {
            ...tgt,
            'num_intranight_cadence': 0,
        }
    }
    if (key.includes('num_intranight_cadence') && tgt.num_visits_per_night === 1) { // do not allow intranight cadence edit if num_visits_per_night is 1
        tgt = {
            ...tgt,
            'num_intranight_cadence': 0,
        }
    }
    return tgt
}


export const TargetEditDialog = (props: TargetEditProps) => {

    const { target, setTarget } = props
    const [hasSimbad, setHasSimbad] = React.useState(target.tic_id || target.gaia_id ? true : false)
    const context = useCommCadContext()

    React.useEffect(() => {
        setHasSimbad(target.tic_id || target.gaia_id ? true : false)
    }, [target.tic_id, target.gaia_id])

    const handleTextChange = (key: string, value?: string | number, isNumber = false) => {
        value = format_edit_entry(key, value, isNumber)
        setTarget((prev: Target) => {
            return rowSetter(prev, key, isNumber ? Number(value) : value)
        })
    }

    const handleArrayChange = (key: string, value: string[]) => {
        value = format_tags(value)
        setTarget((prev: Target) => {
            return rowSetter(prev, key, value)
        })
    }

    const input_label = (param: keyof Target, tooltip = false): string => {
        return tooltip ?
            SchemaProps[param].description
            :
            SchemaProps[param].short_description ?? SchemaProps[param].description
    }




    const handleSwitchChange = (key: string, event: React.SyntheticEvent<Element, Event>) => {
        const value = (event.target as HTMLInputElement).checked
        setTarget((prev: Target) => {
            let tgt = { ...prev, [key]: value, "state": 'TARGET_EDITED' }
            return tgt
        })
    }

    const handleSimbadChange = (tgt: Target) => {
        setTarget((prev: Target) => {
            tgt = { ...prev, ...tgt, "state": 'TARGET_EDITED' }
            return tgt
        })
        setHasSimbad(tgt.tic_id || tgt.gaia_id ? true : false)
        handleTextChange('ra', tgt.ra)
    }

    return (
        <Dialog
            maxWidth="lg"
            onClose={() => props.handleClose()}
            open={props.open}

        >
            <DialogTitle>
                <>
                    <span>TargetEdit</span>
                    <SimbadButton target={target} setTarget={handleSimbadChange} hasSimbad={hasSimbad} />
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
                                            value={target.semid ? { label: target.semid } : { label: 'input semid' }}
                                            onChange={(_, value) => handleTextChange('semid', value?.label)}
                                            options={context.semids.map((s) => { return { label: s } })}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label="Semid" />}
                                        />
                                    </Tooltip>
                                </Stack>
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
                        </Box>
                        <Box>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('tags', true)}>
                                    <MuiChipsInput
                                        value={target.tags}
                                        onChange={(value: string[]) => handleArrayChange('tags', value)}
                                        label={input_label('tags')}
                                        id="tags"
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{
                                marginBottom: '4px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <TextField
                                    // focused
                                    multiline
                                    maxRows={4}
                                    label={input_label('comment')}
                                    id="comment"
                                    onChange={(event) => handleTextChange('comment', event.target.value)}
                                    value={target.comment}
                                />
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )

}

export default function TargetEditDialogButton(props: Props) {
    const [open, setOpen] = React.useState(false);
    const { target, setTarget } = props

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Tooltip title="Select to edit target in dialog window">
                <IconButton onClick={handleClickOpen}>
                    <EditIcon />
                </IconButton>
            </Tooltip>
            <TargetEditDialog
                open={open}
                target={target}
                setTarget={setTarget}
                handleClose={handleClose}
            />
        </>
    );
}

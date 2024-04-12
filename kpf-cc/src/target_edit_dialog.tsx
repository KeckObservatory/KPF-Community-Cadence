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
import { useCommCadContext, Target } from './App';

interface Props {
    target: Target
    setTarget: Function
}

interface TargetEditProps extends Props {
    handleClose: Function
    open: boolean
}

export const TargetEditDialog = (props: TargetEditProps) => {

    const { target, setTarget } = props
    const [hasSimbad, setHasSimbad] = React.useState(target.tic_id || target.gaia_id ? true : false)
    const context = useCommCadContext()

    React.useEffect(() => {
        setHasSimbad(target.tic_id || target.gaia_id ? true : false)
    }, [target.tic_id, target.gaia_id])

    const raDecFormat = (input: string) => {
        // Strip all characters from the input digits and keep pos/neg sign
        const sign = input.length > 0 ? input[0].replace(/[^+-]/, "") : ""
        input = input.replace(/[^0-9]+/g, "");

        // Based upon the length of the string, we add formatting as necessary
        var size = input.length;
        if (size < 3) {
            input = input;
        }
        else if (size < 5) {
            input = input.substring(0, 2) + ':' + input.substring(2, 4);
        } else if (size < 7) {
            input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6);
        } else {
            input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6) + '.' + input.substring(6);
        }
        return sign + input;
    }

    const handleTextChange = (key: string, value?: string | number, isNumber = false) => {
        value && isNumber ? value = Number(value) : value
        if (value && (key === 'ra' || key === 'dec')) {
            key === 'ra' && String(value).replace(/[^+-]/, "")
            value = raDecFormat(value as string)
        }

        setTarget((prev: Target) => {
            let tgt = { ...prev, [key]: value, "state": 'TARGET_EDITED' }
            if (key.includes('exposure_time')) { //nominal equivalent to maximum
                tgt = { ...tgt, 
                    'nominal_exposure_time': value as number, 
                    'maximum_exposure_time': value as number}
            }
            if (key.includes('num_visits_per_night') && value === 1) { //num_visits_per_night equivalent to num_observations_per_visit
                tgt = { ...tgt,
                        'num_intranight_cadence': 0,
                }

            }
            return tgt
        })
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
            tgt = { ...tgt, ...prev, "state": 'TARGET_EDITED' }
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
                                    <Tooltip title="Select semid">
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
                                <Tooltip title="Write Target Name Here.">
                                    <TextField
                                        // focused
                                        label={'TargetName'}
                                        id="target-name"
                                        value={target.target_name}
                                        onChange={(event) => handleTextChange('target_name', event.target.value)}

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
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title="Write RA Here.">
                                    <TextField
                                        // focused
                                        label={'RA'}
                                        InputLabelProps={{ shrink: hasSimbad || 'ra' in target }}
                                        id="ra"
                                        value={target.ra}
                                        onChange={(event) => handleTextChange('ra', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title="Write Declination Here.">
                                    <TextField
                                        // focused
                                        label={'Dec'}
                                        InputLabelProps={{ shrink: hasSimbad || 'dec' in target }}
                                        id="dec"
                                        value={target.dec}
                                        onChange={(event) => handleTextChange('dec', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title="Write J Magnitude Here.">
                                    <TextField
                                        // focused
                                        label={'J-mag'}
                                        InputLabelProps={{ shrink: hasSimbad || 'j_mag' in target }}
                                        id="j-magnitude"
                                        value={target.j_mag}
                                        onChange={(event) => handleTextChange('j_mag', event.target.value, true)}
                                    />
                                </Tooltip>
                                <Tooltip title="Write G Magnitude Here.">
                                    <TextField
                                        // focused
                                        label={'G-mag'}
                                        InputLabelProps={{ shrink: hasSimbad || 'g_mag' in target }}
                                        id="g-magnitude"
                                        value={target.g_mag}
                                        onChange={(event) => handleTextChange('g_mag', event.target.value, true)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title="Gaia ID">
                                    <TextField
                                        // focused
                                        label={'Gaia ID'}
                                        InputLabelProps={{ shrink: hasSimbad || target.gaia_id !== undefined }}
                                        id="gaia-id"
                                        value={target.gaia_id}
                                        onChange={(event) => handleTextChange('gaia_id', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title="TIC ID">
                                    <TextField
                                        // focused
                                        label={'TIC ID'}
                                        InputLabelProps={{ shrink: hasSimbad || target.tic !== undefined }}
                                        id="tic"
                                        value={target.tic}
                                        onChange={(event) => handleTextChange('tic_id', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title="Write Proper Motion RA Here.">
                                    <TextField
                                        // focused
                                        label={'PM RA'}
                                        InputLabelProps={{ shrink: hasSimbad || 'pm_ra' in target }}
                                        id="pm-ra"
                                        value={target.pm_ra}
                                        onChange={(event) => handleTextChange('pm_ra', event.target.value, true)}
                                    />
                                </Tooltip>
                                <Tooltip title="Write Proper Motion Dec Here.">
                                    <TextField
                                        // focused
                                        label={'PM Dec'}
                                        InputLabelProps={{ shrink: hasSimbad || 'pm_dec' in target }}
                                        id="pm-dec"
                                        value={target.pm_dec}
                                        onChange={(event) => handleTextChange('pm_dec', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title="Write Epoch Here.">
                                    <TextField
                                        // focused
                                        label={'Epoch'}
                                        InputLabelProps={{ shrink: hasSimbad || 'epoch' in target }}
                                        id="epoch"
                                        value={target.epoch}
                                        onChange={(event) => handleTextChange('epoch', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title="Write Sys rotational velocity Here.">
                                    <TextField
                                        // focused
                                        label={'Rotational Velocity'}
                                        InputLabelProps={{ shrink: hasSimbad || 'sys_rv' in target }}
                                        id="rot-vel"
                                        value={target.sys_rv}
                                        onChange={(event) => handleTextChange('sys_rv', event.target.value, true)}
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
                                <Tooltip title="Is SimulCal On?">
                                    <FormGroup>
                                        <FormControlLabel
                                            onChange={(event) => handleSwitchChange('simulcal_on', event)}
                                            value={target.simulcal_on}
                                            control={<Switch defaultChecked />}
                                            label="simulcal On?" />
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
                                align='center'
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
                                marginBottom: '24px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Stack justifyContent='center' spacing={2}>
                                    <Tooltip title="Write num inter night cadence here." placement='left'>
                                        <TextField
                                            // focused
                                            label={'Num Internight Cadence'}
                                            id="num-inter-night-cadence"
                                            onChange={(event) => handleTextChange('num_internight_cadence', event.target.value, true)}
                                            value={target.num_internight_cadence}
                                        />
                                    </Tooltip>
                                    <Tooltip 
                                    title={`Write num intra night cadence here.${target.num_visits_per_night === 1 ? ' Disabled because num_visits_per_night is 1' : ''}`}
                                    placement='left'>
                                        <TextField
                                            disabled={target.num_visits_per_night === 1} 
                                            label={'Num Intranight Cadence'}
                                            id="num-intra-night-cadence"
                                            onChange={(event) => handleTextChange('num_intranight_cadence', event.target.value, true)}
                                            value={target.num_intranight_cadence}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Box>
                        <Box>
                            <Stack sx={{
                                marginBottom: '4px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <TextField
                                    // focused
                                    multiline
                                    maxRows={4}
                                    label={'Comment'}
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
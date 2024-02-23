import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
import { useEffect, useState } from 'react'
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
import { StringParam, useQueryParam } from 'use-query-params'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Target } from './target_view';
import { pis, prog_ids, semesters } from './control';
import debounce from 'lodash.debounce';

interface Props {
    target: Target
    setTarget: Function
}

interface TargetEditProps {
    target: Target
    setTarget: Function
    handleClose: Function
    open: boolean
}

export const TargetEditDialog = (props: TargetEditProps) => {

    const { target, setTarget } = props

    const debouncedSave = React.useCallback(
        debounce(async (target: Target, key: string, value: number | string | boolean | undefined) => {
            console.log('debounced save', target) //TODO: send to server
            setTarget((prev: Target) => {
                return { ...prev, [key]: value }
            })
        }, 1000),
        []
    )

    const handleTextChange = (key: string, value?: string | number, isNumber = false) => {
        value && isNumber ? value = Number(value) : value
        //debouncedSave(target, key, value)
        setTarget((prev: Target) => {
            return { ...prev, [key]: value }
        })
    }

    const handleSwitchChange = (key: string, event: React.SyntheticEvent<Element, Event>) => {
        const value = (event.target as HTMLInputElement).checked
        //debouncedSave(target, key, value)
        setTarget((prev: Target) => {
            return { ...prev, [key]: value }
        })
    }

    return (
        <Dialog
            maxWidth="lg"
            onClose={() => props.handleClose()}
            open={props.open}

        >
            <DialogTitle>TargetEdit</DialogTitle>
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
                                    <Tooltip title="Select semester">
                                        <Autocomplete
                                            disablePortal
                                            id="semester-selection"
                                            value={target.semester ? { label: target.semester } : { label: 'input semester' }}
                                            onChange={(_, value) => handleTextChange('semester', value?.label)}
                                            options={semesters.map((s) => { return { label: s } })}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label="Semester" />}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Select program">
                                        <Autocomplete
                                            disablePortal
                                            id="program-selection"
                                            value={target.prog_id ? { label: target.prog_id } : { label: 'input program' }}
                                            onChange={(_, value) => handleTextChange('prog_id', value?.label)}
                                            options={prog_ids.map((p) => { return { label: p } })}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label="Program" />}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Select PI">
                                        <Autocomplete
                                            disablePortal
                                            id="program-selection"
                                            value={target.pi ? { label: target.pi } : { label: 'input pi' }}
                                            onChange={(_, value) => handleTextChange('pi', value?.label)}
                                            options={pis.map((p) => { return { label: p } })}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label="PI" />}
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
                                align='center'
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
                                marginBottom: '4px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Stack justifyContent='center' spacing={2}>
                                    <Typography
                                        align='center'
                                        noWrap
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
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )

}

export default function TargetEditDialogButton(props: Props) {
    const [open, setOpen] = React.useState(false);
    const { target, setTarget } = props

    React.useEffect(() => {
    }, [props.target])

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
                    <RocketLaunchIcon />
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
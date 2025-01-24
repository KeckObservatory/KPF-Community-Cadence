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
    Typography
} from '@mui/material'
import CatalogButton from '../catalog_button';
import { useCommCadContext } from '../App';
import { ComponentRow } from '../ob_component_table';
import { OBTarget } from '../module_selector';
import { input_label, text_change, TextChangeInput, BaseChangeInput } from '../ob_edit_util';
import { useDebounceCallback } from '../use_debounce_callback';
import { useSnackbarContext } from '../App';


interface Props {
    open: boolean
    target: OBTarget & ComponentRow
    setTarget: (target: OBTarget & ComponentRow) => void
    handleClose: Function
}

export default function TargetForm(props: Props) {
    const componentName = 'target'
    const { target, open, handleClose, setTarget} = props
    const debounced_save = useDebounceCallback<(target: OBTarget & ComponentRow) => void>(setTarget, 1000)
    const target_input_label = (param: string, tooltip = false) => input_label(param, componentName, tooltip)
    const [hasCatalog, setHasCatalog] = React.useState(target.tic_id || target.gaia_id ? true : false)
    const context = useCommCadContext()
    const snackbarContext = useSnackbarContext()

    const baseInput: BaseChangeInput = {
        obs: context.obs,
        setOBs: context.setOBs,
        setSnackbarMessage: snackbarContext.setSnackbarMessage,
        componentName: componentName,
        row: target,
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


    const handleCatalogChange = (tgt: OBTarget) => {
        setHasCatalog(tgt.tic_id || tgt.gaia_id ? true : false)
        //trigger rerender
        handleTextChange('ra', tgt.ra ?? "")
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
                    <CatalogButton target={target} setTarget={handleCatalogChange} hasCatalog={hasCatalog} />
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
                                Target Information
                            </Typography>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={target_input_label('target_name', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('target_name')}
                                        id="target-name"
                                        value={target.target_name}
                                        onChange={(event) => handleTextChange('target_name', event.target.value)}

                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('t_eff', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('t_eff')}
                                        id="t-eff"
                                        value={target.t_eff}
                                        onChange={(event) => handleTextChange('t_eff', event.target.value, true)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={target_input_label('ra', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('ra')}
                                        id="ra"
                                        value={target.ra}
                                        onChange={(event) => handleTextChange('ra', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('dec', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('dec')}
                                        id="dec"
                                        value={target.dec}
                                        onChange={(event) => handleTextChange('dec', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('j_mag', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('j_mag')}
                                        id="j-magnitude"
                                        value={target.j_mag}
                                        onChange={(event) => handleTextChange('j_mag', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('g_mag', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('g_mag')}
                                        id="g-magnitude"
                                        value={target.g_mag}
                                        onChange={(event) => handleTextChange('g_mag', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={target_input_label('parallax', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('parallax')}
                                        id="parallax"
                                        value={target.parallax}
                                        onChange={(event) => handleTextChange('parallax', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('gaia_id', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('gaia_id')}
                                        id="gaia-id"
                                        value={target.gaia_id}
                                        onChange={(event) => handleTextChange('gaia_id', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('tic_id', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('tic_id')}
                                        id="tic"
                                        value={target.tic_id}
                                        onChange={(event) => handleTextChange('tic_id', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('two_mass_id', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('two_mass_id')}
                                        id="two_mass_id"
                                        value={target.two_mass_id}
                                        onChange={(event) => handleTextChange('two_mass_id', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={target_input_label('epoch', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('epoch')}
                                        id="epoch"
                                        value={target.epoch}
                                        onChange={(event) => handleTextChange('epoch', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('equinox', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('equinox')}
                                        id="equinox"
                                        value={target.equinox}
                                        onChange={(event) => handleTextChange('equinox', event.target.value, true)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('d_ra', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('d_ra')}
                                        id="d_ra"
                                        value={target.d_ra}
                                        onChange={(event) => handleTextChange('d_ra', event.target.value, true)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('d_dec', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('d_dec')}
                                        id="d_dec"
                                        value={target.d_dec}
                                        onChange={(event) => handleTextChange('d_dec', event.target.value, true)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={target_input_label('pm_ra', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('pm_ra')}
                                        id="pm-ra"
                                        value={target.pm_ra}
                                        onChange={(event) => handleTextChange('pm_ra', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('pm_dec', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('pm_dec')}
                                        id="pm-dec"
                                        value={target.pm_dec}
                                        onChange={(event) => handleTextChange('pm_dec', event.target.value)}
                                    />
                                </Tooltip>
                                <Tooltip title={target_input_label('systemic_velocity', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('systemic_velocity')}
                                        id="rot-vel"
                                        value={target.systemic_velocity}
                                        onChange={(event) => handleTextChange('systemic_velocity', event.target.value)}
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={target_input_label('catalog_comment', true)}>
                                    <TextField
                                        // focused
                                        label={target_input_label('catalog_comment')}
                                        id="catalog_comment"
                                        value={target.catalog_comment}
                                        onChange={(event) => handleTextChange('catalog_comment', event.target.value)}
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
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import {
    Box,
} from '@mui/material'
import CatalogButton from '../catalog_button';
import { ComponentRow } from '../ob_component_table';
import { OBTarget } from '../component_selector';
import { text_change, TextChangeInput, BaseChangeInput, make_text_field } from '../ob_edit_util';
import { ob_schemas } from '../validation_check_dialog';


interface Props {
    open: boolean
    target: OBTarget & ComponentRow
    setTarget: (target: OBTarget & ComponentRow) => void
    handleClose: Function
}

export default function TargetForm(props: Props) {
    const componentName = 'target'
    const { target, open, handleClose, setTarget} = props
    const [hasCatalog, setHasCatalog] = React.useState(target.tic_id || target.gaia_id ? true : false)
    const schemaProperties = ob_schemas[componentName].properties

    const baseInput: BaseChangeInput = {
        row: target,
        saveFunction: setTarget 
    }

    const handleTextChange = (key: string, value: string | number, isNumber = false) => {
        console.log('text change', key, value)
        if (key === 'gaia_id' || key === 'tic_id') {
            console.log('catalog change', value)
            setHasCatalog((value as string).length>0 ? true : false)
        }
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


    const handleCatalogChange = (tgt: OBTarget & ComponentRow) => {
        setHasCatalog(tgt.tic_id || tgt.gaia_id ? true : false)
        //trigger rerender
        setTarget(tgt)
    }


    const CreateTextField = (key: string, isNumber = false, width?: string) => {
        return make_text_field(key, target, componentName, handleTextChange, isNumber, width)
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
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('target_name', false, '400px')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('t_eff')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('ra')}
                                {CreateTextField('dec')}
                                {CreateTextField('j_mag')}
                                {CreateTextField('g_mag')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('parallax')}
                                {CreateTextField('tic_id')}
                                {CreateTextField('two_mass_id')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('gaia_id', false, '400px')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('epoch')}
                                {CreateTextField('equinox')}
                                {CreateTextField('d_ra')}
                                {CreateTextField('d_dec')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('pm_ra')}
                                {CreateTextField('pm_dec')}
                                {CreateTextField('systemic_velocity')}
                            </Stack>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                {CreateTextField('catalog_comment', false, '400px')}
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}
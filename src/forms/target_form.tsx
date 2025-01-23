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
import CatalogButton from '../catalog_button';
import { MuiChipsInput } from 'mui-chips-input';
import { useCommCadContext } from './App';
import target_schema from './schemas/cc_target_schema.json'
import { ComponentRow, OBComponentName } from './ob_component_table';
import { OBComponent } from './module_selector';
import { OBTarget } from '../module_selector';


interface Props {
    open: boolean
    target: OBTarget 
    setTarget: Function
    handleClose: Function
}

export default function TargetForm(props: Props) {
    const { open, target, setTarget, handleClose } = props
    return <div></div>
}
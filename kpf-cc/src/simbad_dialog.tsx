
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ApprovalIcon from '@mui/icons-material/Approval';
import VerifiedIcon from '@mui/icons-material/Verified';
// import NewReleaseIcon from '@mui/icons-material/NewReleases';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import target_schema from './target_schema.json'
import AJV2019, { ErrorObject } from 'ajv/dist/2019'
import { Target } from './target_view';
import { IconButton } from '@mui/material';
import { get_simbad } from './api/api_root';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';


export interface SimpleDialogProps {
    open: boolean;
    handleClose: Function;
    simbadOutput?: string
    targetName?: string
}

export interface Props {
    targetName?: string 
}

function ValidationDialog(props: SimpleDialogProps) {
    const { open, handleClose } = props;
    return (
        <Dialog maxWidth="lg" onClose={() => handleClose()} open={open}>
            <DialogTitle>{`Simbad Output for Target named ${props.targetName}`}</DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    {props.simbadOutput}
                </Typography>
            </DialogContent>
        </Dialog>
    );
}


export default function SimbadDialogButton(props: Props) {
    const [open, setOpen] = React.useState(false);
    const [simbadOutput, setSimbadOutput] = React.useState('')
    const { targetName } = props

    const handleClickOpen = () => {
        console.log('handleClickOpen target', targetName)
        targetName && get_simbad(targetName).then((simbad_output) => {
            setSimbadOutput(simbad_output)
            setOpen(true);
        })
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Tooltip title={`View simbad info for target ${targetName}`}>
                <IconButton onClick={handleClickOpen}>
                    <ModeStandbyIcon />
                </IconButton>
            </Tooltip>
            <ValidationDialog
                open={open}
                handleClose={handleClose}
                simbadOutput={simbadOutput}
                targetName={targetName}
            />
        </>
    );
}
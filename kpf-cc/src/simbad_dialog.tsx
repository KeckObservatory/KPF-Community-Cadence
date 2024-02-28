
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

            let bibcodesSection = false
            let identifiersSection = false
            let allNames: string[] = []
            let ra = ""
            let dec = ""
            let pmEpoch = ""
            let sysRv = ""
            let fluxG = ""
            let fluxJ = ""
            let pmRa = ""
            let pmDec = ""
            const simbadLines = simbad_output.split('\n')
            for (let line of simbadLines) {
                line.startsWith('Bib') && (bibcodesSection = true)
                line.startsWith('Identifiers (') && (identifiersSection = true)
                if (line.startsWith('Coordinates(ICRS')) {
                    ra = line.split(': ')[1].split(' ').slice(0, 3).join(':')
                    dec = line.split(': ')[1].split(' ').slice(4, 7).join(':')
                    pmEpoch = line.split('=')[1].split(',')[0]
                }
                else if (line.startsWith('Radial Velocity')) {
                    sysRv = line.split(' ')[2].replace(' ', '')
                }
                else if (line.startsWith('Flux J')) {
                    fluxJ = line.split(': ')[1].split(' ')[0]
                }
                else if (line.startsWith('Flux G')) {
                    fluxG = line.split(': ')[1].split(' ')[0]
                }
                else if (line.startsWith('Proper motions')) {
                    const [pmRa, pmDec] = line.split(' ').slice(2,4);
                }
                else if (identifiersSection 
                    && bibcodesSection===false
                    && (line.includes('Gaia') || line.includes('TIC'))) {
                    console.log('identifer line', line);
                    let ticMatch = line.match(new RegExp('TIC\\s\\w+'))
                    const tic = ticMatch ? ticMatch[0].split(' ')[1] : "" 
                    let gaiaMatch = line.match(new RegExp('Gaia\\s\\w+\\s\\w+'))
                    const gaia = gaiaMatch ? gaiaMatch[0].split(' ')[1] : ""
                    const dr = gaiaMatch ? gaiaMatch[0].split(' ')[2] : ""
                    console.log('TIC', tic, 'Gaia', gaia, 'DR', dr)
                    }
                    ;
                }

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
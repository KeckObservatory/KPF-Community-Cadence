
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
// import NewReleaseIcon from '@mui/icons-material/NewReleases';
import { IconButton } from '@mui/material';
import { get_simbad } from './api/api_root';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import { Target } from './target_view';


export interface SimpleDialogProps {
    open: boolean;
    handleClose: Function;
    simbadOutput?: SimbadTargetData
    targetName?: string
}

export interface Props {
    target: Target 
    setTarget: Function
}

export const ra_dec_to_deg = (time: string | number, dec = false): number => {
    //if float return
    if (typeof time === 'number') { //already stored as degree
        return time
    }

    let deg = 0;
    let sigfig = 3;
    (time as string).includes('+') || (time as string).includes('-') && (dec = true)
    try {
        let [hours, min, sec] = (time as string).split(':')
        sigfig = sec.split('.')[1].length
        if (dec) {
            const decDeg = Number(hours)
            let sign = Math.sign(decDeg)
            deg = decDeg // dec is already in degrees
                + sign * Number(min) / 60
                + sign * Number(sec) / 3600
        }

        else {
            deg = Number(hours) * 15 // convert hours to deg
                + Number(min) / 4
                + Number(sec) / 240
        }
    }
    finally {
        return Number(deg.toFixed(sigfig))
    }
}

export interface SimbadTargetData {
    ra?: string,
    dec?: string,
    ra_deg?: number,
    dec_deg?: number,
    pm_ra?: number,
    pm_dec?: number,
    epoch?: string,
    tic?: string,
    j_mag?: number,
    g_mag?: number,
    sys_rv?: number
    identifiers?: { [key: string]: string }
}

function ValidationDialog(props: SimpleDialogProps) {
    const { open, handleClose } = props;
    return (
        <Dialog maxWidth="lg" onClose={() => handleClose()} open={open}>
            <DialogTitle>{`Simbad Output for Target named ${props.targetName}`}</DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    {JSON.stringify(props.simbadOutput)}
                </Typography>
            </DialogContent>
        </Dialog>
    );
}

export const get_simbad_data = async (targetName: string): Promise<SimbadTargetData> => {
    const simbad_output = await get_simbad(targetName)
    let bibcodesSection = false
    let identifiersSection = false
    const simbadData: SimbadTargetData = {}
    const identifiers: { [key: string]: string } = {}

    const simbadLines = simbad_output.split('\n')
    for (let line of simbadLines) {
        line.startsWith('Bib') && (bibcodesSection = true)
        line.startsWith('Identifiers (') && (identifiersSection = true)
        if (line.startsWith('Coordinates(ICRS')) {
            simbadData['ra'] = line.split(': ')[1].split(' ').slice(0, 3).join(':')
            simbadData['dec'] = line.split(': ')[1].split(' ').slice(4, 7).join(':')
            simbadData['ra_deg'] = ra_dec_to_deg(simbadData['ra'])
            simbadData['dec_deg'] = ra_dec_to_deg(simbadData['dec'], true)
            simbadData['epoch'] = line.split('=')[1].split(',')[0]
        }
        else if (line.startsWith('Radial Velocity')) {
            const sysRv = Number(line.split(' ')[2].replace(' ', ''))
            sysRv && (simbadData['sys_rv'] = sysRv)
        }
        else if (line.startsWith('Flux J')) {
            const fluxJ = Number(line.split(': ')[1].split(' ')[0])
            fluxJ && (simbadData['j_mag'] = fluxJ)
        }
        else if (line.startsWith('Flux G')) {
            const fluxG = Number(line.split(': ')[1].split(' ')[0])
            fluxG && (simbadData['g_mag'] = fluxG)
        }
        else if (line.startsWith('Proper motions')) {
            const [pmRa, pmDec] = line.split(' ').slice(2, 4);
            Number(pmRa) && (simbadData['pm_ra'] = Number(pmRa))
            Number(pmDec) && (simbadData['pm_dec'] = Number(pmDec))
        }
        else if (identifiersSection
            && bibcodesSection === false
            && (line.includes('Gaia') || line.includes('TIC'))) {
            let ticMatch = line.match(new RegExp('TIC\\s\\w+'))
            const tic = ticMatch ? ticMatch[0].split(' ')[1] : ""
            let gaiaMatch = line.match(new RegExp('Gaia\\s\\w+\\s\\w+'))
            const dr = gaiaMatch ? gaiaMatch[0].split(' ')[1] : ""
            const gaia = gaiaMatch ? gaiaMatch[0].split(' ')[2] : ""
            tic && (identifiers['tic'] = tic)
            gaia && (identifiers['gaia_' + dr.toLocaleLowerCase()] = gaia)
        }
        ;
    }
    simbadData['identifiers'] = identifiers
    return simbadData
}


export default function SimbadDialogButton(props: Props) {
    const [open, setOpen] = React.useState(false);
    const [simbadOutput, setSimbadOutput] = React.useState({} as SimbadTargetData)
    const { target, setTarget } = props
    const targetName = target.target_name 

    const handleClickOpen = async () => {
        if (targetName) {
            const simbadData = await get_simbad_data(targetName)
            setSimbadOutput(simbadData)
            setTarget( {...target, ...simbadData} )
            setOpen(true);
        }
    }

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
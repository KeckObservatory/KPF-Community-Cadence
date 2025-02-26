import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Tooltip } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { ob_schemas } from './validation_check_dialog';
import { useCommCadContext, useSnackbarContext } from './App';

interface Props {
    setOBs: Function
}

interface UploadProps extends Props {
    label: string
    setLabel?: Function,
    setOpen?: Function
}

const mapEntries = Object.entries(ob_schemas).map(([ckey, schema]) => {
    const properties = schema.properties as { [key: string]: { translator_mapping: string } }
    const k2kComponentEntries = Object.entries(properties).map(([key, value]) => {
        return [value.translator_mapping ?? key, key] as [string, string]
    })
    const KeyToKeyMapping = Object.fromEntries(k2kComponentEntries)
    return [ckey, KeyToKeyMapping]
})


const map = Object.fromEntries(mapEntries)
const componentNames = Object.keys(ob_schemas).filter(name => name !== 'calibration')

const swap_translator_ob_to_ob_keys = (OB: { [key: string]: { [key: string]: object } }) => {
    //converts inported OB to swap translator_mapping and component keys
    const obEntries = Object.entries(OB).map(([ckey, Component]) => {
        const componentEntries = Object.entries(Component).map(([Key, value]) => {
            return [map[ckey][Key], value]
        })
        const component = Object.fromEntries(componentEntries)
        return [ckey, component]
    })
    const ob = Object.fromEntries(obEntries)
    return ob
}

export function UploadComponent(props: UploadProps) {

    const snackbarContext = useSnackbarContext()
    const context = useCommCadContext()

    const parse_json = (contents: string) => {
        const OBS = JSON.parse(contents)
        //@ts-ignore
        const obs = OBS.map(OB => swap_translator_ob_to_ob_keys(OB)) as OB[]
        //check obs are valid
        obs.forEach(ob => {
            componentNames.forEach(ckey => {
                if (!ob[ckey]) {
                    const msg = `Component ${ckey} not found in OB for target${ob.target?.target_name}. Fix and reupload`
                    console.warn(msg)
                    snackbarContext.setSnackbarMessage({ severity: 'error', message: msg })
                    throw new Error(msg)
                }
            })
            // check that semid correct semid is present
            if (!context.semid.includes(ob.metadata.semid)) {
                const msg = `OB for target ${ob.target?.target_name} ${ob.metadata.semid} does not equal selected semid ${context.semid}`
                console.warn(ob.semester, msg)
                snackbarContext.setSnackbarMessage({ severity: 'error', message: msg })
                throw new Error(msg)
            }
        })
        //assign default values?
        console.log('translator obs', OBS, 'converted obs', obs)
        return obs
    }

    const fileLoad = (evt: React.ChangeEvent<HTMLInputElement>) => {
        let file: File = new File([], 'empty')
        evt.target?.files && (file = evt.target?.files[0])
        props.setLabel && props.setLabel(`${file.name} Uploaded`)
        const ext = file.name.split('.').pop()?.toLowerCase()
        console.log('file', file, ext)
        const fileReader = new FileReader()
        fileReader.readAsText(file, "UTF-8");
        fileReader.onload = e => {
            const contents = e.target?.result as string
            const obs = ext?.includes('json') ? parse_json(contents) : []
            props.setOpen && props.setOpen(false)
            console.log('obs from file:', obs)
            props.setOBs(obs)
        };
    };

    return (
        <>
            <input
                accept="*.json"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                multiple
                onChange={fileLoad}
            />
            <label htmlFor="raised-button-file">
                <Button variant="outlined" component="span" color="primary"
                >
                    {props.label}
                </Button>
            </label>
        </>
    )

}

export default function UploadDialog(props: Props) {
    const [open, setOpen] = React.useState(false);
    const [label, setLabel] = React.useState("Upload OBs");

    const handleClickOpen = () => {
        setOpen(true);
    };


    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Tooltip title="Upload Observing Blocks from .json file">
                <Button onClick={handleClickOpen} startIcon={<UploadIcon />}>
                    {label}
                </Button>
            </Tooltip>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Upload OBs from .json"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Select the file to upload
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <UploadComponent
                        label={label}
                        setLabel={setLabel}
                        setOpen={setOpen}
                        setOBs={props.setOBs}
                    />
                </DialogActions>
            </Dialog>
        </div>
    );
}

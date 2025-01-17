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
import { JSONSchema7 } from 'json-schema';

interface Props {
    setOBs: Function
}

interface UploadProps extends Props {
    label: string
    setLabel?: Function,
    setOpen?: Function
}

const invert_ob= (OB: {[key: string]: unknown} ) => {
    //converts inported OB to swap translator_mapping and component keys
    Object.keys(ob_schemas).map(key => {
        //@ts-ignore
        const schema = ob_schemas[key] as unknown as JSONSchema7
        const properties = schema.properties as { [key: string]: { translator_mapping: string } }
        const KeyToKeyMapping = Object.fromEntries(Object.entries(properties).map(([key, value]) => {
            return [value.translator_mapping, key]
        }))
        const convertedComponent = Object.fromEntries(Object.entries(OB).map(([key, value]) => {
            return [KeyToKeyMapping[key], value]
        }))
        return convertedComponent
    })
}

export function UploadComponent(props: UploadProps) {

    const parse_json = (contents: string) => {
        const OBS = JSON.parse(contents)
        //@ts-ignore
        const obs = OBS.map(OB => invert_ob(OB)) as OB[]
        console.log('translator obs', OBS)
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

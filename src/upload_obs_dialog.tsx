import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Tooltip } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { JSONSchema7 } from 'json-schema';
import target_schema from './schemas/cc_target_schema.json'
import ob_target_schema from './schemas/ob_target_schema.json'
import { OBTarget } from './module_selector';

interface Props {
    setOBs: Function
}

interface UploadProps extends Props {
    label: string
    setLabel?: Function,
    setOpen?: Function
}

interface OBPropertySchema extends JSONSchema7 {
    description: string
    short_description: string
    not_editable_by_user?: boolean
}

let ob_target_schama = ob_target_schema as unknown as OBPropertySchema

const properties = ob_target_schama.properties as { [key: string]: OBPropertySchema }

const hdrToKeyMapping =
    Object.fromEntries(Object.entries(properties).map(([key, value]) => {
        return [value.short_description ?? value.description, key as keyof OBTarget]
    }))

const convertValue = (value: string, key: keyof OBTarget) => {
    const type = properties[key].type 
    const isNumber = type?.includes('number') || type?.includes('integer')
    const isBoolean = type?.includes('boolean')
    if (isBoolean) {
        if (['true', 'yes', '1'].includes(value.toLowerCase())) {
            return true
        }
        else if ( ['false', 'no', '0'].includes(value.toLowerCase()) ) {
            return false
        }
        else {
            return null
        }
    }
    else {
        const formattedValue = key==='dec' || isNumber ? value.replace("'", "") : value //remove leading apostrophe for negative numbers
        return isNumber ? parseFloat(formattedValue) : formattedValue 
    }
}

export function UploadComponent(props: UploadProps) {

    const parse_json = (contents: string) => {
        const obs = JSON.parse(contents) as OBTarget[]
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
            const obs = ext?.includes('.json') ? parse_json(contents) : []
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

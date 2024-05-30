import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Tooltip } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { Target } from './App';
import { JSONSchema7 } from 'json-schema';
import target_schema from './target_schema.json'

interface Props {
    setTargets: Function
}

interface UploadProps extends Props {
    label: string
    setLabel?: Function,
    setOpen?: Function
}

interface TargetPropertySchema extends JSONSchema7 {
    description: string
    short_description: string
}

let tgt_schama = target_schema as unknown as TargetPropertySchema

const properties = tgt_schama.properties as { [key: string]: TargetPropertySchema }

const hdrToKeyMapping =
    Object.fromEntries(Object.entries(properties).map(([key, value]) => {
        return [value.short_description ?? value.description, key as keyof Target]
    }))

export function UploadComponent(props: UploadProps) {

    const parse_csv = (contents: string) => {
        const [header, ...lines] = contents.split('\n')
            .map(s => s.replace('\r', '').split(','))
        const tgts = lines.map((item) => {
            const tgt = {} as Target;
            header.forEach((desc, index) => {
                const key = hdrToKeyMapping[desc] as keyof Target
                tgt[key] = item.at(index) as keyof Target[keyof Target]
            });
            return tgt;
        });
        return tgts
    }

    const fileLoad = (evt: React.ChangeEvent<HTMLInputElement>) => {
        let file: File = new File([], 'empty')
        evt.target?.files && (file = evt.target?.files[0])
        props.setLabel && props.setLabel(`${file.name} Uploaded`)
        const ext = file.name.split('.').pop()
        console.log('file', file, ext)
        const fileReader = new FileReader()
        fileReader.readAsText(file, "UTF-8");
        fileReader.onload = e => {
            const contents = e.target?.result as string
            const tgts = ext?.includes('csv') ? parse_csv(contents) : []
            props.setOpen && props.setOpen(false)
            console.log('tgts', tgts)
            props.setTargets(tgts)
        };
    };

    return (
        <>
            <input
                accept="*.csv"
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
    const [label, setLabel] = React.useState("Upload Targets");

    const handleClickOpen = () => {
        setOpen(true);
    };


    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Tooltip title="Upload Targets from .csv file">
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
                <DialogTitle id="alert-dialog-title">{"Upload Targets from .csvfile"}</DialogTitle>
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
                        setTargets={props.setTargets}
                        />
                </DialogActions>
            </Dialog>
        </div>
    );
}

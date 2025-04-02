import * as React from 'react';
import PublishIcon from '@mui/icons-material/Publish';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useSnackbarContext } from './App';
import { DialogComponent } from './dialog_component';
import { OB } from './module_selector';
import { Button, Typography } from '@mui/material';
//import { delete_target, submit_target } from './api/api_root';
import { submit_obs } from './api/api_root';



export interface VTDProps {
    open: boolean;
    handleClose: Function;
    obs: OB[];
    setOBs: Function;
}

interface Props {
    obs: OB[];
    disabled: boolean;
    setOBs: Function;
    color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

function SubmitOBs(props: { obs: OB[], setOBs: Function }) {
    const { obs, setOBs } = props;
    const snackbarContext = useSnackbarContext()

    const onSubmitClick = async () => {
        const resp = await submit_obs(obs)
        if (resp.status !== 'SUCCESS') {
            console.error('error deleting ob', resp)
            snackbarContext.setSnackbarMessage({ severity: 'error', message: `Error submitting targets ${resp}` })
        }
        else {
            setOBs((oldOBs: OB[]) => {
                const newOBs = oldOBs.map((ob: OB) => resp.observing_blocks.find((o: OB) => o._id.includes(ob._id)) ?? ob)
                return newOBs
            });

        }
    }

    const targetList = obs.map((ob, index) => {
        return (
            <div key={index}>
                {ob.target.target_name}
            </div>
        );
    });

    return (
        <div>
            <Button disabled={disabled} onClick={onSubmitClick}>Confirm Submit?</Button>
            <Typography>OBs to be Submitted:</Typography>
            {targetList}
        </div>
    );
}

function SubmitOBsDialog(props: VTDProps) {
    const { open, handleClose, obs, setOBs } = props;

    const dialogTitle = (
        <div>Submit OBs</div>
    );

    const dialogContent = (
        <SubmitOBs obs={obs} setOBs={setOBs} />
    )

    return (
        <DialogComponent
            open={open}
            handleClose={handleClose}
            titleContent={dialogTitle}
            children={dialogContent}
            maxWidth="sm"
        />
    );
}

export default function SubmitDialogButton(props: Props) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    let tooltipMsg = "Submit selected target(s)"
    if (props.disabled) {
        tooltipMsg += " (No targets selected)"
    }
    return (
        <>
            <Tooltip title={tooltipMsg}>
                <span>
                    <IconButton disabled={props.disabled} aria-label="help" color={props.color ?? 'default'} onClick={handleClickOpen}>
                        <PublishIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <SubmitOBsDialog
                open={open}
                setOBs={props.setOBs}
                obs={props.obs}
                handleClose={handleClose}
            />
        </>
    );
}
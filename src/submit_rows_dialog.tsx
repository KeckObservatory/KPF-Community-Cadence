import * as React from 'react';
import PublishIcon from '@mui/icons-material/Publish';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useCommCadContext, useRefreshTableContext, useSnackbarContext } from './App';
import { DialogComponent } from './dialog_component';
import { OB } from './module_selector';
import { Button, Typography } from '@mui/material';
//import { delete_target, submit_target } from './api/api_root';
import { get_obs, submit_obs } from './api/api_root';



export interface VTDProps {
    open: boolean;
    handleClose: Function;
    obs: OB[];
}

interface Props {
    obs: OB[];
    disabled: boolean;
    color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}


function SubmitOBs(props: { obs: OB[] }) {
    const { obs } = props;
    const snackbarContext = useSnackbarContext()
    const context = useCommCadContext()
    const refreshContext = useRefreshTableContext()

    const onSubmitClick = async () => {
        const resp = await submit_obs(obs)
        if (resp.success !== 'SUCCESS') {
            console.error('error submitting obs', resp)
            snackbarContext.setSnackbarMessage({ severity: 'error', message: `Error submitting targets ${resp}` })
            return
        }
        refreshContext.setRefreshTable(refreshContext.refreshTable + 1)

        const handleGetOBs = async (semester?: string, semid?: string) => {

            const resp = await get_obs(semester, semid);
            console.log('get_obs response', resp)

            if (resp.success !== 'SUCCESS') {
            snackbarContext.setSnackbarMessage({
                severity: 'error',
                message: `Failed to get OBs. Details: ${resp.message}`
            })
            return
            }

            context.setOBs(resp.observing_blocks ?? [])
            context.setTotalHours(resp.total_hours ?? 0)
            context.setTotalObservations(resp.total_observations ?? 0)
        }

        handleGetOBs(context.semester, context.semid)
        // window.location.reload() //TODO: remove this big hammer.

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
            <Button variant='contained' onClick={onSubmitClick}>Confirm Submit?</Button>
            <Typography>OBs to be Submitted:</Typography>
            {targetList}
        </div>
    );
}

function SubmitOBsDialog(props: VTDProps) {
    const { open, handleClose, obs } = props;

    const dialogTitle = (
        <div>Submit OBs</div>
    );

    const dialogContent = (
        <SubmitOBs obs={obs} />
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
                obs={props.obs}
                handleClose={handleClose}
            />
        </>
    );
}
import * as React from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useSnackbarContext } from './App';
import { DialogComponent } from './dialog_component';
import { OB } from './module_selector';
import { Button, Typography } from '@mui/material';
//import { delete_target, submit_target } from './api/api_root';
import { delete_obs, submit_obs } from './api/api_root';
import { useCommCadContext } from './App';



export interface VTDProps {
  open: boolean;
  handleClose: Function;
  obs: OB[];
  setOBs: Function;
}

interface Props {
  obs: OB[];
  setOBs: Function;
  disabled: boolean;
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

function DeleteOBs(props: { obs: OB[], setOBs: Function }) {
  const { obs, setOBs } = props;
  const snackbarContext = useSnackbarContext()
  const [enableUndo, setEnableUndo] = React.useState(false);
  const [deletedOBs, setDeletedOBs] = React.useState<OB[]>([]);
  const context = useCommCadContext()

  const onDeleteClick = async () => {
    let delOB: OB[] = []
    obs.forEach(async (ob) => {
      const resp = await delete_obs(ob._id)
      if (resp.success !== 'SUCCESS') {
        delOB.push(ob)
        snackbarContext.setSnackbarMessage({ severity: 'error', message: 'Error deleting targets' })
      }
    })
    console.log('deleted obs', delOB)
    const delIds = delOB.map((ob) => ob._id)
    setDeletedOBs(delOB)
    context.setOBs((oldOBs: OB[]) => {
      const remOBs = oldOBs.filter((ob: OB) => !delIds.includes(ob._id))
      console.log('remaining OBS', remOBs)
      return remOBs
    });
    setEnableUndo(true)
  }

  const onUndoClick = async () => {
    const resp = await submit_obs(deletedOBs)
    if (resp.errors.length > 0) {
      console.error('error while undoing target delete', resp)
      const msg = 'error when undoing deleted targets: ' + resp.errors.join(', ')
      snackbarContext.setSnackbarMessage({ severity: 'error', message: msg })
      return
    }
    snackbarContext.setSnackbarMessage({ severity: 'info', message: 'Resubmitted deleted targets' })
    setOBs((oldOBs: any) => {
      return [...deletedOBs, ...oldOBs]
    });
    setEnableUndo(false)
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
      <Button onClick={onDeleteClick}>Confirm Delete?</Button>
      {enableUndo && (
        <Button onClick={onUndoClick}>Undo Delete?</Button>
      )}
      <Typography>OBs to be deleted:</Typography>
      {targetList}
    </div>
  );
}

function DeleteOBsDialog(props: VTDProps) {
  const { open, handleClose, obs, setOBs } = props;

  const dialogTitle = (
    <div>Delete OBs</div>
  );

  const dialogContent = (
    <DeleteOBs obs={obs} setOBs={setOBs} />
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

export default function DeleteDialogButton(props: Props) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  let tooltipMsg = "Delete selected target(s)"
  if (props.disabled) {
    tooltipMsg += " (No targets selected)"
  }

  return (
    <>
      <Tooltip title={tooltipMsg}>
        <span>
          <IconButton disabled={props.disabled} aria-label="help" color={props.color ?? 'default'} onClick={handleClickOpen}>
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>
      <DeleteOBsDialog
        open={open}
        setOBs={props.setOBs}
        obs={props.obs}
        handleClose={handleClose}
      />
    </>
  );
}

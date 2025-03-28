import * as React from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useSnackbarContext } from './App';
import { DialogComponent } from './dialog_component';
import { OB } from './module_selector';
import { Button, Typography } from '@mui/material';
//import { delete_target, submit_target } from './api/api_root';
import { delete_obs, submit_obs} from './api/api_root';



export interface VTDProps {
  open: boolean;
  handleClose: Function;
  obs: OB[];
  setOBs: Function;
}

interface Props {
  obs: OB[];
  setOBs: Function;
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

function DeleteOBs(props: { obs: OB[], setOBs: Function }) {
  const { obs, setOBs} = props;
  const snackbarContext = useSnackbarContext()
  const [enableUndo, setEnableUndo] = React.useState(false);
  const [deletedOBs, setDeletedOBs] = React.useState<OB[]>([]);

  const onDeleteClick = async () => {
    const ids = obs.map((ob) => ob._id);
    ids.forEach(async (id) => {
        const resp = await delete_obs(id)
        if (resp.status !== 'SUCCESS') {
        console.error('error deleting ob', resp)
        snackbarContext.setSnackbarMessage({ severity: 'error', message: 'Error deleting targets' })
        }
    })
    setDeletedOBs(obs)
    setOBs((oldOBs: OB[]) => {
      const newOBs= oldOBs.filter((ob: OB) => !ids.includes(ob._id))
      return newOBs 
    });
    setEnableUndo(true)
  }

  const onUndoClick = async () => {
    const resp = await submit_obs(deletedOBs)
    if (resp.errors.length>0) {
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
  const { open, handleClose, obs, setOBs} = props;

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

  return (
    <>
      <Tooltip title="Delete selected target(s)">
        <IconButton aria-label="help" color={props.color ?? 'default'} onClick={handleClickOpen}>
          <DeleteIcon />
        </IconButton>
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
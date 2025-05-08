import * as React from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useRefreshTableContext, useSnackbarContext } from './App';
import { DialogComponent } from './dialog_component';
import { OB } from './module_selector';
import { Button, Typography } from '@mui/material';
//import { delete_target, submit_target } from './api/api_root';
import { delete_obs } from './api/api_root';
import { useCommCadContext } from './App';



export interface VTDProps {
  open: boolean;
  handleClose: Function;
  selectedOBs: OB[];
  setDeletedOBs: Function;
}

interface Props {
  selectedOBs: OB[];
  disabled: boolean;
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

interface DeleteOBProps {
  selectedOBs: OB[];
  setDeletedOBs: Function;
}

function DeleteOBs(props: DeleteOBProps) {
  const { selectedOBs, setDeletedOBs } = props;
  const [enableUndo, setEnableUndo] = React.useState(false);

  const onDeleteClick = async () => {
    setDeletedOBs(selectedOBs)
    setEnableUndo(true)
  }

  const onUndoClick = async () => {
    setDeletedOBs([])
    setEnableUndo(false)
  }

  const targetList = selectedOBs.map((ob, index) => {
    return (
      <div key={index}>
        {ob.target.target_name}
      </div>
    );
  });

  return (
    <div>
      {enableUndo ? (
        <Button onClick={onUndoClick}>OBs will be deleted upon closing this dialog window. Undo?</Button>
      ) : (
        <Button variant='contained' onClick={onDeleteClick}>Confirm Delete?</Button>
      )}
      <Typography>OBs to be deleted:</Typography>
      {targetList}
    </div>
  );
}

function DeleteOBsDialog(props: VTDProps) {
  const { open, handleClose, selectedOBs, setDeletedOBs } = props;

  const dialogTitle = (
    <div>Delete OBs</div>
  );

  const dialogContent = (
    <DeleteOBs selectedOBs={selectedOBs} setDeletedOBs={setDeletedOBs}/>
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

  const context = useCommCadContext()
  const refreshContext = useRefreshTableContext()
  const snackbarContext = useSnackbarContext()

  const [deletedOBs, setDeletedOBs] = React.useState<OB[]>([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = async () => {
    let delOB: OB[] = []
    for (let idx = 0; idx < deletedOBs.length; idx++) {
      const ob = deletedOBs[idx]
      const resp = await delete_obs(ob._id)
      if (resp.success !== 'SUCCESS') {
        console.error('error while deleting target', resp)
        const msg = 'error when deleting targets: ' + resp.errors.join(', ')
        snackbarContext.setSnackbarMessage({ severity: 'error', message: msg })
        continue 
      }
      delOB.push(ob)
    }

    //update table view
    const delIds = delOB.map((ob) => ob._id)
    const remOBs = context.obs.filter((ob: OB) => {
      return !delIds.includes(ob._id)
    });
    console.log('deleted obs', delOB)
    setDeletedOBs(delOB)
    context.setOBs(remOBs);
    refreshContext.setRefreshTable(refreshContext.refreshTable + 1)
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
          <IconButton  disabled={props.disabled} aria-label="help" color={props.color ?? 'default'} onClick={handleClickOpen}>
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>
      <DeleteOBsDialog
        open={open}
        selectedOBs={props.selectedOBs}
        setDeletedOBs={setDeletedOBs}
        handleClose={handleClose}
      />
    </>
  );
}

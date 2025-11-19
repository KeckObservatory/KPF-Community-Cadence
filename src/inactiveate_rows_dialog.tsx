import AcUnitIcon from '@mui/icons-material/AcUnit';
import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useRefreshTableContext, useSnackbarContext } from './App';
import { DialogComponent } from './dialog_component';
import { OB } from './module_selector';
import { Button, Typography } from '@mui/material';
//import { delete_target, submit_target } from './api/api_root';
import { delete_obs, submit_obs } from './api/api_root';
import { useCommCadContext } from './App';



export interface VTIProps {
  open: boolean;
  handleClose: Function;
  selectedOBs: OB[];
  setInactiveOBs: Function;
}

interface Props {
  selectedOBs: OB[];
  disabled: boolean;
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

interface InactiveOBProps {
  selectedOBs: OB[];
  setInactiveOBs: Function;
}

function InactiveOBs(props: InactiveOBProps) {
  const { selectedOBs, setInactiveOBs } = props;
  const [enableUndo, setEnableUndo] = React.useState(false);

  const onClick = async () => {
    setInactiveOBs(selectedOBs)
    setEnableUndo(true)
  }

  const onUndoClick = async () => {
    setInactiveOBs([])
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
        <Button onClick={onUndoClick}>OBs will be inactive upon closing this dialog window. Undo?</Button>
      ) : (
        <Button variant='contained' onClick={onClick}>Confirm Inactivate?</Button>
      )}
      <Typography>OBs to be Inactivated:</Typography>
      {targetList}
    </div>
  );
}

function InactiveOBsDialog(props: VTIProps) {
  const { open, handleClose, selectedOBs, setInactiveOBs } = props;

  const dialogTitle = (
    <div>Inactivate OBs</div>
  );

  const dialogContent = (
    <InactiveOBs selectedOBs={selectedOBs} setInactiveOBs={setInactiveOBs}/>
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

export default function InactivateDialogButton(props: Props) {
  const [open, setOpen] = React.useState(false);

  const context = useCommCadContext()
  const refreshContext = useRefreshTableContext()
  const snackbarContext = useSnackbarContext()

  const [inactiveOBs, setInactiveOBs] = React.useState<OB[]>([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = async () => {
    const obs = inactiveOBs.map((ob) => {
      return {
        ...ob,
        metadata: {
          ...ob.metadata,
          ob_inactive: true
        }
      }
    })
    const resp = await submit_obs(obs)
    if (resp.success !== 'SUCCESS') {
      console.error('error while inactivating OBs', resp)
      const msg = 'error when inactivating OBs: ' + resp.errors.join(', ')
      snackbarContext.setSnackbarMessage({ severity: 'error', message: msg })
      return
    }

    //update table view
    const remOBs = context.obs.filter((ob: OB) => {
      return !obs.map(ob => ob._id).includes(ob._id)
    });
    console.log('inactive obs', obs)
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
            <AcUnitIcon/>
          </IconButton>
        </span>
      </Tooltip>
      <InactiveOBsDialog
        open={open}
        selectedOBs={props.selectedOBs}
        setInactiveOBs={setInactiveOBs}
        handleClose={handleClose}
      />
    </>
  );
}

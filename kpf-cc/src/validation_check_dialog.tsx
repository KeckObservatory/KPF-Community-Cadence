import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ApprovalIcon from '@mui/icons-material/Approval';
import VerifiedIcon from '@mui/icons-material/Verified';
// import NewReleaseIcon from '@mui/icons-material/NewReleases';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import target_schema from './target_schema.json'
import AJV2019, { ErrorObject } from 'ajv/dist/2019'
import { Target } from './target_view';
import { IconButton } from '@mui/material';


export interface SimpleDialogProps {
  open: boolean;
  handleClose: Function;
  errors: ErrorObject<string, Record<string, any>, unknown>[];
}

export interface Props {
  target: Target
}

function ValidationDialog(props: SimpleDialogProps) {
  const { open, handleClose } = props;
  return (
    <Dialog maxWidth="lg" onClose={() => handleClose()} open={open}>
      <DialogTitle>Target Validation Errors</DialogTitle>
      <DialogContent dividers>
        {
          props.errors.map((err) => {
            let msg = err.message
            if (err.keyword === 'required') {
              msg = `${err.params.missingProperty}: ${err.message}`
            }
            if (err.keyword === 'type') {
            msg = `${err.instancePath.substring(1)}: ${err.message}`
            }
            return (
              <Typography gutterBottom>
                {msg}
              </Typography>)
          })
      }
      </DialogContent>
    </Dialog>
  );
}


export default function ValidationDialogButton(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [errors, setErrors] = React.useState([] as ErrorObject<string, Record<string, any>, unknown>[]);
  const [icon, setIcon] = React.useState(<ApprovalIcon />)
  const { target } = props

  const ajv = new AJV2019({allErrors:true})

  let ts = target_schema as any
  delete ts["$schema"]
  const validate = ajv.compile(ts)

  React.useEffect(() => {
    validate(target)
    if (validate.errors) {
      setErrors(validate.errors)
      setIcon(<LocalFireDepartmentIcon color="warning" />)
    }
    else {
      setIcon(<VerifiedIcon color="success" />)
    }
  }, [props.target])


  const handleClickOpen = () => {
    validate(target)
    if (validate.errors) {
      console.log(validate.errors)
      setErrors(validate.errors)
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Select to see target validation errors (if any)">
        <IconButton onClick={handleClickOpen}>
          {icon}
        </IconButton>
      </Tooltip>
      <ValidationDialog
        open={open}
        handleClose={handleClose}
        errors={errors}
      />
    </>
  );
}
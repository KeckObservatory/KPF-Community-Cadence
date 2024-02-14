import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import target_schema from './target_schema.json'
import AJV2019, { ErrorObject } from 'ajv/dist/2019'
import { Target } from './target_view';


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
    <Dialog onClose={() => handleClose()} open={open}>
      <DialogTitle>Target Validation Errors</DialogTitle>
      <DialogContent dividers>
        {
          props.errors.map((err) => {
            return (
              <Typography gutterBottom>
                {err.message}
              </Typography>)
          })
      }
      </DialogContent>
    </Dialog>
  );
}

type Verified = 'verified' | 'unverified' | 'invalid'

export default function ValidationDialogButton(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [verified, setVerified] = React.useState('unverified' as Verified);
  const [errors, setErrors] = React.useState([] as ErrorObject<string, Record<string, any>, unknown>[]);
  const { target } = props

  const ajv = new AJV2019({allErrors:true})

  React.useEffect(() => {
    setVerified('unverified')
  }, [props.target])

  const handleClickOpen = () => {
    console.log('target', target)
    let ts = target_schema as any
    delete ts["$schema"]
    // delete ts["required"]
    const validate = ajv.compile(ts)
    validate(target)
    if (validate.errors) {
      console.log(validate.errors)
      setErrors(validate.errors)
      setVerified('invalid')
      setOpen(true);
    }
    else {
      setVerified('verified')
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  let txt = verified.includes('unverified') ? "Validate Target" : `Target Valid \u{1F60C}`
  txt = verified.includes('invalid') ? `Target Invalid \u{1F525}` : txt

  return (
    <>
      <Tooltip title="Select for a big wall of text">
        <Button aria-label="help" color="primary" onClick={handleClickOpen} variant="contained">
          {txt}
        </Button>
      </Tooltip>
      <ValidationDialog
        open={open}
        handleClose={handleClose}
        errors={errors}
      />
    </>
  );
}
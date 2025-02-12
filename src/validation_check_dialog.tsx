import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ApprovalIcon from '@mui/icons-material/Approval';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AJV2019, { ErrorObject, ValidateFunction, JSONSchemaType } from 'ajv/dist/2019'
import { IconButton } from '@mui/material';
// import * as ob_schema from './schemas/observing_block_schema.json'
import * as calibration_schema from './schemas/calibration_schema.json'
import * as schedule_schema from './schemas/schedule_data_schema.json'
import * as ob_target_schema from './schemas/ob_target_schema.json'
import * as observation_schema from './schemas/observation_schema.json'
import * as metadata_schema from './schemas/metadata_schema.json'
import { OB } from './module_selector';
import { OBComponentName } from './ob_component_table';
import { Metadata, Observation, OBTarget, Schedule, Calibration } from './module_selector';

export interface SimpleDialogProps {
  open: boolean;
  handleClose: Function;
  errors: ErrorObject<string, Record<string, any>, unknown>[];
}

export interface Props {
  errors: ErrorObject<string, Record<string, any>, unknown>[];
  json: OB | Object
}

const create_validator = (schema: any) => {
  const ajv = new AJV2019({ strict: false, allErrors: true, useDefaults: true })
  let ts = schema as any
  delete ts["$schema"]
  ajv.addKeyword("short_description")
  ajv.addKeyword("not_editable_by_user")
  ajv.addKeyword("translator_mapping")
  ajv.addKeyword("hide_column")
  return ajv.compile(ts)
}

export type Validators = OBComponentName

interface Items extends PropertyProps {
    properties?: { [key: string]: PropertyProps }
}

export interface PropertyProps {
    description: string,
    type: string | string[],
    short_description?: string,
    default?: unknown,
    pattern?: string,
    minLength?: number,
    maxLength?: number,
    not_editable_by_user?: boolean,
    hide_column?: boolean,
    enum?: string[],
    items?: Items
    translator_mapping?: string
}

const calibration = calibration_schema as unknown as JSONSchemaType<Calibration>
const ob_target = ob_target_schema as unknown as JSONSchemaType<OBTarget>
const observation = observation_schema as unknown as JSONSchemaType<Observation>
const metadata = metadata_schema as unknown as JSONSchemaType<Metadata>
const schedule = schedule_schema as unknown as JSONSchemaType<Schedule>

export const ob_schemas: Record<string, any> = {
  "calibration": calibration,
  "schedule": schedule,
  "target": ob_target,
  "observation": observation,
  "metadata": metadata
}

export const validators: Record<Validators, ValidateFunction> = {
  "calibration": create_validator(calibration),
  "schedule": create_validator(schedule),
  "target": create_validator(ob_target),
  "observation": create_validator(observation),
  "metadata": create_validator(metadata)
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
            if (err.keyword === 'type' || err.keyword === 'pattern') {
              msg = `${err.instancePath.substring(1)}: ${err.message}`
            }
            if (err.keyword === 'minimum' || err.keyword === 'maximum') {
              msg = `${err.instancePath.substring(1)}: ${err.message}`
            }
            if (err.keyword === 'enum') {
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
  const [icon, setIcon] = React.useState(<ApprovalIcon />)

  React.useEffect(() => {
    if (props.errors.length > 0) {
      setIcon(<LocalFireDepartmentIcon color="warning" />)
    }
    else {
      setIcon(<VerifiedIcon color="success" />)
    }
  }, [props.json, props.errors])


  const handleClickOpen = () => {
    if (props.errors.length > 0) {
      console.log(props.errors)
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Select to see target validation errors">
        <IconButton onClick={handleClickOpen}>
          {icon}
        </IconButton>
      </Tooltip>
      <ValidationDialog
        open={open}
        handleClose={handleClose}
        errors={props.errors}
      />
    </>
  );
}
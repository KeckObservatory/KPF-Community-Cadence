import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/Edit';
import { ComponentRow, OBComponentName } from './ob_component_table';
import TargetForm from './forms/target_form';
import CalibrationForm from './forms/calibration_form';
import ScheduleForm from './forms/schedule_form';
import ObservationForm from './forms/observation_form';
import MetadataForm from './forms/metadata_form';

interface Props {
    row: ComponentRow,
    setRow: (row: ComponentRow) => void
    componentName: OBComponentName
}

// interface OBEditProps extends Props {
//     handleClose: Function
//     open: boolean
// }


export default function OBEditDialogButton(props: Props) {
    const [open, setOpen] = React.useState(false);
    const { row, componentName, setRow } = props

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const setForm = (componentName: OBComponentName) => {
        switch (componentName) {
            case 'target': {
                return <TargetForm
                    open={open}
                    target={row}
                    setTarget={setRow}
                    handleClose={handleClose}
                />
            }
            case 'calibration': {
                return <CalibrationForm
                    open={open}
                    calibration={row}
                    setCalibration={setRow}
                    handleClose={handleClose}
                />
            }
            case 'schedule': {
                return <ScheduleForm
                    open={open}
                    schedule={row}
                    setSchedule={setRow}
                    handleClose={handleClose}
                />
            }
            case 'observation': {
                return <ObservationForm
                    open={open}
                    observation={row}
                    setObservation={setRow}
                    handleClose={handleClose}
                />
            }
            case 'metadata': {
                return <MetadataForm
                    open={open}
                    metadata={row}
                    setMetadata={setRow}
                    handleClose={handleClose}
                />
            }
            default: {
                console.error(`Invalid component ${componentName}`)
                break;
            }
        }

    }

    return (
        <>
            <Tooltip title="Select to edit target in dialog window">
                <IconButton onClick={handleClickOpen}>
                    <EditIcon />
                </IconButton>
            </Tooltip>
            {setForm(componentName)}
        </>
    );
}
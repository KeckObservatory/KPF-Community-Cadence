import * as React from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { UploadComponent } from './upload_targets_dialog';
import { get_simbad_data } from './simbad_button';
import { Target } from './target_view';
import { Control } from './control';
import { useCommCadContext } from './App';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { submit_target } from './api/api_root';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';


interface Props {
    setOpen: Function
    open: boolean
}


function LinearProgressWithLabel(props: LinearProgressProps &
{
    targetNames: string[]
    setTargets: Function,
    open: boolean
}
) {

    const context = useCommCadContext()
    const [targetName, setTargetName] = React.useState('')
    const [label, setLabel] = React.useState('Create Targets')

    const { targetNames, setTargets, open } = props
    const [progress, setProgress] = React.useState(0)
    const generate_targets_from_list = async () => {
        const tgts: Target[] = []
        for (let idx = 0; idx < targetNames.length; idx++) {
            const tgtName = targetNames[idx]
            setTargetName(tgtName)
            console.log(tgtName)
            if (!tgtName) continue
            if (!open) break
            const target: Target = {
                semester: context.semester ?? "",
                prog_id: context.progId ?? "",
                pi: context.pi ?? "",
                target_name: targetName
            }
            const simbadData = await get_simbad_data(tgtName)
            tgts.push({ ...target, ...simbadData })
            setProgress(((idx + 1) / targetNames.length) * 100)
        }

        setProgress(100)
        setTargets(tgts)
        setLabel('Targets Created')
    }
    return (
        <>
            <Button onClick={generate_targets_from_list}>{label}</Button>
            {targetName && (
                <Typography variant="body2" color="text.secondary">
                    {targetName}
                </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" value={progress} {...props} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{`${Math.round(
                        progress,
                    )}%`}</Typography>
                </Box>
            </Box>
        </>
    );
}


const TargetStepper = (props: Props) => {

    const [activeStep, setActiveStep] = React.useState(0);
    const [label, setLabel] = React.useState("Load Target Names");
    const [targetNames, setTargetNames] = React.useState([] as string[])
    const [targets, setTargets] = React.useState([] as Target[])
    const context = useCommCadContext()
    const [canContinue, setCanContinue] = React.useState(false)
    const [ saveMessage, setSaveMessage ] = React.useState('All steps completed - Targets are ready to be saved')


    React.useEffect(() => {
        console.log(targets.length, activeStep)
        let cont = false
        if (activeStep === 0) { cont = (context.semester && context.progId && context.pi)? true : false}
        if (activeStep === 1) { cont = targetNames.length > 0 }
        if (activeStep === 2) { 
            cont = targets.length > 0
            setSaveMessage('All steps completed - Targets are ready to be saved')
         }
        setCanContinue(cont)
    }, [context, targetNames, targets, activeStep])

    const save_targets = async () => {
        console.log('saving targets')
        console.log(targets)
        const resp = await submit_target(targets)
        console.log(resp)
        if (resp.success === 'SUCCESS') {
            props.setOpen(false)
        }
        else {
            console.error('Failed to save targets', resp)
            setSaveMessage(`Failed to save targets: ${resp.details}`)
        }
    }

    const setTargetsAndContinue = (targets: Target[]) => {
        setTargets(targets)
        setCanContinue(true)
    }

    const setTargetNamesAndContinue = (names: string[]) => {
        setTargetNames(names)
        setCanContinue(true)
    }


    const stepComponents = [
        {
            label: 'Select Semester, Program, and PI',
            component: <Control />
        },
        {
            label: 'Select File',
            component: <UploadComponent
                setLabel={setLabel}
                label={label}
                setTargetNames={setTargetNamesAndContinue} />
        },
        {
            label: 'Create Targets',
            component: <LinearProgressWithLabel
                targetNames={targetNames}
                setTargets={setTargetsAndContinue}
                open={props.open} />
        },
    ]

    const handleNext = () => {
        setCanContinue(false)
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Box sx={{ maxWidth: 1200, minWidth: 600 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {stepComponents.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            optional={
                                index === 2 ? (
                                    <Typography variant="caption">Last step</Typography>
                                ) : null
                            }
                        >
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Box sx={{ mb: 2 }}>
                                <Stack>
                                    {step.component}
                                    <>
                                        <Button
                                            disabled={!canContinue}
                                            variant="contained"
                                            onClick={handleNext}
                                            sx={{ mt: 1, mr: 1 }}
                                        >
                                            {index === stepComponents.length - 1 ? 'Finish' : 'Continue'}
                                        </Button>
                                        <Button
                                            disabled={index === 0}
                                            onClick={handleBack}
                                            sx={{ mt: 1, mr: 1 }}
                                        >
                                            Back
                                        </Button>
                                    </>
                                </Stack>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === stepComponents.length && (
                <Paper square elevation={0} sx={{ p: 3 }}>
                    <Typography>{saveMessage}</Typography>
                    <Button onClick={save_targets} sx={{ mt: 1, mr: 1 }}>
                        Save Targets
                    </Button>
                    <Button
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                    >
                        Back
                    </Button>
                </Paper>
            )}
        </Box>
    );
}

interface DialogProps {
    open: boolean
    onClose: Function
    setOpen: Function
}

export const TargetWizardDialog = (props: DialogProps) => {

    const { onClose, open, setOpen } = props;

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>Target Wizard</DialogTitle>
            <TargetStepper open={open} setOpen={setOpen} />
        </Dialog>
    )
}

export const TargetWizardButton = () => {

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <div>
            {/* <Button sx={{ width: "100%" }} variant="contained" onClick={handleClickOpen}>
                New Targets from csv
            </Button> */}
            <Tooltip title="Upload Targets from .csv file">
                <Button onClick={handleClickOpen} startIcon={<UploadIcon />}>
                    Upload Targets
                </Button>
            </Tooltip>
            <TargetWizardDialog
                open={open}
                setOpen={setOpen}
                onClose={handleClose}
            />
        </div>
    )
}
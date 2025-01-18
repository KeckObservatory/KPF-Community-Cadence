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
import { get_simbad_and_gaia_target_info } from './catalog_button';
import { Control } from './control';
import { useCommCadContext, useRefreshTableContext, useSnackbarContext, Target } from './App';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { save_target } from './api/api_root';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import { create_new_target } from './target_table';
// import Autocomplete from '@mui/material/Autocomplete';
// import TextField from '@mui/material/TextField';


interface Props {
    setOpen: Function
    open: boolean
}

// const CATALOGS = ['SIMBAD', 'NONE']


function LinearProgressWithLabel(props: LinearProgressProps &
{
    targets: Target[]
    setTargets: Function,
    open: boolean
    catalog: string
}
) {

    const context = useCommCadContext()
    const [targetName, setTargetName] = React.useState('')
    const [label, setLabel] = React.useState('Create Targets')

    const { targets, setTargets, open, catalog } = props
    const [progress, setProgress] = React.useState(0)
    const generate_targets_from_list = async () => {
        setLabel('Loading Targets')
        const tgts: Target[] = []
        for (let idx = 0; idx < targets.length; idx++) {
            const csvTarget = targets[idx]
            const tgtName = csvTarget.target_name ?? false
            console.log(tgtName)
            if (!tgtName) continue
            setTargetName(tgtName)
            if (!open) break

            const baseTarget = create_new_target(
                context.semid ?? "",
                undefined,
                tgtName)
            let newTarget = { ...baseTarget, ...csvTarget }
            if (catalog !== 'NONE' || !csvTarget.tic_id ) { // if no tic or gaia id, get catalog data
                const catalogTargetInfo = await get_simbad_and_gaia_target_info
                // fill with base, then catalog data, then target uploaded from csv
                newTarget = { ...baseTarget, ...catalogTargetInfo, ...csvTarget } as Target
            }
            tgts.push(newTarget)
            setProgress(((idx + 1) / targets.length) * 100)
        }

        setProgress(100)
        setTargets(tgts)
        setLabel('Targets Created')
    }
    return (
        <>
            <Button
                disabled={label.includes('Loading')}
                onClick={generate_targets_from_list}>
                {label}
            </Button>
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
    const [catalog, _] = React.useState("SIMBAD");
    const [targets, setTargets] = React.useState([] as Target[])
    const context = useCommCadContext()
    const refreshTableContext = useRefreshTableContext()
    const [canContinue, setCanContinue] = React.useState(false)
    const [saveMessage, setSaveMessage] = React.useState('All steps completed - Targets are ready to be saved')

    const snackbarContext = useSnackbarContext()

    React.useEffect(() => {
        let cont = false
        if (activeStep === 0) { cont = (context.semid) ? true : false }
        if (activeStep === 1) { cont = targets.length > 0 }
        // if (activeStep === 2) { cont = targets.length > 0 } //Uncomment for catalog step
        // if (activeStep === 3) {
        //     cont = targets.length > 0
        //     setSaveMessage('All steps completed - Targets are ready to be saved')
        // }
        if (activeStep === 2) { //Comment if catalog step is uncommented
            cont = targets.length > 0
            setSaveMessage('All steps completed - Targets are ready to be saved')
        }
        setCanContinue(cont)
    }, [context, targets, activeStep])

    const save_targets = async () => {
        const resp = await save_target(targets, context.semid ?? '')
        if (resp.success === 'SUCCESS') {
            props.setOpen(false)
            context.setTargets([...context.targets, ...resp.targets])
            context.setTotalHours(resp.total_hours)
            refreshTableContext.setRefreshTable((prev: number) => { return prev + 1 })
            context.setTotalObservations(resp.total_observations)
            snackbarContext.setSnackbarMessage(
                { severity: 'success', message: `Targets saved!` }
            )
        }
        else {
            console.error('Failed to save targets', resp)
            setSaveMessage(`Failed to save targets: ${resp.details}`)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `Target not submitted. Details: ${resp.details}` }
            )
        }
    }

    const setTargetsAndContinue = (targets: Target[]) => {
        setTargets(targets)
        setCanContinue(true)
    }


    const stepComponents = [
        {
            label: 'Select Semid',
            component: <Control />
        },
        {
            label: 'Select File',
            component: <UploadComponent
                setLabel={setLabel}
                label={label}
                setTargets={setTargetsAndContinue}
            />
        },
        // {
        //     label: 'Select Catalog',
        //     component:
        //         <Tooltip placement="top" title="Select Catalog to autofill missing target information">
        //             <Autocomplete
        //                 disablePortal
        //                 id="catalog-selection"
        //                 value={{ label: catalog ?? 'SIMBAD' }}
        //                 onChange={(_, value) => setCatalog(value?.label ?? 'SIMBAD')} //TODO: should default be 'NONE'?
        //                 options={CATALOGS.map((s) => { return { label: s } })}
        //                 sx={{ width: 300 }}
        //                 renderInput={(params) => <TextField {...params} label="Catalog" />}
        //             />
        //         </Tooltip>
        // },
        {
            label: 'Create Targets',
            component: <LinearProgressWithLabel
                targets={targets}
                setTargets={setTargetsAndContinue}
                catalog={catalog}
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
                                index === stepComponents.length - 1 ? (
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
            <Tooltip title="Upload Targets from .csv or .txt file">
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
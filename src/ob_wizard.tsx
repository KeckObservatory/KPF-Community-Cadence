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
import { UploadComponent } from './upload_obs_dialog';
import { get_simbad_and_gaia_target_info} from './simbad_button';
import { Control } from './control';
import { useCommCadContext, useRefreshTableContext, useSnackbarContext } from './App';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { save_obs } from './api/api_root';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import { create_new_ob } from './ob_component_table'
import { OB } from './module_selector';


interface Props {
    setOpen: Function
    open: boolean
}

// const CATALOGS = ['SIMBAD', 'NONE']


function LinearProgressWithLabel(props: LinearProgressProps &
{
    obs: OB[]
    setOBs: Function,
    open: boolean
    catalog: string
}
) {

    const context = useCommCadContext()
    const [obName, setOBName] = React.useState('')
    const [label, setLabel] = React.useState('Create OBs')

    const { obs, setOBs, open, catalog } = props
    const [progress, setProgress] = React.useState(0)
    const newOBs = [] as OB[]
    const generate_obs_from_list = async () => {
        setLabel('Loading OBs')
        for (let idx = 0; idx < obs.length; idx++) {
            const ob = obs[idx]
            const tgtName = ob.target?.target_name ?? false
            console.log(tgtName)
            if (!tgtName) continue
            setOBName(tgtName)
            if (!open) break

            const baseOB = create_new_ob(
                context.semid ?? "",
                context.obsid,
                tgtName)
            let newOB: OB
            if (catalog !== 'NONE' || !ob.target?.tic_id || !ob.target?.gaia_id) { // if no tic or gaia id, get catalog data
                const catalogTargetInfo = await get_simbad_and_gaia_target_info(tgtName)
                // fill with base, then catalog data, then OB uploaded from json 
                const catalogTarget = { ...ob.target, ...catalogTargetInfo}
                newOB = { ...baseOB, ...ob, target: catalogTarget} as OB 
            }
            else {
                newOB = { ...baseOB, ...ob} as OB
            }
            newOBs.push(newOB)
            setProgress(((idx + 1) / obs.length) * 100)
        }

        setProgress(100)
        setOBs(newOBs)
        setLabel('OBs Created')
    }
    return (
        <>
            <Button
                disabled={label.includes('Loading')}
                onClick={generate_obs_from_list}>
                {label}
            </Button>
            {obName && (
                <Typography variant="body2" color="text.secondary">
                    {obName}
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


const OBStepper = (props: Props) => {

    const [activeStep, setActiveStep] = React.useState(0);
    const [label, setLabel] = React.useState("Load OB Names");
    const [catalog, _] = React.useState("SIMBAD");
    const [obs, setOBs] = React.useState([] as OB[])
    const context = useCommCadContext()
    const refreshTableContext = useRefreshTableContext()
    const [canContinue, setCanContinue] = React.useState(false)
    const [saveMessage, setSaveMessage] = React.useState('All steps completed - OBs are ready to be saved')

    const snackbarContext = useSnackbarContext()

    React.useEffect(() => {
        let cont = false
        if (activeStep === 0) { cont = (context.semid) ? true : false }
        if (activeStep === 1) { cont = obs.length > 0 }
        // if (activeStep === 2) { cont = obs.length > 0 } //TODO: Uncomment for catalog step when vizier is implemented
        // if (activeStep === 3) {
        //     cont = obs.length > 0
        //     setSaveMessage('All steps completed - OBs are ready to be saved')
        // }
        if (activeStep === 2) { //TODO: Comment if catalog step is uncommented
            cont = obs.length > 0
            setSaveMessage('All steps completed - OBs are ready to be saved')
        }
        setCanContinue(cont)
    }, [context, obs, activeStep])

    const handle_save_obs = async () => {
        const resp = await save_obs(obs)
        if (resp.observing_blocks.length === obs.length) {
            props.setOpen(false)
            context.setOBs([...context.obs, ...resp.observing_blocks])
            context.setTotalHours(resp.total_hours)
            refreshTableContext.setRefreshTable((prev: number) => { return prev + 1 })
            context.setTotalObservations(resp.total_observations)
            snackbarContext.setSnackbarMessage(
                { severity: 'success', message: `OBs saved!` }
            )
        }
        else {
            console.error('Failed to save any/all OBs', resp)
            setSaveMessage(`Failed to save ${obs.length} OBs: ${resp.details}`)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `OBs not submitted. Details: ${resp.details}` }
            )
        }
    }

    const setOBsAndContinue = (obs: OB[]) => {
        setOBs(obs)
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
                setOBs={setOBsAndContinue}
            />
        },
        // {
        //     label: 'Select Catalog',
        //     component:
        //         <Tooltip placement="top" title="Select Catalog to autofill missing ob information">
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
            label: 'Create OBs',
            component: <LinearProgressWithLabel
                obs={obs}
                setOBs={setOBsAndContinue}
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
                    <Button onClick={handle_save_obs} sx={{ mt: 1, mr: 1 }}>
                        Save OBs 
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

export const OBWizardDialog = (props: DialogProps) => {

    const { onClose, open, setOpen } = props;

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>OB Wizard</DialogTitle>
            <OBStepper open={open} setOpen={setOpen} />
        </Dialog>
    )
}

export const OBWizardButton = () => {

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <div>
            <Tooltip title="Upload OBs from .json file">
                <Button onClick={handleClickOpen} startIcon={<UploadIcon />}>
                    Upload OBs 
                </Button>
            </Tooltip>
            <OBWizardDialog
                open={open}
                setOpen={setOpen}
                onClose={handleClose}
            />
        </div>
    )
}
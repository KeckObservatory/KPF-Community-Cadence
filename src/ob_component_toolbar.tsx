import AddIcon from '@mui/icons-material/Add';
import {
    GridToolbarContainer,
    GridRowModel,
    GridToolbar,
    GridToolbarProps,
    ToolbarPropsOverrides,
} from '@mui/x-data-grid-pro';

import { ob_schemas, Validators, validators } from './validation_check_dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DeleteDialogButton from './delete_rows_dialog';
import SubmitDialogButton from './submit_rows_dialog';

import { ErrorObject } from 'ajv'
import { useDebounceCallback } from './use_debounce_callback';
import { save_obs } from './api/api_root';
import { OBWizardButton } from './ob_wizard';
import { ComponentRow, OBComponentName } from './ob_component_table';
import { Metadata, OB, OBComponent, Observation, OBTarget, Schedule } from './module_selector';
import { useCommCadContext, useSnackbarContext } from './App';
import { ob_to_component_row } from './ob_edit_util';
import Box from '@mui/material/Box';
import { DashboardButton } from './dashboard/dashboard_button';

export type NewOB = Partial<OB> & {
    _id?: string
}

export interface EditToolbarProps extends GridToolbarProps, ToolbarPropsOverrides {
    setRows: React.Dispatch<React.SetStateAction<ComponentRow[]>>;
    componentName: OBComponentName;
    processRowUpdate: (newRow: GridRowModel, originalRow?: GridRowModel) => ComponentRow;
    selectedRows: ComponentRow[];
}

const exportBlob = (blob: Blob, filename: string) => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    });
};

const getJson = (obs: OB[]) => {
    const json = obs.map((ob) => {
        const keyValueArray = Object.keys(ob_schemas).map((ckey) => {
            let translatedComponent: { [key: string]: unknown } = {}
            // @ts-ignore
            const schema = ob_schemas[ckey]
            Object.keys(schema.properties).forEach(key => {
                const props = schema.properties[key]
                const tkey = props.translator_mapping ?? key
                // @ts-ignore
                ob[ckey][key] && (translatedComponent[tkey] = ob[ckey][key])
            })
            return [ckey, translatedComponent]
        })
        return Object.fromEntries(keyValueArray)
    });
    return json
};

const create_default_component = (componentName: OBComponentName) => {
    let component: Partial<OBComponent> = {}
    Object.entries(ob_schemas[componentName].properties).forEach(([key, properties]) => {
        //@ts-ignore
        properties.default && (component[key] = properties.default)
    })
    return component
}

export const create_new_ob = (semid: string, obsid: number, username: string, target_name?: string) => {

    let target: Partial<OBTarget> = create_default_component('target')
    target.target_name = target_name ?? 'TBD'

    const observation: Partial<Observation> = create_default_component('observation')

    const schedule: Partial<Schedule> = create_default_component('schedule')
    schedule.scheduling_mode = 'Cadence'
    let metadata: Metadata = create_default_component('metadata') as Metadata
    metadata = {
        ...metadata,
        obsid: String(obsid),
        observer_name: username,
        submitter: username,
        semester: semid.split('_')[0],
        progid: semid.split('_')[1],
        semid: semid,
        state: "CREATED",
        status: 'PENDING',
        tags: [],
    }

    const ob: NewOB = {
        target,
        observation,
        schedule,
        calibration: {},
        metadata
    }
    return ob
}



export const EditComponentToolbar = (props: EditToolbarProps) => {
    const { componentName, processRowUpdate, setRows, selectedRows } = props;
    const context = useCommCadContext()
    const snackbarContext = useSnackbarContext()
    const handleAddOB = async () => {
        if (context.semid === undefined) {
            console.error('semid is undefined')
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `semid is undefined` })
            return
        }

        let newOB = create_new_ob(context.semid, context.obsid, context.username) as OB

        const resp = await save_obs([newOB])
        if (resp.observing_blocks.length === 0) {
            console.error('add OB save failed', resp)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `OB not saved. Details: ${resp}` })
            return
        }
        newOB = resp.observing_blocks.at(0)
        newOB.metadata.status = 'SAVED'  //TODO: have backend set this field
        context.setOBs([newOB, ...context.obs])
        processRowUpdate(newOB[componentName])
        const newRow = ob_to_component_row(newOB, componentName)
        setRows((oldRows) => {
            return [newRow, ...oldRows]
        });
    };
    const debouncedAddOB = useDebounceCallback(handleAddOB, 500)

    let selectedOBs = selectedRows.map((row) => {
                            return context.obs.find((ob) => ob._id === row._id)
                          }).filter((ob) => ob !== undefined) as OB[]

    let validSelectedOBs = selectedRows.map((row) => {
        const ob = context.obs.find((ob) => ob._id === row._id)
        if (!ob) {
            return false 
        }
        //ob valid for all components?
        let obErrs: ErrorObject[] = []
        for (const cn in ob) {
            const validator = validators[cn as Validators]
            if (!validator) {
                console.log('validator not found', cn)
                continue
            }
            const comp = ob[cn as keyof OB] as OBComponent
            if (!comp) {
                return false //MISSING COMPONENT 
            }
            validator(comp)
            const newErrors = validator.errors ?? []
            obErrs = [...newErrors, ...obErrs]
        }
        if (obErrs.length > 0) {
            console.log('ob errors', obErrs)
            return false 
        }
        return ob
    }).filter((ob) => ob !== false) as OB[]
                        
    if (selectedOBs.length === 0) { //TODO: filter out OBs that are not scheduled/have history
        //selectedOBs = context.obs.filter((ob) => ob.metadata.state === 'SUBMITTED')
        selectedOBs = context.obs
    }

    const deletedButtonColor = selectedRows.length > 0 ? 'success' : 'inherit'
    const submitButtonColor = validSelectedOBs.length > 0 ? 'success' : 'inherit'
    const deletedDisabled = selectedRows.length === 0
    const submitDisabled = validSelectedOBs.length <= 0

    return (
        <GridToolbarContainer sx={{ justifyContent: 'center' }}>
            <Box style={{ width: "100%", display: "flex", justifyContent: "space-around", alignItems: "center", marginLeft: "10px" }}>
                <Typography variant="h5">{componentName?.toUpperCase()}</Typography>
                <Box style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Button color="primary" startIcon={<AddIcon />} onClick={debouncedAddOB}>
                        Create New OB
                    </Button>
                    <DeleteDialogButton disabled={deletedDisabled} selectedOBs={selectedOBs} color={deletedButtonColor}/>
                    <SubmitDialogButton disabled={submitDisabled} obs={validSelectedOBs} color={submitButtonColor}/>
                    {selectedOBs.length > 0 && <DashboardButton obs={selectedOBs}/>}
                    <GridToolbar
                        printOptions={{ disableToolbarButton: true }}
                        csvOptions={{ disableToolbarButton: true }}
                    />
                    {/* <CustomExportButton obs={context.obs} /> */}
                    <Button
                        onClick={() => {
                            const json = getJson(context.obs);
                            const blob = new Blob([JSON.stringify(json, null, 2)], {
                                type: 'text/json',
                            });
                            exportBlob(blob, 'obs.json');
                        }}
                    >
                        Export OB to JSON
                    </Button>
                    <OBWizardButton />
                </Box>
            </Box>
        </GridToolbarContainer>
    );
}
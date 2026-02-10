import AddIcon from '@mui/icons-material/Add';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import {
    Toolbar,
    GridRowModel,
    GridToolbarProps,
    ToolbarPropsOverrides,
    ColumnsPanelTrigger,
    FilterPanelTrigger,
    GridDensity
} from '@mui/x-data-grid';
import { Badge } from '@mui/material';

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
import InactivateDialogButton from './inactiveate_rows_dialog';
import { Tooltip } from '@mui/material';

export type NewOB = Partial<OB> & {
    _id?: string
}

export interface EditToolbarProps extends GridToolbarProps, ToolbarPropsOverrides {
    setRows: React.Dispatch<React.SetStateAction<ComponentRow[]>>;
    componentName: OBComponentName;
    processRowUpdate: (newRow: GridRowModel, originalRow?: GridRowModel) => ComponentRow;
    selectedRows: ComponentRow[];
    density: GridDensity;
    onDensityChange: (density: GridDensity) => void;
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
            if (schema.type === 'array') { // no translation for array types. Just return it.
                return [ckey, ob[ckey as keyof OB]]
            }
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

    const handleDensityClick = () => { 
        const densities: GridDensity[] = ['compact', 'standard', 'comfortable'];
        const currentIndex = densities.indexOf(props.density);
        const nextIndex = (currentIndex + 1) % densities.length;
        props.onDensityChange(densities[nextIndex]);
    }

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

    const selectedColor = selectedRows.length > 0 ? 'success' : 'inherit'
    const submitButtonColor = validSelectedOBs.length > 0 ? 'success' : 'inherit'
    const deletedDisabled = selectedRows.length === 0
    const inactivateDisabled = selectedRows.length === 0
    const submitDisabled = validSelectedOBs.length <= 0

    return (
        <Toolbar >
            <Box style={{ width: "100%", display: "flex", justifyContent: "space-around", alignItems: "center", marginLeft: "10px" }}>
                <Typography variant="h5">{componentName?.toUpperCase()}</Typography>
                <Box style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Button color="primary" startIcon={<AddIcon />} onClick={debouncedAddOB}>
                        Create New OB
                    </Button>
                    <>
                        <DeleteDialogButton disabled={deletedDisabled} selectedOBs={selectedOBs} color={selectedColor} />
                        <SubmitDialogButton disabled={submitDisabled} obs={validSelectedOBs} color={submitButtonColor} />
                        <InactivateDialogButton disabled={inactivateDisabled} selectedOBs={selectedOBs} color={selectedColor} />
                    </>
                    <Tooltip title="Columns">
                        <ColumnsPanelTrigger render={<Button />}>
                            <ViewColumnIcon fontSize="small" color="primary" />
                            <Typography variant="body1" color="primary" sx={{ ml: 0.5 }}>
                                COLUMNS
                            </Typography>
                        </ColumnsPanelTrigger>
                    </Tooltip>

                    <Tooltip title="Filters">
                        <FilterPanelTrigger
                            render={(props, state) => {
                                // Omit 'ref' to avoid type error
                                const { ref, ...rest } = props;
                                return (
                                    <Button {...rest} >
                                        <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                                            <FilterListIcon fontSize="small" color="primary" />
                                        </Badge>
                                        <Typography variant="body1" color="primary" sx={{ ml: 0.5 }}>
                                            FILTERS
                                        </Typography>
                                    </Button>
                                );
                            }}
                        />
                    </Tooltip>

                    <Tooltip title={`Density: ${props.density}`}>
                        <Button onClick={handleDensityClick}>
                            <DensityMediumIcon fontSize="small" color="primary" />
                            <Typography variant="body1" color="primary" sx={{ ml: 0.5 }}>
                                DENSITY
                            </Typography>
                        </Button>
                    </Tooltip>

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
        </Toolbar>
    );
}
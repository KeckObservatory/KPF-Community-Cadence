import * as React from 'react';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import PublishIcon from '@mui/icons-material/Publish';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    GridRowsProp,
    GridRowModesModel,
    DataGridPro,
    GridColDef,
    GridToolbarContainer,
    GridRowModel,
    GridToolbar,
    GridValueSetter,
    GridValueParser,
    GridExportMenuItemProps,
    GridToolbarExportContainer,
    GridRowId,
    GridRowModes,
    GridActionsCellItem,
    useGridApiContext,
    GridEventListener,
    useGridApiEventHandler,
    GridRowParams,
} from '@mui/x-data-grid-pro';

import { useDebounceCallback } from './use_debounce_callback';
import { delete_obs, save_obs, submit_obs } from './api/api_root';
import { OBWizardButton } from './ob_wizard';
import { useCommCadContext, useSnackbarContext, useRefreshTableContext } from './App';
import { MetaData, OB, Observation, OBTarget, ScheduleData } from './module_selector';
import { format_edit_entry, format_tags, PropertyProps, raDecFormat, SchemaProps, rowSetter } from './ob_edit_util';
import ValidationDialogButton, { ob_schemas, validators } from './validation_check_dialog';
import MenuItem from '@mui/material/MenuItem';
import Button, { ButtonProps } from '@mui/material/Button';
import { ErrorObject } from 'ajv/dist/2019';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import CatalogButton from './catalog_button';

export type NewOB = Partial<OB> & {
    _id?: string
}
export type OBComponents = "calibration" | "schedule" | "target" | "observation" | "metadata"

interface ComponentRow extends Object {
    isNew?: boolean;
    _id: string;
    target_name_semid: string,
    target_name?: string,
    state: string;
    submitted: boolean;
}

interface EditToolbarProps {
    componentName: OBComponents;
    processRowUpdate: (newRow: GridRowModel, originalRow?: GridRowModel) => ComponentRow;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
}

function convert_schema_to_columns(semids: string[], schemaName: OBComponents) {
    const columns: GridColDef[] = []

    Object.entries(ob_schemas[schemaName].properties).forEach(([key, valueProps]: [string, any]) => {
        const valueParser: GridValueParser = (value: any) => {
            if (['number', 'integer'].includes(valueProps.type)) {
                return Number(value)
            }
            if (value && ['ra', 'dec'].includes(key)) {
                key === 'ra' && String(value).replace(/[^+-]/, "")
                value = raDecFormat(value as string)
            }
            return value
        }

        const valueSetter: GridValueSetter<ComponentRow> = (value: any, cmp: ComponentRow) => {
            cmp = { ...cmp, [key]: value, "state": 'ROW_EDITED' }
            //TODO: add any custom logic here
            return cmp
        }

        let col = {
            field: key,
            valueParser: valueParser,
            valueSetter: valueSetter,
            disableExport: valueProps.not_editable_by_user,
            type: valueProps.type,
            resizable: true,
            headerName: valueProps.short_description ?? valueProps.description,
            width: 100,
            editable: valueProps.not_editable_by_user ? false : true,
            visible: valueProps.hide_column ? true : false,
        } as GridColDef
        if (key === 'semids') {
            col = {
                ...col,
                type: 'singleSelect',
                valueOptions: semids,
            }
        }
        columns.push(col)
    });

    return columns;
}

export const create_new_ob = (semid: string, obsid: number, username: string, target_name?: string) => {
    const target: Partial<OBTarget> = {
        target_name: target_name ?? 'TBD',
    }

    const observation: Partial<Observation> = {
    }

    const schedule: Partial<ScheduleData> = {
        scheduling_mode: 'Cadence',
    }

    const metadata: MetaData = {
        obsid: String(obsid),
        observer_name: username,
        submitter: username,
        semester: semid.split('_')[0],
        progid: semid.split('_')[1],
        semid: semid,
        needs_resubmit: false,
        state: "CREATED",
        status: 'PENDING',
        history: [],
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



function EditComponentToolbar(props: EditToolbarProps) {
    const { componentName, processRowUpdate, setRows } = props;
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
        newOB.metadata.needs_resubmit = false
        newOB.metadata.status = 'SAVED'  //TODO: have backend set this field
        console.log('setting new Obs and rows', newOB, context.obs)
        context.setOBs([newOB, ...context.obs])
        processRowUpdate(newOB[componentName])
        const newRow = ob_to_component_row(newOB, componentName)
        setRows((oldRows) => {
            return [newRow, ...oldRows]
        });
    };
    const debouncedAddOB = useDebounceCallback(handleAddOB, 500)

    return (
        <GridToolbarContainer sx={{ justifyContent: 'center' }}>
            <Box style={{ width: "100%", display: "flex", justifyContent: "space-around", alignItems: "center", marginLeft: "10px" }}>
                <Typography variant="h5">{componentName?.toUpperCase()}</Typography>
                <Box style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Button color="primary" startIcon={<AddIcon />} onClick={debouncedAddOB}>
                        Create New OB
                    </Button>
                    <GridToolbar
                        printOptions={{ disableToolbarButton: true }}
                        csvOptions={{ disableToolbarButton: true }}
                    />
                    <CustomExportButton obs={context.obs} />
                    <OBWizardButton />
                </Box>
            </Box>
        </GridToolbarContainer>
    );
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
    console.log('obs', obs)
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


interface JsonExportMenuItemProps extends GridExportMenuItemProps<{}> {
    obs: OB[];
}

function JsonExportMenuItem(props: JsonExportMenuItemProps) {
    const { hideMenu, obs } = props;
    return (
        <MenuItem
            onClick={() => {
                const json = getJson(obs);
                const blob = new Blob([JSON.stringify(json, null, 2)], {
                    type: 'text/json',
                });
                exportBlob(blob, 'obs.json');
                // Hide the export menu after the export
                hideMenu?.();
            }}
        >
            Export OB to JSON
        </MenuItem>
    );
}


interface ExportButtonProps extends ButtonProps {
    obs: OB[];
}

function CustomExportButton(props: ExportButtonProps) {
    return (
        <GridToolbarExportContainer {...props}>
            <JsonExportMenuItem obs={props.obs} />
        </GridToolbarExportContainer>
    );
}


interface Props {
    componentName: OBComponents,
}

const ob_to_component_row = (ob: OB, componentName: OBComponents): ComponentRow => {
    const _id = ob._id ?? Math.random().toString(36).substring(7)
    const target_name = ob.target?.target_name ?? "TBD"
    const target_name_semid = target_name + '_' + ob.metadata.semid
    const cmp = ob[componentName] as Object
    const state = ob.metadata?.state ?? 'CREATED' //overwrite state with metadata state
    return {
        ...cmp,
        _id,
        target_name,
        target_name_semid,
        state,
        submitted: ob.metadata.submitted ?? false,
    }
}

const row_to_ob_component = (row: ComponentRow, componentName: OBComponents) => {
    //removes row metadata.
    let cmp: Partial<ComponentRow> = { ...row }
    delete cmp._id
    !componentName.includes('target') && delete cmp.target_name
    delete cmp.target_name_semid
    !componentName.includes('metadata') && delete cmp.state
    !componentName.includes('metadata') && delete cmp.submitted
    return cmp
}



export default function OBComponentTable(props: Props) {
    const { componentName } = props
    const context = useCommCadContext()
    const initRows = context.obs.map((ob) => {
        return ob_to_component_row(ob, componentName)
    }) as ComponentRow[];

    const [rows, setRows] = React.useState(initRows);
    const pinnedColumns = { left: ['actions', 'target_name', 'target_name_semid'], right: [] }
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); //warning: do not use when creating a new row.
    const snackbarContext = useSnackbarContext()
    const refreshContext = useRefreshTableContext()

    React.useEffect(() => {
    }, [])

    React.useEffect(() => {
        setTimeout(() => {
            const newRows = context.obs.map((ob) => {
                const _id = ob._id ?? Math.random().toString(36).substring(7)
                const target_name = ob.target?.target_name ?? "TBD"
                const target_name_semid = target_name + '_' + ob.metadata.semid
                const cmp = ob[componentName] as Object
                return {
                    ...cmp,
                    _id,
                    target_name,
                    target_name_semid,
                    submitted: ob.metadata.submitted ?? false,
                }
            }) as ComponentRow[];
            setRows(newRows)
        }, 300)
    }, [refreshContext.refreshTable, context.obs])

    const edit_row = async (row: ComponentRow) => {
        const idx = context.obs.findIndex((ob) => ob._id === row._id)
        const obComponent = row_to_ob_component(row, componentName)
        let newOB = context.obs.at(idx)
        if (!newOB) return
        newOB = { ...newOB, [componentName]: obComponent}
        newOB = rowSetter(newOB, componentName)
        const resp = await save_obs([newOB])
        if (!resp.observing_blocks) {
            console.error('edit ob save failed', resp)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `OB not saved. Details: ${resp.details}` })
        }
        else if (resp.observing_blocks.length === 0) {
            console.error('edit ob save failed', resp)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `OB not saved. Details: ${resp.details}` })
        }
        else {
            const respOB = resp.observing_blocks.at(0)
            snackbarContext.setSnackbarMessage(
                { severity: 'success', message: `OB saved` })
            //replace old ob with saved ob
            context.setOBs(context.obs.map((ob) => ob._id === respOB?._id ? respOB : ob))
        }
        return resp
    }

    const debounced_save = useDebounceCallback(edit_row, 1000)

    const handleEditClick = (_id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [_id]: { mode: GridRowModes.Edit } });
    };

    const processRowUpdate = (newRow: GridRowModel) => {
        //server-side persistance is handled elsewhere. This allows row editing on a form
        const updatedRow = { ...newRow, isNew: false } as ComponentRow;
        setRows(rows.map((row) => (row._id === newRow._id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    let columns = convert_schema_to_columns(context.semids, componentName);

    const target_name_col = {
        field: 'target_name',
        type: 'string',
        resizable: true,
        headerName: 'Target Name',
        width: 100,
    } as GridColDef
    const target_name_semid_col = {
        field: 'target_name_semid',
        type: 'string',
        resizable: true,
        headerName: 'Target-Semid',
        width: 200,
        editable: false,
    } as GridColDef

    columns = [...columns, target_name_col, target_name_semid_col]
    const schema = ob_schemas[componentName]

    const needs_resubmit = (row: ComponentRow, nErrors: number) => {
        return nErrors > 0 && row.state?.includes('SUBMITTED') && !row.submitted
    }

    const handlePublishClick = async (_id: GridRowId, setIconSpin: Function, setEditRow: Function) => {
        setIconSpin(true)
        const ob = context.obs.find((ob) => ob._id === _id)
        if (!ob) {
            console.error('publish failed', ob)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `Target not found for submission.` })
            return
        }
        try {
            const resp = await submit_obs([ob])
            if (resp.success === 'SUCCESS') {
                context.setTotalHours(resp.total_hours)
                context.setTotalObservations(resp.total_observations)
                const submittedOB = resp.observing_blocks.at(0)
                const newRow = ob_to_component_row(submittedOB, componentName)
                console.log('setting submitted row', newRow, submittedOB)
                processRowUpdate(newRow)
                setEditRow(newRow)
                snackbarContext.setSnackbarMessage(
                    { severity: 'success', message: `Target submitted.` })
            }
            else {
                console.error('publish failed', resp)
                snackbarContext.setSnackbarMessage(
                    { severity: 'error', message: `OB not submitted. Details: ${resp.details}` })
            }
        }
        catch (err) {
            console.error('save_target error', err)
        }
        finally {
            setIconSpin(false)
        }
    };

    const ActionsCell = (props: GridRowParams<ComponentRow>) => {
        const { id, row } = props
        const [editRow, setEditRow] = React.useState<ComponentRow>(row);
        validators[componentName](row)
        const [hasGaia, setHasGaia] = React.useState<boolean>(false)
        const [iconSpin, setIconSpin] = React.useState<boolean>(false)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validators[componentName].errors ?? []);
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
        const apiRef = useGridApiContext();

        const format_cell_value = (field: string, value: any, type: string | string[]) => {
            const isNumber = type.includes('number') || type.includes('integer')
            if (type === 'array') {
                value = format_tags(Array.isArray(value) ? value.flat(Infinity) : value.split(','))
            }
            if (type.includes('string')) {
                value = format_edit_entry(field, value, isNumber)
            }
            return value
        }

        const handleRowEvent: GridEventListener<'rowEditStop'> = (params) => {
            //NOTE: Process row update will update all rows, triggering this event for all rows.
            //      Checking if anything changed is a workaround to prevent multiple saves
            setTimeout(() => { //wait for cell to update before setting editTarget
                let sanitizedRow = {} as Partial<ComponentRow>
                //params row is stale, get updated values from apiRef
                const currRow = apiRef.current.getRow(id)
                if (currRow._id !== params.row._id) return //id mismatch
                console.log('currRow', currRow, id)
                let changed = false
                Object.keys(currRow).forEach((key) => {
                    let value = currRow[key as keyof ComponentRow];
                    if (value === undefined) return //skip undefined values
                    const type = (schema.properties as SchemaProps)[key as keyof PropertyProps]?.type
                    value = type ? format_cell_value(key, value, type) : value
                    changed = value !== params.row[key as keyof ComponentRow]
                    sanitizedRow[key as keyof ComponentRow] = value
                })

                //check if changed
                console.log('has anything changed?', changed, params.row, sanitizedRow)
                if (!changed) return
                setEditRow({ ...sanitizedRow, 'state': 'ROW_EDITED' } as ComponentRow)
            }, 300)
        }

        useGridApiEventHandler(apiRef, 'rowEditStop', handleRowEvent)

        const handleRowChange = () => {
            if (count > 0) {
                processRowUpdate(editRow)
                editRow.state?.includes('ROW_EDITED') && debounced_save(editRow)
                debounced_edit_click(id)
                if (componentName.includes('target')) {
                    const tgt = editRow as OBTarget
                    const hasGaia = tgt.gaia_id || tgt.tic_id ? true : false
                    setHasGaia(hasGaia)
                }
            }
        }

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
            handleRowChange()
            validators[componentName](editRow)
            setErrors(validators[componentName].errors ?? [])
            setCount((prev: number) => prev + 1)
        }, [editRow])

        const refreshStyle = iconSpin ? {
            animation: "spin 2s linear infinite",
            "@keyframes spin": {
                "0%": {
                    transform: "rotate(-360deg)",
                },
                "100%": {
                    transform: "rotate(0deg)",
                }
            }
        } : {}

        let publishText = errors.length > 0 ? 'validateCCTarget target before submitting' : 'Submit target for review'
        const resubmit = needs_resubmit(row, errors.length)
        if (resubmit) {
            publishText = 'Resubmit edited target for review'
        }
        const valid = errors.length === 0

        const ob = context.obs.find((ob) => ob._id === id)
        const publishColor = ob?.metadata.state?.includes('SUBMITTED') ? 'success' : 'inherit'

        const firstButton = valid ?
            <Tooltip
                title={publishText}
                placement="top"
                arrow key="publish" >
                <GridActionsCellItem
                    disabled={!valid}
                    icon={resubmit ?
                        <RefreshIcon
                            sx={refreshStyle}
                            color='warning' /> :
                        <PublishIcon
                            sx={refreshStyle}
                            color={publishColor}
                        />
                    }
                    label="Publish"
                    onClick={() => handlePublishClick(id, setIconSpin, setEditRow)}
                    color="inherit"
                /></Tooltip> :
            < ValidationDialogButton errors={errors} json={editRow} />

        let cell = [firstButton]
        if (componentName.includes('target')) {
            cell.push(<CatalogButton hasSimbad={hasGaia} target={editRow} setTarget={setEditRow} />)
        }
        cell.push(
            <Tooltip
                title={"Delete this request"}
                placement="top"
                arrow key="Delete This Target" >
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDeleteClick(id)}
                    color="inherit"
                />
            </Tooltip>
        )

        return cell;
    }

    const addColumns: GridColDef[] = [
        {
            field: 'actions',
            type: 'actions',
            editable: false,
            headerName: 'Actions',
            width: 150,
            resizable: true,
            disableExport: true,
            cellClassName: 'actions',
            getActions: ActionsCell
        }
    ];

    const handleDeleteClick = async (id: GridRowId) => {
        const delRow = rows.find((row) => row._id === id);
        if (!delRow) {
            console.error('delete failed', delRow)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `Target not found for deletion. Details: ${delRow}` })
            return
        }
        const resp = await delete_obs(String(id))
        if (resp.success === 'SUCCESS') {
            setRows(rows.filter((row) => row._id !== id));
            context.setOBs(context.obs.filter((ob) => ob._id !== delRow?._id))
        }
        else {
            console.error('delete failed', resp)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `Target not deleted. Details: ${resp.details}` })
        }

    }

    columns = [...addColumns, ...columns];

    return (
        <Box
            sx={{
                height: 500,
                width: '100%',
                '& .actions': {
                    color: 'text.secondary',
                },
                '& .textPrimary': {
                    color: 'text.primary',
                },
            }}
        >
            <DataGridPro
                rows={rows ?? []}
                getRowId={(row) => row._id}
                editMode={'row'}
                processRowUpdate={processRowUpdate}
                columns={columns}
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                slots={{
                    // @ts-ignore
                    toolbar: EditComponentToolbar,
                }}
                slotProps={{
                    toolbar: {
                        // @ts-ignore
                        setRows,
                        processRowUpdate,
                        componentName,
                    },
                }}
                pinnedColumns={pinnedColumns} />
        </Box>
    );
}
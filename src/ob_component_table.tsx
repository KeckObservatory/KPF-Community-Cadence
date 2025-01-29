import * as React from 'react';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import PublishIcon from '@mui/icons-material/Publish';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
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
    GridRowId,
    GridRowModes,
    GridActionsCellItem,
    useGridApiContext,
    GridEventListener,
    useGridApiEventHandler,
    GridRowParams,
    GridRenderCellParams,
} from '@mui/x-data-grid-pro';

import { useDebounceCallback } from './use_debounce_callback';
import { delete_obs, save_obs, submit_obs } from './api/api_root';
import { OBWizardButton } from './ob_wizard';
import { useCommCadContext, useSnackbarContext, useRefreshTableContext } from './App';
import { Metadata, OB, OBComponent, Observation, OBTarget, Schedule } from './module_selector';
import { format_edit_entry, format_tags, raDecFormat, ob_to_component_row, edit_ob } from './ob_edit_util';
import ValidationDialogButton, { ob_schemas, validators } from './validation_check_dialog';
import Button from '@mui/material/Button';
import { ErrorObject } from 'ajv/dist/2019';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import CatalogButton from './catalog_button';
import Chip from '@mui/material/Chip';
import OBEditDialogButton from './ob_edit_dialog_button';

export type NewOB = Partial<OB> & {
    _id?: string
}
export type OBComponentName = "calibration" | "schedule" | "target" | "observation" | "metadata"

// export interface ComponentRow<OBComponent> {
export interface ComponentRow extends OBComponent {
    isNew?: boolean;
    _id: string;
    target_name_semid: string,
    target_name?: string,
    state: string;
    submitted: boolean;
    ob_feasible?: boolean;
    details: string;
}

interface EditToolbarProps {
    componentName: OBComponentName;
    processRowUpdate: (newRow: GridRowModel, originalRow?: GridRowModel) => ComponentRow;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
}

const ob_feasible_chip = (params: GridRenderCellParams) => {
    let text = params.value == undefined ? 'Unknown'
        : params.value ? 'Feasible'
            : 'Infeasible'
    params.row.details && (text += ": " + params.row.details)
    return (
        <Tooltip
            placement='left'
            title={text}>
            <Chip
                variant="outlined"
                color={
                    params.value == null ? 'warning'
                        : params.value ? 'success'
                            : 'error'
                }
                icon={
                    params.value == null ? <SentimentNeutralIcon />
                        : params.value ? <InsertEmoticonIcon />
                            : <MoodBadIcon />
                }
            />
        </Tooltip>
    )
}

function convert_schema_to_columns(semids: string[], schemaName: OBComponentName) {
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
            resizable: true,
            headerName: valueProps.short_description ?? valueProps.description,
            width: 100,
            editable: valueProps.not_editable_by_user ? false : true,
            visible: valueProps.hide_column ? true : false,
            description: valueProps.description,
            type: valueProps.enum ? 'singleSelect' : valueProps.type,
            valueOptions: valueProps.enum ?? undefined,
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

    const schedule: Partial<Schedule> = {
        scheduling_mode: 'Cadence',
    }

    const metadata: Metadata = {
        obsid: String(obsid),
        observer_name: username,
        submitter: username,
        semester: semid.split('_')[0],
        progid: semid.split('_')[1],
        semid: semid,
        needs_resubmit: false,
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

const format_field_value = (field: string, value: any, type: string | string[]) => {
    const isNumber = type.includes('number') || type.includes('integer')
    if (type.includes('integer')) {
        value = String(value).replace(/[^0-9]/, "")
    }
    if (type === 'array') {
        value = format_tags(Array.isArray(value) ? value.flat(Infinity) : value.split(','))
    }
    if (type.includes('string')) {
        value = format_edit_entry(field, value, type, isNumber)
    }
    return value
}



interface Props {
    componentName: OBComponentName,
}

const check_if_catalog = (row: ComponentRow) => {
    return (row as OBTarget).gaia_id || (row as OBTarget).tic_id ? true : false
}

export default function OBComponentTable(props: Props) {
    const { componentName } = props
    const context = useCommCadContext()
    const initRows = context.obs.map((ob) => {
        return ob_to_component_row(ob, componentName)
    }) as ComponentRow[];

    const [rows, setRows] = React.useState(initRows);
    const pinnedColumns = { left: ['actions', 'target_name', 'target_name_semid'], right: ['ob_feasible'] }
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); //warning: do not use when creating a new row.
    const snackbarContext = useSnackbarContext()
    const refreshContext = useRefreshTableContext()

    React.useEffect(() => {
    }, [])

    React.useEffect(() => {
        setTimeout(() => {
            const newRows = context.obs.map((ob) => {
                const cmp = ob_to_component_row(ob, componentName)
                return cmp
            }) as ComponentRow[];
            setRows(newRows)
        }, 300)
    }, [refreshContext.refreshTable, context.obs])

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

    const debounced_save = useDebounceCallback(edit_ob)

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
        headerName: 'Target_Semid',
        width: 200,
        editable: false,
    } as GridColDef
    const ob_feasible_col = {
        field: 'ob_feasible',
        type: 'boolean',
        resizable: true,
        headerName: 'Feasible',
        width: 80,
        editable: false,
        renderCell: ob_feasible_chip
    } as GridColDef

    columns = [...columns, target_name_col, target_name_semid_col, ob_feasible_col]
    const schema = ob_schemas[componentName]

    const needs_resubmit = (row: ComponentRow, nErrors: number) => {
        return nErrors > 0 && row.state?.includes('SUBMITTED') && !row.submitted
    }

    const handlePublishClick = async (
        _id: GridRowId,
        setIconSpin: Function,
        setEditRow: Function) => {
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
        const [hasCatalog, setHasCatalog] = React.useState<boolean>(check_if_catalog(row))
        const [iconSpin, setIconSpin] = React.useState<boolean>(false)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validators[componentName].errors ?? []);
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
        const apiRef = useGridApiContext();
        const [submitted, setSubmitted] = React.useState<boolean>(row.state?.includes('SUBMITTED') ?? false)

        const setRowWithCadenceChecks = (row: ComponentRow) => {
            //if schedule and num_visits_per_night is 1, set cadence to 0. 
            //This is used by the form edit display updating to match the submitted ob. 
            if (componentName.includes('schedule') && Number(row.num_visits_per_night) === 1) {
                row.num_internight_cadence = 0
                row.num_intranight_cadence = 0
            }
            setEditRow(row)
        }


        const handleRowEvent: GridEventListener<'rowEditStop'> = (params) => {
            //NOTE: Process row update will update all rows, triggering this event for all rows.
            //      Checking if anything changed is a workaround to prevent multiple saves
            setTimeout(() => { //wait for cell to update before setting editTarget
                let sanitizedRow = {} as Partial<ComponentRow>
                //params row is stale, get updated values from apiRef
                const currRow = apiRef.current.getRow(id)
                if (currRow._id !== params.row._id) return //id mismatch
                let changed = false
                Object.keys(currRow).forEach((key) => {
                    let value = currRow[key as keyof ComponentRow];
                    if (value === undefined) return //skip undefined values
                    const type = schema.properties[key]?.type
                    value = type ? format_field_value(key, value, type) : value
                    value !== params.row[key as keyof ComponentRow] && (changed = true)
                    sanitizedRow[key as keyof ComponentRow] = value
                })

                if (!changed) return
                setRowWithCadenceChecks({ ...sanitizedRow, 'state': 'ROW_EDITED' } as ComponentRow)
            }, 300)
        }

        useGridApiEventHandler(apiRef, 'rowEditStop', handleRowEvent)

        const handleRowChange = () => {
            if (count > 0) {
                processRowUpdate(editRow)
                editRow.state?.includes('ROW_EDITED') && debounced_save(editRow, componentName, context.obs, context.setOBs, snackbarContext.setSnackbarMessage)
                debounced_edit_click(id)
                if (componentName.includes('target')) {
                    setHasCatalog(check_if_catalog(editRow))
                }
            }
        }
        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
            handleRowChange()
            validators[componentName](editRow)
            setErrors(validators[componentName].errors ?? [])
            setSubmitted(editRow.state?.includes('SUBMITTED'))
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

        let publishText = errors.length > 0 ? `validate ${componentName} before submitting` : 'Submit OB for review'

        const resubmit = needs_resubmit(row, errors.length)
        if (resubmit) {
            publishText = 'Resubmit edited target for review'
        }
        const valid = errors.length === 0
        const publishColor = submitted ? 'success' : 'inherit'


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
                    onClick={() => handlePublishClick(id, setIconSpin, setRowWithCadenceChecks)}
                    color="inherit"
                /></Tooltip> :
            < ValidationDialogButton errors={errors} json={editRow} />

        let cell = [firstButton]
        console.log('tgt', editRow, row)
        if (componentName.includes('target')) {
            cell.push(<CatalogButton hasCatalog={hasCatalog} target={editRow} setTarget={setEditRow} />)
        }
        cell.push(<OBEditDialogButton
            row={editRow}
            setRow={setRowWithCadenceChecks}
            componentName={componentName}
        />)
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
            width: 150 + 50 * (componentName.includes('target') ? 1 : 0),
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
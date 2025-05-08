import * as React from 'react';
import Box from '@mui/material/Box';
import PublishIcon from '@mui/icons-material/Publish';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import {
    GridRowModesModel,
    DataGridPro,
    GridColDef,
    GridRowModel,
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
    GridPinnedColumnFields,
    GRID_CHECKBOX_SELECTION_COL_DEF,
    GridRowSelectionModel,
} from '@mui/x-data-grid-pro';

import { useDebounceCallback } from './use_debounce_callback';
import { delete_obs, submit_obs } from './api/api_root';
import { useCommCadContext, useSnackbarContext, useRefreshTableContext } from './App';
import { OBComponent, OBTarget, Schedule } from './module_selector';
import { format_edit_entry, format_tags, raDecFormat, ob_to_component_row, edit_ob, adjust_schedule } from './ob_edit_util';
import ValidationDialogButton, { ob_schemas, validators } from './validation_check_dialog';
import { ErrorObject } from 'ajv/dist/2019';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import CatalogButton from './catalog_button';
import Chip from '@mui/material/Chip';
import OBEditDialogButton from './ob_edit_dialog_button';
import { EditToolbarProps, EditComponentToolbar } from './ob_component_toolbar';

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
            //add any custom logic here
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
        const visible = valueProps.show_column === false ? false : true
        visible && columns.push(col)
    });

    return columns;
}



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

const needs_resubmit = (row: ComponentRow, nErrors: number) => {
    return nErrors > 0 || !row.state.includes('SUBMITTED')
}

export default function OBComponentTable(props: Props) {
    const { componentName } = props
    const context = useCommCadContext()
    const initRows = context.obs.map((ob) => {
        return ob_to_component_row(ob, componentName)
    }) as ComponentRow[];

    const [rows, setRows] = React.useState(initRows);
    let pinnedColumns: GridPinnedColumnFields = { left: [GRID_CHECKBOX_SELECTION_COL_DEF.field, 'actions', 'target_name', 'target_name_semid'], right: []}
    
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); //warning: do not use when creating a new row.
    const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
    const snackbarContext = useSnackbarContext()
    const refreshContext = useRefreshTableContext()

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

    columns = [...columns, target_name_col, target_name_semid_col]
    if (componentName.includes('schedule')) {
        pinnedColumns.right?.push('ob_feasible')
        columns = [...columns, ob_feasible_col]
    } 
    const schema = ob_schemas[componentName]


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
                setEditRow(newRow) //should not save the row...
                //update the context.obs with the new OB
                context.setOBs(context.obs.map((ob) => ob._id === _id ? submittedOB : ob))
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
        const initNeedsResubmit = needs_resubmit(editRow, errors.length)
        const initSubmitColor = !initNeedsResubmit && editRow.submitted ? 'success' : 'inherit'
        const [needsResubmit, setNeedsResubmit] = React.useState<boolean>(initNeedsResubmit)
        const [submitColor, setSubmitColor] = React.useState<'inherit' | 'success'>(initSubmitColor)

        const setRowWithCadenceChecks = (row: ComponentRow) => {
            //if schedule and num_visits_per_night is 1, set cadence to 0. 
            //This is used by the form edit display updating to match the submitted ob. 
            
            let newRow = row
            if (componentName.includes('schedule')) {
                newRow = adjust_schedule(row as Schedule) as ComponentRow
            }
            setEditRow(newRow)
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

        const check_submit_status = () => {
            validators[componentName](editRow)
            const newErrors = validators[componentName].errors ?? []
            setErrors(newErrors)
            const resubmit = needs_resubmit(editRow, errors.length)
            setNeedsResubmit(resubmit)
            setSubmitColor(!resubmit && editRow.submitted ? 'success' : 'inherit')
        }

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
            handleRowChange()
            setCount((prev: number) => prev + 1)
            check_submit_status()
        }, [editRow])


        React.useEffect(() => { // When submit selected is clicked you need to update editRow 
            //@ts-ignore
            const rowsot = ob_to_component_row(context.obs.find((ob) => ob._id === id), componentName)
            const resubmit = needs_resubmit(editRow, errors.length)
            console.log('row changed. resubmit?', row.target_name, resubmit, rowsot)
            if (resubmit !== needsResubmit) {
                setEditRow(rowsot)
            }
        }, [row])

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

        if (needsResubmit) {
            publishText = 'Resubmit edited target for review'
        }
        const valid = errors.length === 0
        const needsInitSubmit = needsResubmit && !editRow.submitted


        const firstButton = valid ?
            <Tooltip
                title={publishText}
                placement="top"
                arrow key="publish" >
                <GridActionsCellItem
                    disabled={!valid}
                    icon={needsResubmit && !needsInitSubmit?
                        <RefreshIcon
                            sx={refreshStyle}
                            color='warning' /> :
                        <PublishIcon
                            sx={refreshStyle}
                            color={submitColor}
                        />
                    }
                    label="Publish"
                    onClick={() => handlePublishClick(id, setIconSpin, setRowWithCadenceChecks)}
                    color="inherit"
                /></Tooltip> :
            < ValidationDialogButton errors={errors} json={editRow} />

        let cell = [firstButton]
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
    const selectedRows = rows.filter((row) => rowSelectionModel.includes(row._id))
    const toolbarProps: EditToolbarProps = {
                        setRows,
                        processRowUpdate,
                        componentName,
                        selectedRows
                        }

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
                checkboxSelection={true}
                processRowUpdate={processRowUpdate}
                columns={columns}
                rowModesModel={rowModesModel}
                onRowSelectionModelChange={(newRowSelectionModel) => {
                    setRowSelectionModel(newRowSelectionModel);
                }}
                rowSelectionModel={rowSelectionModel}
                onRowModesModelChange={handleRowModesModelChange}
                slots={{
                    toolbar: (props) => <EditComponentToolbar {...props} {...toolbarProps} />,
                }}
                slotProps={{
                    toolbar: toolbarProps,
                }}
                pinnedColumns={pinnedColumns} />
        </Box>
    );
}
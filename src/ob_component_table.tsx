import * as React from 'react';
import Box from '@mui/material/Box';
import {
    GridRowsProp,
    GridRowModesModel,
    DataGridPro,
    GridColDef,
    GridToolbarContainer,
    GridPinnedColumnFields,
    GridRowModel,
    GridToolbar,
    GridValueSetter,
    GridValueParser,
    GridCsvExportOptions
} from '@mui/x-data-grid-pro';

import { useDebounceCallback } from './use_debounce_callback';
import { save_obs } from './api/api_root';
import { TargetWizardButton } from './target_wizard';
import { useCommCadContext, useSnackbarContext, get_config, useRefreshTableContext } from './App';
import { OB } from './module_selector';
import { raDecFormat } from './target_edit_dialog';
import { NewOB } from './target_table';
import { ob_schemas } from './validation_check_dialog';

export type OBComponents = "calibration" | "schedule" | "target" | "observation" | "metadata"

interface ComponentRow extends Object {
    isNew?: boolean;
    _id: string;
    target_name?: string,
    state: string;
}

interface EditToolbarProps {
    processRowUpdate: (newRow: GridRowModel) => ComponentRow;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    csvOptions: GridCsvExportOptions;
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


function EditComponentToolbar(props: EditToolbarProps) {
    const { csvOptions } = props;
    return (
        <GridToolbarContainer sx={{ justifyContent: 'center' }}>
            <GridToolbar
                csvOptions={csvOptions}
            />
            <TargetWizardButton />
        </GridToolbarContainer>
    );
}


interface Props {
    componentName: OBComponents,
    obs: OB[] | NewOB[]
}

export default function OBComponentTable(props: Props) {
    const { componentName, obs } = props
    const context = useCommCadContext()
    const initRows = obs.map((ob) => {
        const _id = ob._id ?? Math.random().toString(36).substring(7)
        const target_name = ob.target?.target_name ?? "TBD"
        const cmp = ob[componentName] as Object
        return {
            _id,
            target_name,
            ...cmp,
        }
    }) as ComponentRow[];

    const [rows, setRows] = React.useState(initRows);
    const pinnedColumns = { left: ['target_name', '_id'], right: [] }
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); //warning: do not use when creating a new row.
    const snackbarContext = useSnackbarContext()
    const refreshContext = useRefreshTableContext()

    React.useEffect(() => {
    }, [])

    React.useEffect(() => {
        setTimeout(() => {
            const newRows = obs.map((ob) => {
                const cmp = ob[componentName] as Object
                return {
                    ...cmp,
                    _id: ob._id ?? Math.random().toString(36).substring(7),
                }
            }) as ComponentRow[];
            setRows(newRows)
        }, 300)
    }, [refreshContext.refreshTable, obs])

    const edit_row = async (row: ComponentRow) => {
        let newOb = obs.find((ob) => ob._id === row._id)
        if (!newOb) return
        newOb = { ...newOb, [componentName]: row }
        const resp = await save_obs([newOb])
        if (resp.success !== 'SUCCESS') {
            console.error('save failed', resp)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `Component ${componentName} not saved. Details: ${resp.details}` })
        }
        return resp
    }

    const debounced_save = useDebounceCallback(edit_row, 2000)

    // const handleEditClick = (_id: GridRowId) => () => {
    //     setRowModesModel({ ...rowModesModel, [_id]: { mode: GridRowModes.Edit } });
    // };

    const processRowUpdate = (newRow: GridRowModel) => {
        //sends to server
        const updatedRow = { ...newRow, isNew: false } as ComponentRow;
        setRows(rows.map((row) => (row._id === newRow._id ? updatedRow : row)));
        debounced_save(updatedRow)
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    let columns = convert_schema_to_columns(context.semids, componentName);

    const target_name_col= {
        field: 'target_name',
        type: 'string',
        resizable: true,
        headerName: 'Target Name',
        width: 100,
    } as GridColDef
    const _id_col = {
        field: '_id',
        type: 'string',
        resizable: true,
        headerName: '_id',
        width: 100,
        editable: false,
    } as GridColDef

    columns = [...columns, target_name_col, _id_col]

    // const addColumns: GridColDef[] = [
    //     {
    //         field: 'actions',
    //         type: 'actions',
    //         editable: false,
    //         headerName: 'Actions',
    //         width: 50,
    //         disableExport: true,
    //         cellClassName: 'actions',
    //         getActions: ({ id, row }) => {
    //             const [editRow, setEditRow] = React.useState<ComponentRow>(row);
    //             const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
    //             validators[componentName](row)
    //             const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validators[componentName].errors ?? []);
    //             const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
    //             const apiRef = useGridApiContext();
    //             const handleEvent: GridEventListener<'cellEditStop'> = (params) => {
    //                 setTimeout(() => { //wait for cell to update before setting editTarget
    //                     const value = apiRef.current.getCellValue(id, params.field);
    //                     //Following line is a hack to prevent cellEditStop from firing from non-selected shell.
    //                     //@ts-ignore
    //                     if (editTarget[params.field] === value) return //no change detected. not going to set target as edited.
    //                     setEditRow({ ...editRow, 'state': 'ROW_EDITED', [params.field]: value })
    //                 }, 300)
    //             }

    //             useGridApiEventHandler(apiRef, 'cellEditStop', handleEvent)

    //             const handleRowChange = () => {
    //                 if (count > 0) {
    //                     processRowUpdate(editRow)
    //                     editRow.state?.includes('ROW_EDITED') && debounced_save(editRow)
    //                     validators[componentName](editRow)
    //                     const newErrors = validators[componentName].errors ?? []
    //                     setErrors(newErrors)
    //                     debounced_edit_click(id)
    //                 }
    //             }

    //             React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
    //                 handleRowChange()
    //                 setCount((prev: number) => prev + 1)
    //             }, [editRow])

    //             return [
    //                 <ValidationDialogButton errors={errors} json={editRow} />,
    //                 // <RowEditDialogButton //TODO: make this component
    //                 //     componentName={componentName}
    //                 //     row={editRow}
    //                 //     setRow={setEditRow}
    //                 // />,
    //             ];
    //         }
    //     }
    // ];

    //columns = [...addColumns, ...columns];

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
                editMode={'row'} //TODO: verify this saves obs correctly
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
                        setRows,
                        processRowUpdate
                    },
                }}
                pinnedColumns={pinnedColumns}
            // initialState={{ //TODO: configure column order and visibility
            //     columns: {
            //         columnVisibilityModel:
            //             visibleColumns
            //     }
            // }}
            />
        </Box>
    );
}
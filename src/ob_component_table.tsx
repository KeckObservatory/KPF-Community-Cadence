import * as React from 'react';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
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
import { delete_obs, save_obs } from './api/api_root';
import { OBWizardButton } from './ob_wizard';
import { useCommCadContext, useSnackbarContext, useRefreshTableContext } from './App';
import { MetaData, OB, Observation, OBTarget, ScheduleData } from './module_selector';
import { format_edit_entry, format_tags, PropertyProps, raDecFormat, SchemaProps } from './target_edit_dialog';
import { NewOB } from './target_table';
import ValidationDialogButton, { ob_schemas, validators } from './validation_check_dialog';
import MenuItem from '@mui/material/MenuItem';
import Button, { ButtonProps } from '@mui/material/Button';
import { ErrorObject } from 'ajv/dist/2019';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import SimbadButton from './simbad_button';

export type OBComponents = "calibration" | "schedule" | "target" | "observation" | "metadata"

interface ComponentRow extends Object {
    isNew?: boolean;
    _id: string;
    target_name?: string,
    state: string;
}

interface EditToolbarProps {
    componentName: OBComponents;
    processRowUpdate: (newRow: GridRowModel) => ComponentRow;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    obs: OB[];
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

export const create_new_ob = (semid: string, obsid: number, username: string, target_name?: string) => {
    const target: Partial<OBTarget> = {
        target_name: target_name ?? 'TBD',
    }

    const observation: Partial<Observation> = {
    }

    const schedule: Partial<ScheduleData> = {
        scheduling_mode: 'Cadence',
    }

    const metadata: Partial<MetaData> = {
        obsid: String(obsid),
        observer_name: username,
        submitter: username,
        semester: semid.split('_')[0],
        progid: semid.split('_')[1],
        semid: semid,
        needs_resubmit: false,
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
    const { obs, componentName, processRowUpdate, setRows } = props;
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
        context.setOBs((obs: OB[]) => { return [newOB, ...obs] })
        processRowUpdate(newOB[componentName])

        const newRow = {
            ...newOB[componentName],
            _id: newOB['_id'],
            isNew: true,
            state: newOB.metadata?.status && 'CREATED'
        } as ComponentRow
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
                    <CustomExportButton obs={obs} />
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
    return obs.map((ob) => {
        let translator_ob: { [key: string]: unknown } = {}
        Object.keys(ob_schemas).map((ckey) => {
            // @ts-ignore
            const schema = ob_schemas[ckey]
            Object.keys(schema.properties).map(key => {
                const props = schema.properties[key]
                const tkey = props.translator_mapping ?? key
                // @ts-ignore
                ob[ckey][key] && (translator_ob[tkey] = ob[ckey][key])
            })
        })
        return translator_ob
    });
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
    obs: OB[] | NewOB[]
    setObs: (obs: OB[] | NewOB[]) => void
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
    const pinnedColumns = { left: ['actions', 'target_name', '_id'], right: [] }
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); //warning: do not use when creating a new row.
    const snackbarContext = useSnackbarContext()
    const refreshContext = useRefreshTableContext()

    React.useEffect(() => {
    }, [])

    React.useEffect(() => {
        setTimeout(() => {
            const newRows = obs.map((ob) => {
                const _id = ob._id ?? Math.random().toString(36).substring(7)
                const target_name = ob.target?.target_name ?? "TBD"
                const cmp = ob[componentName] as Object
                return {
                    ...cmp,
                    _id,
                    target_name,
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
        console.log('obsering block saved response', resp)
        if (!resp.observing_blocks) {
            console.error('edit ob save failed', resp)
            snackbarContext.setSnackbarMessage(
                { severity: 'error', message: `Component ${componentName} not saved. Details: ${resp.details}` })
        }
        return resp
    }

    const debounced_save = useDebounceCallback(edit_row, 2000)

    const handleEditClick = (_id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [_id]: { mode: GridRowModes.Edit } });
    };

    const processRowUpdate = (newRow: GridRowModel) => {
        //sends to server
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
    const _id_col = {
        field: '_id',
        type: 'string',
        resizable: true,
        headerName: '_id',
        width: 100,
        editable: false,
    } as GridColDef

    columns = [...columns, target_name_col, _id_col]
    const schema = ob_schemas[componentName]

    const ActionsCell = (props: GridRowParams<ComponentRow>) => {
        const { id, row } = props
        const [editRow, setEditRow] = React.useState<ComponentRow>(row);
        validators[componentName](row)
        const [hasGaia, setHasGaia] = React.useState<boolean>(false)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validators[componentName].errors ?? []);
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
        const apiRef = useGridApiContext();

        const format_cell_value = (field: string, value: any) => {
            //type could be undefined. if so just pass the value through.
            const type = (schema.properties as SchemaProps)[field as keyof PropertyProps]?.type
            const isNumber = type.includes('number') || type.includes('integer')
            if (type === 'array') {
                value = format_tags(Array.isArray(value) ? value.flat(Infinity) : value.split(','))
            }
            if (type.includes('string')) {
                console.log('formatting string', field, value, isNumber)
                value = format_edit_entry(field, value, isNumber)
            }
            return value
        }

        const handleRowEvent: GridEventListener<'rowEditStop'> = (params) => {
            setTimeout(() => { //wait for cell to update before setting editTarget
                let sanitizedRow = {} as Partial<ComponentRow>
                //params row is stale, get updated values from apiRef
                const currRow = apiRef.current.getRow(id)
                Object.keys(params.row).forEach((key) => {
                    let value = currRow[key as keyof ComponentRow];
                    value = format_cell_value(key, value)
                    sanitizedRow[key as keyof ComponentRow] = value
                }) 
                setEditRow((oldRow: ComponentRow) => {
                    console.log('handleRowEvent', params, sanitizedRow, 'currRow', currRow)
                    return { ...oldRow, ...sanitizedRow, 'state': 'ROW_EDITED' }
                })
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

        let cell = [<ValidationDialogButton errors={errors} json={editRow} />]
        if (componentName.includes('target')) {
            cell.push(<SimbadButton hasSimbad={hasGaia} target={editRow} setTarget={setEditRow} />)
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
            props.setObs(props.obs.filter((ob) => ob._id !== delRow?._id))
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
                        // @ts-ignore
                        setRows,
                        processRowUpdate,
                        componentName,
                        obs
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
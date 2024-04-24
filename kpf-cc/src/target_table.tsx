import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { ErrorObject } from 'ajv/dist/2019'
import RefreshIcon from '@mui/icons-material/Refresh';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import {
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  DataGridPro,
  GridColDef,
  GridToolbarContainer,
  GridPinnedColumnFields,
  GridActionsCellItem,
  GridRowId,
  GridRowModel,
  GridToolbar,
  GridRenderCellParams,
  GridValueSetter,
  GridValueParser,
  GridEventListener,
  useGridApiContext,
  useGridApiEventHandler
} from '@mui/x-data-grid-pro';
import {
  randomId,
} from '@mui/x-data-grid-generator';

import target_schema from './target_schema.json'
import ValidationDialogButton, { validate } from './validation_check_dialog';
import TargetEditDialogButton, { raDecFormat } from './target_edit_dialog';
import SimbadButton from './simbad_button';
import { useDebounceCallback } from './use_debounce_callback';
import { delete_target, save_target } from './api/api_root';
import { TargetWizardButton } from './target_wizard';
import { useCommCadContext, Target, useSnackbarContext, get_config } from './App';
import PublishIcon from '@mui/icons-material/Publish';
import { Chip, Tooltip } from '@mui/material';

export interface RefreshTableContext {
  refreshTable: number
  setRefreshTable: Function

}

const refreshTableContext = React.createContext<RefreshTableContext>({
  refreshTable: 0,
  setRefreshTable: () => { }
})
export const useRefreshTableContext = () => React.useContext(refreshTableContext)

interface TargetRow extends Target {
  isNew?: boolean;
  id: string;
}


interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
  ) => void;
}

const target_feisable_chip = (params: GridRenderCellParams) => {
  let text = params.value == null ? 'Unknown'
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

function convert_schema_to_columns(semids: string[]) {
  const columns: GridColDef[] = []


  Object.entries(target_schema.properties).forEach(([key, valueProps]: [string, any]) => {

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

    const valueSetter: GridValueSetter<TargetRow> = (value: any, tgt: TargetRow) => {
      tgt = { ...tgt, [key]: value, "state": 'TARGET_EDITED' }
      if (key.includes('exposure_time')) { //nominal equivalent to maximum
        tgt = {
          ...tgt,
          'nominal_exposure_time': Number(value),
          'maximum_exposure_time': Number(value)
        }
      }
      if (key.includes('num_visits_per_night') && value === 1) { //num_visits_per_night equivalent to num_exposures_per_visit
        tgt = {
          ...tgt,
          'num_intranight_cadence': 0,
        }

      }
      return tgt
    }

    let col = {
      field: key,
      valueParser: valueParser,
      valueSetter: valueSetter,
      type: valueProps.type,
      resizable: true,
      headerName: valueProps.short_description ?? valueProps.description,
      width: 180,
      editable: valueProps.not_editable_by_user ? false : true,
    } as GridColDef
    if (key === 'semids') {
      col = {
        ...col,
        type: 'singleSelect',
        valueOptions: semids,
      }
    }
    if (key === 'target_feasible') {
      col = {
        ...col,
        renderCell: target_feisable_chip
      }
    }
    columns.push(col)
  });

  return columns;
}

export const create_new_target = (semid: string, id?: string, target_name?: string) => {
  let newTarget: Partial<TargetRow> = {}
  Object.entries(target_schema.properties).forEach(([key, value]: [string, any]) => {
    // @ts-ignore
    newTarget[key] = value.default
  })
  newTarget = {
    ...newTarget,
    id: id,
    target_name: target_name,
    semid: semid,
    state: 'TARGET_CREATED'
  } as Target
  return newTarget
}


function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;
  const context = useCommCadContext()
  const snackbarContext = useSnackbarContext()


  const handleAddTarget = async () => {
    if (context.semid === undefined) {
      console.error('semid is undefined')
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `semid is undefined` })
      return
    }

    const id = randomId();
    const newTarget = create_new_target(context.semid, id)

    const resp = await save_target([newTarget as Target],
      newTarget.semid as string,
      'save', false
    )
    if (resp.success === 'SUCCESS') {
      let tgt = resp.targets[0]
      tgt.need_resubmit = false
      context.setTargets([tgt, ...context.targets])
      setRows((oldRows) => [tgt, ...oldRows]);
      setRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'target_name' },
      }));
    }
    else {
      console.error('save failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `Target not saved. Details: ${resp.details}` })
    }
  };

  const debouncedAddTarget = useDebounceCallback(handleAddTarget, 500)

  return (
    <GridToolbarContainer sx={{ justifyContent: 'center' }}>
      <Button color="primary" startIcon={<AddIcon />} onClick={debouncedAddTarget}>
        Add Target
      </Button>
      <GridToolbar
        csvOptions={{ allColumns: true, fileName: `${context.semid}_KPFCC` }}
      />
      <TargetWizardButton />
    </GridToolbarContainer>
  );
}

export default function TargetTable() {
  const context = useCommCadContext()
  const initTargets = context.targets ? context.targets.map((target: Target) => {
    return {
      ...target,
      id: randomId(),
    }
  }) as TargetRow[] : [] as TargetRow[];

  console.log('init targets')
  const [rows, setRows] = React.useState(initTargets);
  const [refreshTable, setRefreshTable] = React.useState(0)
  const [visibleColumns, setVisibleColumns] = React.useState<{ [key: string]: boolean }>({});
  const [pinnedColumns, setPinnedColumns] = React.useState<GridPinnedColumnFields>({
    left: [],
    right: [],
  });
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
  const snackbarContext = useSnackbarContext()

  React.useEffect(() => {
    const set_visible_columns = async () => {
      const cfg = await get_config()
      setPinnedColumns(cfg.pinned_table_columns)
      const vc = Object.fromEntries(columns.map((col) => {
        const visible = cfg.default_table_columns.includes(col.field)
        return [col.field, visible]
      }));
      setVisibleColumns(vc)
    }
    set_visible_columns()
  }, [])

  React.useEffect(() => {
    setTimeout(() => {
      const newTargets = context.targets?.map((target: Target) => {
        return {
          id: randomId(),
          ...target,
        }
      }) as TargetRow[]
      setRows(newTargets)
    }, 300)
  }, [refreshTable, context.semid])

  const edit_target = async (target: Target) => {
    const resp = await save_target([target], target.semid, 'save', false)
    if (resp.success !== 'SUCCESS') {
      console.error('save failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `Target not saved. Details: ${resp.details}` })
    }
    return resp
  }

  const debounced_save = useDebounceCallback(edit_target, 2000)

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };


  const handleDeleteClick = async (id: GridRowId) => {
    const delRow = rows.find((row) => row.id === id);
    const resp = await delete_target(delRow as Target)
    if (resp.success === 'SUCCESS') {
      context.setTotalHours(resp.total_hours)
      context.setTotalObservations(resp.total_observations)
      setRows(rows.filter((row) => row.id !== id));
      context.setTargets([...context.targets.filter((tgt) => tgt._id !== delRow?._id)])
    }
    else {
      console.error('delete failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `Target not deleted. Details: ${resp.details}` })
    }
  }

  const handlePublishClick = async (id: GridRowId, setResubmit: Function, setIconSpin: Function, setEditTarget: Function) => {
    setIconSpin(true)
    let pubRow = rows.find((row) => row.id === id);
    if (pubRow === undefined) {
      console.error('row not found', id)
      return
    }
    try {
      const resp = await save_target([pubRow as Target],
        pubRow?.semid as string,
        'submit',
        false)
      if (resp.success === 'SUCCESS') {
        context.setTotalHours(resp.total_hours)
        context.setTotalObservations(resp.total_observations)
        setResubmit(false);
        const tgt = { ...pubRow, ...resp.targets[0] } as TargetRow
        processRowUpdate(tgt)
        setEditTarget(tgt)
      }
      else {
        console.error('publish failed', resp)
        snackbarContext.setSnackbarMessage(
          { severity: 'error', message: `Target not submitted. Details: ${resp.details}` })
      }
    }
    catch (err) {
      console.error('save_target error', err)
    }
    finally {
      setIconSpin(false)
    }
  };


  const processRowUpdate = (newRow: GridRowModel) => {
    //sends to server
    const updatedRow = { ...newRow, isNew: false } as TargetRow;
    setRows(rows.map((row) => (row._id === newRow._id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };


  let columns = convert_schema_to_columns(context.semids);


  const addColumns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      editable: false,
      headerName: 'Actions',
      width: 200,
      disableExport: true,
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
        const [editTarget, setEditTarget] = React.useState<TargetRow>(row);
        const [iconSpin, setIconSpin] = React.useState<boolean>(false);
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const [hasSimbad, setHasSimbad] = React.useState(row.tic_id || row.gaia_id ? true : false);
        validate(row)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validate.errors ?? []);
        const [resubmit, setResubmit] = React.useState<boolean>(errors.length === 0 && row.submitted && !row.state?.includes('TARGET_SUBMITTED'));
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
        const apiRef = useGridApiContext();


        const handleEvent: GridEventListener<'cellEditStop'> = (params) => {
          setTimeout(() => { //wait for cell to update before setting editTarget
            const value = apiRef.current.getCellValue(id, params.field);
            setEditTarget({ ...editTarget, 'state': 'TARGET_EDITED', [params.field]: value })
          }, 100)
        }

        useGridApiEventHandler(apiRef, 'cellEditStop', handleEvent)

        const handleRowChange = () => {
          if (count > 0) {
            processRowUpdate(editTarget)
            editTarget.state?.includes('TARGET_EDITED') && debounced_save(editTarget)
            validate(editTarget)
            const newErrors = validate.errors ? validate.errors : []
            const newResubmit = editTarget.submitted && editTarget.state?.includes('TARGET_EDITED')
            setResubmit(newResubmit ?? false)
            setErrors(newErrors)
            if (editTarget.tic_id || editTarget.gaia_id) setHasSimbad(true)
            debounced_edit_click(id)
          }
        }

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
          handleRowChange()
          setCount((prev: number) => prev + 1)
        }, [editTarget])

        // React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
        //   console.log('row has been edited', row, editTarget)
        //   apiRef.current.stopCellEditMode
        //   // setEditTarget(row)
        // }, [row])

        let publishText = errors.length > 0 ? 'Validate target before submitting' : 'Submit target for review'
        if (resubmit && errors.length == 0) {
          publishText = 'Resubmit edited target for review'
        }

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

        const valid = errors.length === 0

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
                  color={row.state?.includes('TARGET_SUBMITTED') ? 'success' : 'inherit'}
                />
              }
              label="Publish"
              onClick={() => handlePublishClick(id, setResubmit, setIconSpin, setEditTarget)}
              color="inherit"
            /></Tooltip> :
          < ValidationDialogButton errors={errors} target={editTarget} />

        return [
          firstButton,
          <SimbadButton hasSimbad={hasSimbad} target={editTarget} setTarget={setEditTarget} />,
          <TargetEditDialogButton
            target={editTarget}
            setTarget={setEditTarget}
          />,
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
          ,
        ];
      }
    }
  ];

  columns = [...addColumns, ...columns];


  return (
    <refreshTableContext.Provider value={{ refreshTable, setRefreshTable }}>
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
        {Object.keys(visibleColumns).length > 0 && (
          <DataGridPro
            rows={rows ?? []}
            processRowUpdate={processRowUpdate}
            columns={columns}
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            slots={{
              // @ts-ignore
              toolbar: EditToolbar,
            }}
            slotProps={{
              toolbar: { setRows, setRowModesModel },
            }}
            pinnedColumns={pinnedColumns}
            initialState={{
              columns: {
                columnVisibilityModel:
                  visibleColumns
              }
            }}
          />
        )}
      </Box>
    </refreshTableContext.Provider>
  );
}
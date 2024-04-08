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
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
  GridToolbar,
  GridRenderCellParams,
} from '@mui/x-data-grid-pro';
import {
  randomId,
} from '@mui/x-data-grid-generator';

import target_schema from './target_schema.json'
import ValidationDialogButton, { validate } from './validation_check_dialog';
import TargetEditDialogButton from './target_edit_dialog';
import SimbadButton from './simbad_button';
import { useDebounceCallback } from './use_debounce_callback';
import { delete_target, save_target } from './api/api_root';
import { TargetWizardButton } from './target_wizard';
import { useCommCadContext, Target, useSnackbarContext, get_config } from './App';
import PublishIcon from '@mui/icons-material/Publish';
import { Chip, Tooltip } from '@mui/material';

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
  Object.entries(target_schema.properties).forEach(([key, value]: [string, any]) => {
    let col = {
      field: key,
      type: value.type,
      resizable: true,
      headerName: value.short_description ?? value.description,
      width: 180,
      editable: false,
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
  } as Target
  return newTarget
}


function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;
  const context = useCommCadContext()
  const snackbarContext = useSnackbarContext()

  const handleClick = async () => {
    if (context.semid === undefined) {
      console.error('semid is undefined') //TODO notify user
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

  return (
    <GridToolbarContainer sx={{ justifyContent: 'center' }}>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add Target
      </Button>
      <GridToolbar
        csvOptions={{ allColumns: true }}
      />
      <TargetWizardButton />
    </GridToolbarContainer>
  );
}

export default function TargetTable() {
  const context = useCommCadContext()
  const initTargets = context.targets?.map((target: Target) => {
    return {
      ...target,
      id: randomId(),
    }
  }) as TargetRow[];
  const [rows, setRows] = React.useState(initTargets);
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
    const newTargets = context.targets?.map((target: Target) => {
      return {
        ...target,
        id: randomId(),
      }
    }) as TargetRow[]
    setRows(newTargets)
  }, [context.targets])

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

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };


  const handleDeleteClick = async (id: GridRowId) => {
    const delRow = rows.find((row) => row.id === id);
    const resp = await delete_target(delRow as Target)
    if (resp.success === 'SUCCESS') {
      resp.total_hours && context.setTotalHours(resp.total_hours)
      resp.total_observations && context.setTotalObservations(resp.total_observations)
      setRows(rows.filter((row) => row.id !== id));
      context.setTargets([...context.targets.filter((tgt) => tgt._id !== delRow?._id)])
    }
    else {
      console.error('delete failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `Target not deleted. Details: ${resp.details}` })
    }
  }

  const handlePublishClick = async (id: GridRowId, setResubmit: Function, setIconSpin: Function) => {
    setIconSpin(true)
    let pubRow = rows.find((row) => row.id === id);
    if (pubRow === undefined) {
      console.error('row not found', id)
      return
    }
    pubRow.needs_resubmit = false //assume publish is sucessfull. If not, resubmit will = true 
    try {
      const resp = await save_target([pubRow as Target],
        pubRow?.semid as string,
        'submit',
        false)
      if (resp.success === 'SUCCESS') {
        context.setTotalHours(resp.total_hours)
        context.setTotalObservations(resp.total_observations)
        setResubmit(false);
        processRowUpdate({ ...pubRow, ...resp.targets[0] } as TargetRow)
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
      width: 300,
      disableExport: true,
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
        const [editTarget, setEditTarget] = React.useState<TargetRow>(row);
        const [resubmit, setResubmit] = React.useState<boolean>(row.needs_resubmit);
        const [iconSpin, setIconSpin] = React.useState<boolean>(false);
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const [hasSimbad, setHasSimbad] = React.useState(row.tic_id | row.gaia_id ? true : false);
        validate(row)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validate.errors ?? []);
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
          if (count > 0) {
            processRowUpdate({ ...editTarget, needs_resubmit: true })
            debounced_save({ ...editTarget, needs_resubmit: true })?.then((resp) => {
              console.log('save response', resp)
            })
            setResubmit(true)
            validate(editTarget)
            setErrors(validate.errors ? validate.errors : [])
            editTarget.tic_id || editTarget.gaia_id && setHasSimbad(true)
            debounced_edit_click(id)
          }
          setCount((prev: number) => prev + 1)
        }, [editTarget])

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
              icon={
                (resubmit === true && row.message?.includes('TARGET_SAVED')) ?
                  <RefreshIcon
                    sx={refreshStyle}
                    color='warning' /> :
                  <PublishIcon 
                    sx={refreshStyle}
                    color={row.message?.includes('TARGET_SUBMITTED') ? 'success' : 'inherit'}
                  />
              }
              label="Publish"
              onClick={() => handlePublishClick(id, setResubmit, setIconSpin)}
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
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      }
    }
  ];

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
      {Object.keys(visibleColumns).length > 0 && (
        <DataGridPro
          disableRowSelectionOnClick
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          slots={{
            // @ts-ignore
            toolbar: EditToolbar, 
          }}
          slotProps={{
            toolbar: { setRows, setRowModesModel, },
          }}
          initialState={{
            pinnedColumns: pinnedColumns, 
            columns: {
              columnVisibilityModel:
                visibleColumns
            }
          }}
        />
      )}
    </Box>
  );
}
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { ErrorObject } from 'ajv/dist/2019'
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
  GridToolbar,
} from '@mui/x-data-grid';
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
import { useCommCadContext, Target } from './App';
import PublishIcon from '@mui/icons-material/Publish';
import { Tooltip } from '@mui/material';

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

function convert_schema_to_columns(semids: string[]) {
  const columns: GridColDef[] = []
  Object.entries(target_schema.properties).forEach(([key, value]: [string, any]) => {

    let col = {
      field: key,
      type: value.type,
      resizable: true,
      headerName: value.description,
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

  const handleClick = async () => {
    if (context.semid === undefined ) {
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
      console.log()
      let tgt = resp.targets[0]
      tgt.need_resubmit = false
      context.setTargets([...context.targets, tgt])
      setRows((oldRows) => [tgt, ...oldRows]);
      setRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'target_name' },
      }));
    }
  };

  return (
    <GridToolbarContainer sx={{justifyContent: 'center'}}>
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
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  React.useEffect(() => {
    const newTargets = context.targets?.map((target: Target) => {
      return {
        ...target,
        id: randomId(),
      }
    }) as TargetRow[]
    console.log('updating targets', newTargets)
    setRows(newTargets)
  }, [context.targets])

  const edit_target = async (target: Target) => {
    console.log('debounced save', target)

    const resp = await save_target([target], target.semid, 'save', false)
    console.log('save response', resp)
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
    console.log('deleting', id, delRow)
    const resp = await delete_target(delRow as Target)
    console.log(resp)
    if (resp.success === 'SUCCESS') {
      context.setTotalHours(resp.total_hours)
      context.setTotalObservations(resp.total_observations)
      setRows(rows.filter((row) => row.id !== id));
      //context.setTargets((tgts: Target[]) => { return tgts.filter((tgt) => tgt._id !== delRow?._id) })
      context.setTargets([...context.targets.filter((tgt) => tgt._id !== delRow?._id)])
      
    }
    resp.success !== 'SUCCESS' && console.error('delete failed', resp)
  };

  const handlePublishClick = async (id: GridRowId, setResubmit: Function) => {
    let pubRow = rows.find((row) => row.id === id);
    if (pubRow === undefined) {
      console.error('row not found', id)
      return
    }
    pubRow.needs_resubmit = false //assume publish is sucessfull. If not, resubmit will = true 
    console.log('publishing', id, pubRow)
    const resp = await save_target([pubRow as Target],
      pubRow?.semid as string,
      'submit',
      false)
    console.log(resp)
    if (resp.success === 'SUCCESS') {
      context.setTotalHours(resp.total_hours)
      context.setTotalObservations(resp.total_observations)
      setResubmit(false);
      processRowUpdate({ ...pubRow, ...resp.targets[0] } as TargetRow)
    }
    else {
      console.error('publish failed', resp) //TODO: let user know
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
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const [hasSimbad, setHasSimbad] = React.useState(row.tic_id | row.gaia_id ? true : false);
        validate(row)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validate.errors ?? []);
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
          if (count > 0) {
            console.log('editTarget updated', editTarget, row)
            processRowUpdate({...editTarget, needs_resubmit: true})
            debounced_save({...editTarget, needs_resubmit: true})?.then((resp) => {
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

        return [
          <Tooltip
            title={publishText}
            placement="top"
            arrow key="publish" >
            <GridActionsCellItem
              disabled={errors.length > 0}
              icon={
                resubmit===true?
                <RefreshIcon /> :
                <PublishIcon />
              }
              label="Publish"
              onClick={() => handlePublishClick(id, setResubmit)}
              color="inherit"
            /></Tooltip>,
          <SimbadButton hasSimbad={hasSimbad} target={editTarget} setTarget={setEditTarget} />,
          <ValidationDialogButton errors={errors} target={editTarget} />,
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

  const initVisible = ['actions', 'target_name', 'semid', 'prog_id', 'pi', 'ra', 'dec', 'target_feasible']
  const visibleColumns = Object.fromEntries(columns.map((col) => {
    const visible = initVisible.includes(col.field)
    return [col.field, visible]
  }));

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
      <DataGrid
        rows={rows}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setRows, setRowModesModel, },
        }}
        initialState={{
          columns: {
            columnVisibilityModel:
              visibleColumns
          }
        }}
      />
    </Box>
  );
}
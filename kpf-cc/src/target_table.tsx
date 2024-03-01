import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
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

import { Target } from './target_view';
import target_schema from './target_schema.json'
import ValidationDialogButton from './validation_check_dialog';
import TargetEditDialogButton from './target_edit_dialog';
import SimbadButton from './simbad_button';
import { useDebounceCallback } from './use_debounce_callback';
import { delete_target, save_target } from './api/api_root';
import { TargetWizardButton } from './target_wizard';
import { useCommCadContext } from './App';
import PublishIcon from '@mui/icons-material/Publish';

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

function convert_schema_to_columns(semesters: string[], prog_ids: string[], pis: string[]) {
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
    if (key === 'semester') {
      col = {
        ...col,
        type: 'singleSelect',
        valueOptions: semesters,
      }
    }
    if (key === 'prog_id') {
      col = {
        ...col,
        type: 'singleSelect',
        valueOptions: prog_ids,
      }
    }
    if (key === 'pi') {
      col = {
        ...col,
        type: 'singleSelect',
        valueOptions: pis,
      }
    }
    columns.push(col)
  });

  return columns;
}

export const create_new_target = (semester: string, progId: string, pi: string, id?: string, target_name?: string) => {
  let newTarget: Partial<TargetRow> = {}
  Object.entries(target_schema.properties).forEach(([key, value]: [string, any]) => {
    // @ts-ignore
    newTarget[key] = value.default
  })
  newTarget = {
    ...newTarget,
    id: id,
    target_name: target_name,
    semester: semester,
    prog_id: progId,
    pi: pi
  } as Target
  return newTarget
}


function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;
  const context = useCommCadContext()

  const handleClick = async () => {
    if (context.semester === undefined || context.progId === undefined || context.pi === undefined) {
      console.error('semester, progId, or pi is undefined') //TODO notify user
      return
    }

    const id = randomId();
    const newTarget = create_new_target(context.semester, context.progId, context.pi, id)

    const resp = await save_target([newTarget as Target],
      newTarget.semester as string,
      newTarget.prog_id as string,
      'save', false
    )
    if (resp.success === 'SUCCESS') {
      console.log()
      setRows((oldRows) => [resp.targets[0], ...oldRows]);
      setRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'target_name' },
      }));
    }
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add Target
      </Button>
      <GridToolbar />
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
    const resp = await save_target([target], target.semester, target.prog_id, 'save', false)
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
    resp.success === 'SUCCESS' && setRows(rows.filter((row) => row.id !== id));
    resp.success !== 'SUCCESS' && console.error('delete failed', resp)
  };

  const handlePublishClick = async (id: GridRowId) => {
    const pubRow = rows.find((row) => row.id === id);
    console.log('publishing', id, pubRow)
    const resp = await save_target([pubRow as Target],
      pubRow?.semester as string,
      pubRow?.prog_id as string,
      'submit',
      false)
    console.log(resp)
    resp.success === 'SUCCESS' ? 
      processRowUpdate({ ...pubRow, ...resp.targets[0] } as TargetRow) :
      console.error('publish failed', resp) //TODO: let user know
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


  let columns = convert_schema_to_columns(context.semesters, context.prog_ids, context.pis);


  const addColumns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      editable: false,
      headerName: 'Actions',
      width: 300,
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
        const [editTarget, setEditTarget] = React.useState<TargetRow>(row);
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save
        const [hasSimbad, setHasSimbad] = React.useState(row.tic_id | row.gaia_id ? true : false);

        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
          if (count > 0) {
            console.log('editTarget updated', editTarget, row)
            processRowUpdate(editTarget)
            debounced_save(editTarget)?.then((resp) => {
              console.log('save response', resp)
            })
            editTarget.tic_id || editTarget.gaia_id && setHasSimbad(true)
            debounced_edit_click(id)
          }
          setCount((prev: number) => prev + 1)
        }, [editTarget])

        const publishColor = editTarget.target_feasible ? editTarget.target_feasible === true ? 'primary' : 'warning' : undefined

        return [
          <GridActionsCellItem
            icon={<PublishIcon color={publishColor} />}
            label="Publish"
            onClick={() => handlePublishClick(id)}
            color="inherit"
          />,
          <SimbadButton hasSimbad={hasSimbad} target={editTarget} setTarget={setEditTarget} />,
          <ValidationDialogButton target={editTarget} />,
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

  const initVisible = ['actions', 'target_name', 'semester', 'prog_id', 'pi', 'ra', 'dec', 'target_feasible']
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
        // processRowUpdate={processRowUpdate}
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
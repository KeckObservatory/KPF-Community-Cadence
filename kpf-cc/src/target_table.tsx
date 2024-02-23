import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { useDebounceCallback } from 'usehooks-ts'
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

import targets from './targets.json'
import { Target } from './target_view';
import target_schema from './target_schema.json'
import { pis, prog_ids, semesters } from './control';
import ValidationDialogButton from './validation_check_dialog';
import TargetEditDialogButton from './target_edit_dialog';
import debounce from 'lodash.debounce';

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

function convert_schema_to_columns() {
  const columns = Object.entries(target_schema.properties).map(([key, value]: [string, any]) => {
    let col = {
      field: key,
      type: value.type,
      resizable: true,
      headerName: value.description,
      width: 180,
      editable: true,
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
    return col
  });

  return columns;
}


function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;

  const handleClick = () => {
    const id = randomId();
    setRows((oldRows) => [...oldRows, { id, name: '', age: '', isNew: true }]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add Target
      </Button>
      <GridToolbar />
    </GridToolbarContainer>
  );
}

export default function TargetTable() {
  const initTargets = targets.map((target: Target) => {
    return {
      ...target,
      id: randomId(),
    }

  }) as TargetRow[];
  const [rows, setRows] = React.useState(initTargets);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const debouncedSave = React.useCallback(
    debounce(async (target) => {
      console.log('saving to local storage', target)
    }, 3000),
    []
  )

  const handleRowDBUpdate = (newRow: TargetRow) => {
    //sends to server
    console.log('sending to db', newRow)
  }

  const debouncedDBUpdate = useDebounceCallback(handleRowDBUpdate, 5000);

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setRows(rows.filter((row) => row._id !== id));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    // const editedRow = rows.find((row) => row.id === id);
    // if (editedRow!.isNew) {
    //   setRows(rows.filter((row) => row.id !== id));
    // }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    //sends to server
    console.log('newRow', newRow)
    const updatedRow = { ...newRow, isNew: false } as TargetRow;
    debouncedSave(updatedRow)
    setRows(rows.map((row) => (row._id === newRow._id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  let columns = convert_schema_to_columns();


  const addColumns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 300,
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
        const [editTarget, setEditTarget] = React.useState<TargetRow>(row);
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        React.useEffect(() => {
          processRowUpdate(editTarget)
        }, [editTarget])

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [

          <ValidationDialogButton target={editTarget} />,
          <TargetEditDialogButton target={editTarget} setTarget={setEditTarget} />,
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      }
    }
  ];

  columns = [...addColumns, ...columns];

  const initVisible = ['actions', 'target_name', 'semester', 'prog_id', 'pi', 'target_valid']
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
        processRowUpdate={processRowUpdate}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setRows, setRowModesModel },
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
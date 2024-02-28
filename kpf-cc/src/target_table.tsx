import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
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
import SimbadDialogButton from './simbad_dialog';
import { useDebounceCallback } from './use_debounce_callback';
import { submit_target } from './api/api_root';

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
      // id: target._id,
    }

  }) as TargetRow[];
  const [rows, setRows] = React.useState(initTargets);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const save_target = ((target: Target) => {
    console.log('debounced save', target) //TODO: send to server
    submit_target([target])
  })

  const debounced_save = useDebounceCallback(save_target, 1000)

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    console.log('rowModesModel', rowModesModel)
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    const delRow = rows.find((row) => row.id === id);
    console.log('deleting', id, delRow) //TODO: send to server
    setRows(rows.filter((row) => row.id !== id));
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
    const updatedRow = { ...newRow, isNew: false } as TargetRow;
    //debounced_save(updatedRow)
    setRows(rows.map((row) => (row._id === newRow._id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    console.log('handleRowModesModelChange', newRowModesModel)
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
        const [targetName, setTargetname] = React.useState<string>(row.target_name);
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        const [count, setCount] = React.useState(0); //prevents scroll update from triggering save

        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
        React.useEffect(() => { // when targed is edited in target edit dialog
          if (count > 0) {
            console.log('editTarget updated', editTarget)
            debounced_save(editTarget)
            debounced_edit_click(id)
          }
          setCount((prev: number) => prev + 1)
        }, [editTarget])

        React.useEffect(() => { // when row is edited in edit mode
          if (count > 0) {
            console.log('row updated', row)
            setEditTarget(row)
            setTargetname(row.target_name as string)
          }
          setCount((prev: number) => prev + 1)
        }, [row])

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
          <SimbadDialogButton targetName={targetName} />,
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
        rowModesModel={rowModesModel} //TODO: prevent editing of new rows if scroll event
        onRowModesModelChange={handleRowModesModelChange} //TODO: prevent editing of new rows if scroll event
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
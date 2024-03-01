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

import targets from './targets.json'
import { Target } from './target_view';
import target_schema from './target_schema.json'
import ValidationDialogButton from './validation_check_dialog';
import TargetEditDialogButton from './target_edit_dialog';
import SimbadButton from './simbad_button';
import { useDebounceCallback } from './use_debounce_callback';
import { submit_target } from './api/api_root';
import { TargetWizardButton } from './target_wizard';

interface TargetRow extends Target {
  isNew?: boolean;
  id: string;
}

export interface TargetTableProps {
  semesters: string[]
  prog_ids: string[]
  pis: string[]
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
    if (key === 'identifiers') {
      col = {
        ...col,
        valueGetter: (params) => {
          return JSON.stringify(params.row?.identifiers)
        }
      }
    }
    columns.push(col)
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
      <TargetWizardButton />
    </GridToolbarContainer>
  );
}

export default function TargetTable(props: TargetTableProps) {
  const initTargets = targets.map((target: Target) => {
    return {
      ...target,
      id: randomId(),
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


  const handleDeleteClick = (id: GridRowId) => () => {
    const delRow = rows.find((row) => row.id === id);
    console.log('deleting', id, delRow) //TODO: send to server
    setRows(rows.filter((row) => row.id !== id));
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

  let columns = convert_schema_to_columns(props.semesters, props.prog_ids, props.pis);


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
        const [hasSimbad, setHasSimbad] = React.useState(row.identifiers ? true : false);

        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)

        React.useEffect(() => { // when targed is edited in target edit dialog or simbad dialog
          if (count > 0) {
            console.log('editTarget updated', editTarget, row)
            processRowUpdate(editTarget)
            debounced_save(editTarget)
            editTarget.identifiers && setHasSimbad(true)
            debounced_edit_click(id)
          }
          setCount((prev: number) => prev + 1)
        }, [editTarget])

        return [
          <SimbadButton hasSimbad={hasSimbad} target={editTarget} setTarget={setEditTarget} />,
          <ValidationDialogButton target={editTarget} />,
          <TargetEditDialogButton
            semesters={props.semesters}
            prog_ids={props.prog_ids}
            pis={props.pis}
            target={editTarget}
            setTarget={setEditTarget}
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

  const initVisible = ['actions', 'target_name', 'semester', 'prog_id', 'pi', 'ra', 'dec', 'target_valid']
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
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
  useGridApiEventHandler,
  GridCsvExportOptions
} from '@mui/x-data-grid-pro';

import target_schema from './schemas/cc_target_schema.json'
import ValidationDialogButton, { validateCCTarget } from './validation_check_dialog';
import TargetEditDialogButton, { format_edit_entry, format_tags, PropertyProps, raDecFormat, SchemaProps } from './target_edit_dialog';
import CatalogButton from './catalog_button';
import { useDebounceCallback } from './use_debounce_callback';
import { delete_target, save_obs, save_target } from './api/api_root';
import { TargetWizardButton } from './target_wizard';
import { useCommCadContext, Target, useSnackbarContext, get_config, useRefreshTableContext } from './App';
import PublishIcon from '@mui/icons-material/Publish';
import { Chip, Tooltip } from '@mui/material';
import { MetaData, OB, Observation, OBTarget, ScheduleData } from './module_selector';

interface TargetRow extends Target {
  isNew?: boolean;
  id: string;
}


interface EditToolbarProps {
  processRowUpdate: (newRow: GridRowModel) => TargetRow;
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setOBs: (oldOBs: OB[] | NewOB[]) => void;
  csvOptions: GridCsvExportOptions;
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


//OB has not been saved to the database yet, so it doesn't have an _id
export type NewOB = Partial<OB> & {
    _id?: string
}

const cc_targets_2_ob = (cc_targets: Target[]): NewOB[] => {

    const targets = cc_targets.map((cc_target) => {
        const target: OBTarget = {
            target_name: (cc_target.target_name ?? 'undefined') as string,
            gaia_id: cc_target.gaia_id,
            systemic_velocity: cc_target.systemic_velocity,
            g_mag: cc_target.g_mag,
            j_mag: cc_target.j_mag,
            t_eff: cc_target.t_eff,
            ra: cc_target.ra,
            dec: cc_target.dec,
            pm_ra: cc_target.pm_ra,
            pm_dec: cc_target.pm_dec,
            epoch: String(cc_target.epoch),
        }

        const observation: Partial<Observation> = {
            exposure_time: cc_target.nominal_exposure_time,
            num_exposures: cc_target.num_exposures_per_visit,
        }

        const schedule: Partial<ScheduleData> = {
            scheduling_mode: 'Cadence',
            num_visits_per_night: cc_target.num_visits_per_night,
            num_nights_per_semester: cc_target.num_unique_nights_per_semester,
            num_internight_cadence: cc_target.num_internight_cadence,
            num_intranight_cadence: cc_target.num_intranight_cadence,
        }

        const metadata: Partial<MetaData> = {
            obsid: cc_target.submitter,
            observer_name: cc_target.submitter,
            semester: cc_target.semid.split('_')[0],
            progid: cc_target.semid.split('_')[1],
            semid: cc_target.semid,
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
    })
    return targets
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
      disableExport: valueProps.not_editable_by_user,
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

export const randomId = () => Math.random().toString(36).substr(2, 9);

function EditCCTargetToolbar(props: EditToolbarProps) {
  const { setRows, processRowUpdate, csvOptions, setOBs } = props;
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
      if (resp.targets.length === 0) {
        console.error('add target save failed', resp)
        snackbarContext.setSnackbarMessage(
          { severity: 'error', message: `Target not saved. Details: ${resp}` })
        return
      }
      let tgt = resp.targets.at(0)
      tgt.need_resubmit = false
      context.setTargets([tgt, ...context.targets])
      processRowUpdate(tgt)
      setRows((oldRows) => [tgt, ...oldRows]);
    }
    else {
      console.error('add target save failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `Target not saved. Details: ${resp.details}` })
    }
  };

  const debouncedAddTarget = useDebounceCallback(handleAddTarget, 500)

  const convert_and_submit_targets_as_obs = async (targets: Target[]) => {
    const obs = cc_targets_2_ob(targets)
    const resp = await save_obs(obs)
    if (resp.observing_blocks) {
      setOBs(resp.observing_blocks)
    }
    else {
      console.error('submit targets as obs save failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `OBs not saved. Details: ${resp.details}` })
    }

  }

  return (
    <GridToolbarContainer sx={{ justifyContent: 'center' }}>
      {context.isAdmin && <Button onClick={() => convert_and_submit_targets_as_obs(context.targets)}>Create OBs from targets</Button>}
      <Button color="primary" startIcon={<AddIcon />} onClick={debouncedAddTarget}>
        Add Target
      </Button>
      <GridToolbar
        csvOptions={csvOptions}
      />
      <TargetWizardButton />
    </GridToolbarContainer>
  );
}

interface Props {
  setOBs?: Function
}

export default function TargetTable(props: Props) {
  const context = useCommCadContext()
  const initTargets = context.targets ? context.targets.map((target: Target) => {
    return {
      ...target,
      id: randomId(),
    }
  }) as TargetRow[] : [] as TargetRow[];

  const [rows, setRows] = React.useState(initTargets);
  const [visibleColumns, setVisibleColumns] = React.useState<{ [key: string]: boolean }>({});
  const [csvExportColumns, setCSVExportColumns] = React.useState<string[]>([]);
  const [pinnedColumns, setPinnedColumns] = React.useState<GridPinnedColumnFields>({
    left: [],
    right: [],
  });
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({}); //warning: do not use when creating a new row.
  const snackbarContext = useSnackbarContext()
  const refreshContext = useRefreshTableContext()

  React.useEffect(() => {
    const set_visible_columns = async () => {
      const cfg = await get_config()
      setPinnedColumns(cfg.pinned_table_columns)
      const vc = Object.fromEntries(columns.map((col) => {
        const visible = cfg.default_table_columns.includes(col.field)
        return [col.field, visible]
      }));
      setVisibleColumns(vc)
      const csv_order = context.isAdmin? ['semid', 'submitter', ...cfg.csv_order] : cfg.csv_order
      setCSVExportColumns(csv_order)
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
  }, [refreshContext.refreshTable, context.semid])

  const edit_target = async (target: Target) => {
    const resp = await save_target([target], target.semid, 'save', false)
    if (resp.success !== 'SUCCESS') {
      console.error('edit target save failed', resp)
      snackbarContext.setSnackbarMessage(
        { severity: 'error', message: `Target not saved. Details: ${resp.details}` })
      return false
    }
    return true 
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
        validateCCTarget(row)
        const [errors, setErrors] = React.useState<ErrorObject<string, Record<string, any>, unknown>[]>(validateCCTarget.errors ?? []);
        const [resubmit, setResubmit] = React.useState<boolean>(errors.length === 0 && row.submitted && !row.state?.includes('TARGET_SUBMITTED'));
        const debounced_edit_click = useDebounceCallback(handleEditClick, 500)
        const apiRef = useGridApiContext();
        const handleEvent: GridEventListener<'cellEditStop'> = (params) => {
          const type = (target_schema.properties as SchemaProps)[params.field as keyof PropertyProps].type
          setTimeout(() => { //wait for cell to update before setting editTarget
            let value = apiRef.current.getCellValue(id, params.field);
            //Following line is a hack to prevent cellEditStop from firing from non-selected shell.
            //@ts-ignore
            if (editTarget[params.field] === value) return //no change detected. not going to set target as edited.
            const isNumber = type.includes('number') || type.includes('integer')
            if (type === 'array') {
              value = format_tags(Array.isArray(value) ? value.flat(Infinity) : value.split(','))
            }
            else {
              value = format_edit_entry(params.field, value, isNumber)
            }
            setEditTarget({ ...editTarget, 'state': 'TARGET_EDITED', [params.field]: value })
          }, 300)
        }

        useGridApiEventHandler(apiRef, 'cellEditStop', handleEvent)

        const handleRowChange = () => {
          if (count > 0) {
            processRowUpdate(editTarget)
            editTarget.state?.includes('TARGET_EDITED') && debounced_save(editTarget)
            validateCCTarget(editTarget)
            const newErrors = validateCCTarget.errors ? validateCCTarget.errors : []
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

        let publishText = errors.length > 0 ? 'validateCCTarget target before submitting' : 'Submit target for review'
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
          < ValidationDialogButton errors={errors} json={editTarget} />

        return [
          firstButton,
          <CatalogButton hasSimbad={hasSimbad} target={editTarget} setTarget={setEditTarget} />,
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
            toolbar: EditCCTargetToolbar,
          }}
          slotProps={{
            toolbar: {
              // @ts-ignore
              setRows,
              setOBs: props.setOBs,
              processRowUpdate,
              csvOptions: { fields: csvExportColumns, allColumns: true, fileName: `${context.semid}_KPFCC` }
              // csvOptions: { fields: csvExportColumns },
              // csvOptions: { fields: ['Target Name', 'Semester ID'] },
              // csvOptions: { fields: CSV_ORDER }
            },
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
  );
}
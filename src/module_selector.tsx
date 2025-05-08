import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import OBComponentTable from './ob_component_table';
import { SimbadTargetData } from './catalog_button';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export type Integer = number | string;

export interface OBTarget extends SimbadTargetData {
  _id?: string,
  target_name?: string,
  two_mass_id?: string,
  t_eff?: number,
  d_ra?: number,
  d_dec?: number,
}

export interface OBComponent extends Schedule, Calibration, Observation, OBTarget, Metadata {

}

export interface Schedule {
  scheduling_mode?: string,
  desired_num_visits_per_night?: Integer,
  minimum_num_visits_per_night?: Integer,
  num_visits_per_night?: Integer,
  num_nights_per_semester?: Integer,
  num_internight_cadence?: Integer,
  num_intranight_cadence?: Integer,
  total_observations_requested?: Integer,
  total_time_for_target?: Integer,
  fast_read_mode_requested?: boolean,
  weather_band?: Integer,
  accessibility_map?: Integer,
  minimum_elevation?: number,
  minimum_moon_separation?: number,
}

export interface Calibration {
  cal_source?: string,
  object?: string,
  num_exposures?: Integer,
  exposure_time?: number,
  trigger_ca_h_k?: boolean,
  trigger_green?: boolean,
  trigger_red?: boolean,
  intensity_monitor?: boolean,
  cal_n_d_1?: string,
  cal_n_d_2?: string,
  open_science_shutter?: boolean,
  open_sky_shutter?: boolean,
  take_simulcal?: boolean,
  wide_flat_pos?: string,
  exp_meter_mode?: string,
  exp_meter_exp_time?: number,
  exp_meter_bin?: number,
  exp_meter_threshold?: Integer,
}

export interface Observation {
  object?: string,
  num_exposures?: Integer,
  exposure_time?: number,
  trigger_ca_h_k?: boolean,
  trigger_green?: boolean,
  trigger_red?: boolean,
  block_sky?: boolean,
  exp_meter_mode?: string,
  auto_exp_meter?: boolean,
  exp_meter_exp_time?: number,
  exp_meter_bin?: number,
  exp_meter_threshold?: Integer,
  take_simulcal?: boolean,
  auto_nd_filters?: boolean,
  cal_n_d_1?: string,
  cal_n_d_2?: string,
  nod_n?: number,
  nod_e?: number,
  guide_here?: boolean,
}

export type Action = 'save' | 'submit' | 'delete' | 'executed' | 'edit'

export interface History {
  action: Action,
  date: string,
  user: string,
  result?: string[], // list of koaids
  comment: string,
}

export interface Metadata {
  obsid?: string,
  observer_name?: string,
  semid?: string,
  semester?: string,
  progid?: string,
  state: string,
  submitter?: string,
  submitted?: boolean,
  ob_feasible?: boolean,
  details?: string,
  status?: string,
  tags?: string[],
  comment?: string,
}


export interface OB {
  _id: string,
  metadata: Metadata,
  observation: Observation,
  calibration: Calibration,
  target: OBTarget,
  schedule: Schedule
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}


export const ModuleSelector = () => {
  const [value, setValue] = React.useState(0);


  //@ts-ignore
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="cc-module-tabs"
      >
        <Tab value={0} label="OB Targets" {...a11yProps(0)} />
        {/* <Tab value={1} label="Calibrations" {...a11yProps(2)} /> */}
        <Tab value={1} label="Observations" {...a11yProps(1)} />
        <Tab value={2} label="Cadence Schedule" {...a11yProps(2)} />
        <Tab value={3} label="Meta Data" {...a11yProps(3)} />
      </Tabs>
      {/* <CustomTabPanel value={value} index={0}>
        <TargetTable
          setOBs={setObs}
        />
      </CustomTabPanel> */}
      <CustomTabPanel value={value} index={0}>
        <OBComponentTable
          componentName='target'
        />
      </CustomTabPanel>
      {/* <CustomTabPanel value={value} index={1}>
        <OBComponentTable
          componentName='calibration'
          setObs={setObs}
          obs={obs} />
      </CustomTabPanel> */}
      <CustomTabPanel value={value} index={1}>
        <OBComponentTable
          componentName='observation'
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <OBComponentTable
          componentName='schedule'
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <OBComponentTable
          componentName='metadata'
        />
      </CustomTabPanel>
    </Box>
  );
}
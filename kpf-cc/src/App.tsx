import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { ThemeProvider } from "@mui/material/styles";
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TargetTable from './target_table';
import { createContext, useContext, useEffect, useState } from 'react';
import { UserInfo, get_all_targets, get_semids, get_userinfo } from './api/api_root';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';
import { Control } from './control';
import Skeleton from '@mui/material/Skeleton';
import { SimbadTargetData } from './simbad_button';

export interface Target extends SimbadTargetData{
  _id?: string,
  semid: string,
  target_name?: string,
  j_mag?: number,
  t_eff?: number,
  simulcal_on?: boolean,
  nominal_exposure_time?: number
  maximum_exposure_time?: number,
  num_internight_cadence?: number,
  num_observations_per_visit?: number,
  num_visits_per_night?: number,
  num_unique_nights_per_semester?: number,
  target_feasible?: boolean,
  needs_resubmit?: boolean,
  comment?: string,
  rise_semester_day?: number,
  sets_semester_day?: number,
  details?: string,
  status?: string,
  submitter?: string,
  total_observations_requested?: number,
  total_time_for_target?: number,
  total_time_for_target_hours?: number,
}

interface State {
  username: string,
  obsid: number,
  userinfo?: UserInfo,
  semids: string[],
  semid: string,
  targets: Target[],
  total_hours: number,
  total_observations: number
}

export interface CCContext extends State {
  setTargets?: Function,
  setObserverId: Function
  setSemid: Function 
  setTotalNights: Function
  setTotalObservations: Function
}

const init_cc_context: CCContext = {
  username: "Dr. Observer Observerson",
  userinfo: undefined,
  obsid: 1234,
  semid: "XXXX_XXXX",
  semids: [],
  targets: [],
  total_hours: 0,
  total_observations: 0,
  setSemid: () => { },
  setTargets: () => { },
  setObserverId: () => { },
  setTotalNights: () => { },
  setTotalObservations: () => { },
}

const CommCadContext = createContext<CCContext>(init_cc_context)
export const useCommCadContext = () => useContext(CommCadContext)


function App() {
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const [state, setState] = useState<State>({} as State);
  const theme = handleTheme(darkState)


  useEffect(() => {
    const fetchData = async () => {
      const userinfo = await get_userinfo();
      const username = userinfo.Title + ' ' + userinfo.FirstName + ' ' + userinfo.LastName;
      const obsid = userinfo.Id ?? 4866;
      const semidsMsg = await get_semids(obsid);
      if (semidsMsg.success !== 'SUCCESS') {
        console.error('Failed to get semids', semidsMsg)
        return
      }

      const semids = semidsMsg.programs.map((p: any) => p.semid)
      let targets: Target[] = []
      const allTargets = false //TODO: see if it makes sense to get all targets
      const semid = semids[0]
      let total_hours = 0
      let total_observations = 0
      if (allTargets) {
        for (let idx = 0; idx < semidsMsg.programs.length; idx++) {
          const semid = semidsMsg.programs[idx].semid
          const resp = await get_all_targets(semid);
          resp.success === 'SUCCESS' && (targets = [...targets, ...resp.targets])
        }
      }
      else{
        const resp = await get_all_targets(semid);
        resp.success === 'SUCCESS' && (targets = resp.targets)
        total_hours = resp.total_hours
        total_observations = resp.total_observations
      }

      setState({
        obsid: obsid,
        username,
        userinfo,
        semid,
        semids: semids,
        total_hours,
        total_observations,
        targets
      });
    };
    fetchData();
  }, []);

  const handleThemeChange = (): void => {
    setDarkState(!darkState);
  }

  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <CommCadContext.Provider value={
        {
          username: state.username ?? "Dr. Observer Observerson",
          obsid: state.userinfo?.Id ?? "XXXX",
          semids: state.semids ?? [],
          semid: state.semid ?? "XXXX_XXXX",
          total_hours: state.total_hours,
          total_observations: state.total_observations,
          targets: state.targets,
          setTargets: (targets: Target[]) => {
            setState((st) => {
              return { ...st, targets: targets }
            })
          },
          setSemid: (semid: string) => {
            setState((st) => {
              return { ...st, semid }
            })
          },
          setSemids: (semids: string[]) => {
            setState((st) => {
              return { ...st, semids }
            })
          },
          setObserverId: (oid: string) => {
            setState((st) => {
              return { ...st, observer_id: oid }
            })
          },
          setTotalNights: (total_hours: number) => {
            setState((st) => {
              return { ...st, total_hours}
            })
          },
          setTotalObservations: (total_observations: number) => {
            setState((st) => {
              return { ...st, total_observations}
            })
          }
        } as CCContext
      }>
        <TopBar darkState={darkState} handleThemeChange={handleThemeChange} username={state.username} />
        <Stack sx={{ marginBottom: '4px', marginTop: '12px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
          <Paper
            sx={{
              marginTop: '12px',
              padding: '6px',
              maxWidth: '2000px',
              minWidth: '1500px',
              flexDirection: 'column',
            }}
          >
            <Control />
            {state.targets ? (
              <TargetTable />
            ) : <Skeleton variant="rectangular" width="100%" height={500} />}
          </Paper>
        </Stack>
      </CommCadContext.Provider>
    </ThemeProvider >
  )
}

export default App;

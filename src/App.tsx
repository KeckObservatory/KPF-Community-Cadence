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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { LicenseInfo } from '@mui/x-license';
import licenseKey from './license.json'
import { ModuleSelector } from './module_selector';



export const CONFIG_PATH = './config.json'

export const get_config = async () => {
  const resp = await fetch(
    CONFIG_PATH
  )
  const json = await resp.json()
  return json
}

LicenseInfo.setLicenseKey(
  licenseKey.license_key
)

export interface Target extends SimbadTargetData {
  _id?: string,
  semid: string,
  target_name?: string,
  j_mag?: number,
  t_eff?: number,
  systemic_velocity?: number,
  submitted?: boolean,
  state?: string,
  simulcal_on?: boolean,
  nominal_exposure_time?: number
  maximum_exposure_time?: number,
  num_internight_cadence?: number,
  num_intranight_cadence: number,
  num_exposures_per_visit?: number,
  num_visits_per_night?: number,
  num_unique_nights_per_semester?: number,
  target_feasible?: boolean,
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
  semester: string,
  targets: Target[],
  total_hours: number,
  total_observations: number
}

export interface CCContext extends State {
  semid: string,
  semester: string,
  setSemester: Function,
  isAdmin: boolean,
  setTargets: Function,
  setObserverId: Function
  setSemid: Function
  setTotalHours: Function
  setTotalObservations: Function
}

const init_cc_context: CCContext = {
  username: "Dr. Observer Observerson",
  isAdmin: false,
  userinfo: undefined,
  semester: 'XXXX_XXXX', 
  setSemester: () => { },
  obsid: 1234,
  semid: 'XXXX_XXXX',
  semids: [],
  targets: [],
  total_hours: 0,
  total_observations: 0,
  setSemid: () => { },
  setTargets: () => { },
  setObserverId: () => { },
  setTotalHours: () => { },
  setTotalObservations: () => { },
}

const CommCadContext = createContext<CCContext>(init_cc_context)
export const useCommCadContext = () => useContext(CommCadContext)

export interface SnackbarMessage {
  message?: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
}

export interface SnackbarContextProps {
  snackbarOpen: boolean;
  setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  snackbarMessage: SnackbarMessage;
  setSnackbarMessage: React.Dispatch<React.SetStateAction<SnackbarMessage>>;
}


const init_snackbar_context: SnackbarContextProps = {
  snackbarOpen: false,
  setSnackbarOpen: () => { },
  snackbarMessage: { severity: 'success', message: 'defaultMessage' },
  setSnackbarMessage: () => { },
}

export interface RefreshTableContext {
  refreshTable: number
  setRefreshTable: Function
}
const SnackbarContext = createContext<SnackbarContextProps>(init_snackbar_context);
export const useSnackbarContext = () => useContext(SnackbarContext);

const refreshTableContext = createContext<RefreshTableContext>({
  refreshTable: 0,
  setRefreshTable: () => { }
})
export const useRefreshTableContext = () => useContext(refreshTableContext)


function App() {
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const [notApproved, _] = useQueryParam('notApproved', withDefault(BooleanParam, true));
  const [semid, setSemid] = useQueryParam<string>('semid');
  const [state, setState] = useState<State>({} as State);
  const [init, setInit] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const theme = handleTheme(darkState)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState<SnackbarMessage>({})
  const [refreshTable, setRefreshTable] = useState(0)

  const date = new Date()
  let initSemester = String(date.getFullYear()) + (date.getMonth() < 8 || date.getMonth() > 2 ? 'B' : 'A')

  useEffect(() => {
    const fetchData = async () => {
      let userinfo = await get_userinfo();
      const title = userinfo.Title ? userinfo.Title + ' ' : ''
      const username = `${title}${userinfo.FirstName} ${userinfo.LastName}`;
      const obsid = userinfo.Id;
      let semidResp = await get_semids(obsid);

      if (semidResp.success !== 'SUCCESS') {
        setSnackbarMessage({
          severity: 'error',
          message: `Failed to get semids. Details: ${semidResp.details}`
        })
        return
      }

      let semids = semidResp.programs.map((p: any) => p.semid)
      if (semid === undefined) {
        setSemid(semids[0])
      }
      if (semidResp.isAdmin === 'true') {
        setIsAdmin(true)
      }
      const resp = await get_all_targets(semid);

      let targets: Target[] = []
      let total_hours = 0
      let total_observations = 0
      if (resp.success === 'SUCCESS') {
        targets = resp.targets
        total_hours = resp.total_hours
        total_observations = resp.total_observations
      }
      else {
        setSnackbarMessage({
          severity: 'error',
          message: `Failed to get Targets. Details: ${resp.message}`
        })
      }

      setState({
        obsid: obsid,
        username,
        userinfo,
        semids: semids,
        total_hours,
        total_observations,
        semester: initSemester,
        targets
      });
      setInit(true)
    };
    fetchData();
  }, []);

  useEffect(() => {
    snackbarMessage.message && setOpenSnackbar(true)
  }, [snackbarMessage])

  const handleThemeChange = (): void => {
    setDarkState(!darkState);
  }

  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <refreshTableContext.Provider value={{ refreshTable, setRefreshTable }}>
        <CommCadContext.Provider value={
          {
            username: state.username ?? "Dr. Observer Observerson",
            isAdmin: isAdmin,
            obsid: state.userinfo?.Id ?? "XXXX",
            semids: state.semids ?? [],
            semid: semid ?? "XXXX_XXXX",
            semester: state.semester,
            setSemester: (semester: string) => {
              setState((st) => {
                return { ...st, semester }
              })
            },
            total_hours: state.total_hours,
            total_observations: state.total_observations,
            targets: state.targets,
            setTargets: (targets: Target[]) => {
              setState((st) => {
                return { ...st, targets: targets }
              })
            },
            setSemid,
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
            setTotalHours: (total_hours: number) => {
              setState((st) => {
                return { ...st, total_hours }
              })
            },
            setTotalObservations: (total_observations: number) => {
              setState((st) => {
                return { ...st, total_observations }
              })
            }
          } as CCContext
        }>

          <TopBar
            darkState={darkState}
            handleThemeChange={handleThemeChange}
            username={state.username} />
          <SnackbarContext.Provider value={{
            snackbarOpen: openSnackbar,
            setSnackbarOpen: setOpenSnackbar,
            snackbarMessage: snackbarMessage,
            setSnackbarMessage: setSnackbarMessage
          }}>
            <Snackbar
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              autoHideDuration={3000}
              open={openSnackbar}
              onClose={() => setOpenSnackbar(false)}
            >
              <Alert
                onClose={() => setOpenSnackbar(false)}
                severity={snackbarMessage.severity}
                variant="filled"
                sx={{ width: '100%' }}
              >
                {snackbarMessage.message}
              </Alert>
            </Snackbar>
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
                <Control notApproved={notApproved} isAdmin={isAdmin} />
                {init ? 
                ( isAdmin ?  <ModuleSelector /> : <TargetTable />) 
                : 
                <Skeleton variant="rectangular" width="100%" height={500} />
                }
              </Paper>
            </Stack>
          </SnackbarContext.Provider>
        </CommCadContext.Provider>
      </refreshTableContext.Provider>
    </ThemeProvider >
  )
}

export default App;

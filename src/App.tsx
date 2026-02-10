import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { ThemeProvider } from "@mui/material/styles";
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { createContext, useContext, useEffect, useState } from 'react';
import { UserInfo, get_obs, get_semids, get_userinfo } from './api/api_root';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';
import { Control } from './control';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { ModuleSelector, OB } from './module_selector';



export const CONFIG_PATH = './config.json'

export const get_config = async () => {
  const resp = await fetch(
    CONFIG_PATH
  )
  const json = await resp.json()
  return json
}

interface State {
  username: string,
  obsid: number,
  userinfo?: UserInfo,
  semids: string[],
  semester: string,
  obs: OB[],
  total_hours: number,
  total_observations: number
}

export interface CCContext extends State {
  semid: string,
  semester: string,
  obs: OB[],
  setSemester: Function,
  isAdmin: boolean,
  setOBs: Function,
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
  obs: [],
  total_hours: 0,
  total_observations: 0,
  setSemid: () => { },
  setOBs: () => { },
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

export interface SnackbarContext{
  snackbarOpen: boolean;
  setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  snackbarMessage: SnackbarMessage;
  setSnackbarMessage: React.Dispatch<React.SetStateAction<SnackbarMessage>>;
}


const init_snackbar_context: SnackbarContext= {
  snackbarOpen: false,
  setSnackbarOpen: () => { },
  snackbarMessage: { severity: 'success', message: 'defaultMessage' },
  setSnackbarMessage: () => { },
}

export interface RefreshTableContext {
  refreshTable: number
  setRefreshTable: Function
}
const SnackbarContext = createContext<SnackbarContext>(init_snackbar_context);
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
      const initSemid = semids.at(0)
      initSemester = initSemid?.split('_')[0]
      if (semid === undefined) {
        setSemid(initSemid)
      }
      semidResp.isAdmin === 'true' && setIsAdmin(true)
      // if admin, get all OBs for the semester, otherwise initialize with semid
      semidResp.isAdmin ? (
        //handleGetOBs(initSemester, undefined) //takes too long to load
        handleGetOBs(undefined, semid)
      ) : (
        handleGetOBs(undefined, semid)
      )

      setState((st) => {
        return {
          ...st,
          obsid: obsid,
          username,
          userinfo,
          semids: semids,
          semester: initSemester
        }
      });
      setInit(true)
    };
    fetchData();
  }, []);

  const handleGetOBs = async (semester?: string, semid?: string) => {

    const resp = await get_obs(semester, semid);
    console.log('get_obs response', resp)

    if (resp.success !== 'SUCCESS') {
      setSnackbarMessage({
        severity: 'error',
        message: `Failed to get OBs. Details: ${resp.message}`
      })
      return
    }

    setState((st) => {
      return {
        ...st,
        obs: resp.observing_blocks ?? [],
        total_hours: resp.total_hours ?? 0,
        total_observations: resp.total_observations ?? 0,
        semester: semester ?? st.semester
      }
    })
  }


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
            obs: state.obs ?? [],
            setOBs: (obs: OB[]) => {
              setState((st) => {
                return { ...st, obs }
              })
            },
            setSemid,
            setSemids: (semids: string[]) => {
              setState((st) => {
                return { ...st, semids }
              })
            },
            setObserverId: (oid: number) => {
              setState((st) => {
                return { ...st, obsid: oid }
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
                  <ModuleSelector />
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

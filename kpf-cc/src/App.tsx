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
import { Control, pis, prog_ids, semesters } from './control';
import { Target } from './target_view';
import Skeleton from '@mui/material/Skeleton';

export interface CCContext {
  username: string,
  obsid: string
  semesters: string[],
  prog_ids: string[],
  pis: string[],
  semester?: string,
  progId?: string,
  pi?: string,
  targets?: Target[],
  setTargets?: Function,
  setObserverId: Function
  setSemester: Function
  setProgId: Function
  setPi: Function
}

const init_cc_context: CCContext = {
  username: "Dr. Observer Observerson",
  obsid: "XXXX",
  semesters: semesters,
  prog_ids: prog_ids,
  pis: pis,
  semester: "XXXX",
  progId: "XXXX",
  pi: "XXXX",
  setTargets: () => { },
  setObserverId: () => { },
  setSemester: () => { },
  setProgId: () => { },
  setPi: () => { },
}

const CommCadContext = createContext<CCContext>(init_cc_context)
export const useCommCadContext = () => useContext(CommCadContext)

interface State {
  username?: string,
  obsid?: number,
  userinfo?: UserInfo,
  semesters?: string[],
  prog_ids?: string[],
  pis?: string[],
  semester?: string,
  progId?: string,
  pi?: string,
  targets?: Target[],
}

function App() {
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const [state, setState] = useState({} as State);
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

      const semesters = semidsMsg.programs.map((p: any) => p.semid.split('_')[0])
      const prog_ids = semidsMsg.programs.map((p: any) => p.semid.split('_')[1])
      let targets: Target[] = []
      for (let idx = 0; idx < semidsMsg.programs.length; idx++) {
        const [semester, progid] = semidsMsg.programs[idx].semid.split('_')
        const tgts = await get_all_targets(semester, progid);
        console.log(tgts)
        tgts.status === 'SUCCESS' && (targets = [...targets, ...JSON.parse(tgts.targets)])
      }
      const pis = semidsMsg.programs.map((p: any) => p.name)
      setState({ obsid: obsid, username, userinfo, semesters, prog_ids, pis, targets });
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
          semesters: state.semesters ?? semesters,
          prog_ids: state.prog_ids ?? prog_ids,
          pis: state.pis ?? pis,
          semester: state.semester,
          progId: state.progId,
          pi: state.pi,
          targets: state.targets,
          setTargets: (targets: Target[]) => {
            setState((st) => {
              return { ...st, targets: targets }
            })
          },
          setSemester: (sem: string) => {
            setState((st) => {
              return { ...st, semester: sem }
            })
          },
          setObserverId: (oid: string) => {
            setState((st) => {
              return { ...st, observer_id: oid }
            })
          },
          setProgId: (pid: string) => {
            setState((st) => {
              return { ...st, progId: pid }
            })
          },
          setPi: (pi: string) => {
            setState((st) => {
              return { ...st, pi: pi }
            })
          }
        } as CCContext
      }>
        <TopBar darkState={darkState} handleThemeChange={handleThemeChange} username={state.username} />
        <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
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

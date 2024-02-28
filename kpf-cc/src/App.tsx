import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { ThemeProvider } from "@mui/material/styles";
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TargetTable from './target_table';
import { useEffect, useState } from 'react';
import { UserInfo, get_semids, get_userinfo } from './api/api_root';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';

interface State {
  username?: string,
  userinfo?: UserInfo,
  semesters?: string[],
  programs?: string[],
  pis?: string[],
}

function App() {
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const [state , setState ] = useState({} as State);
  const theme = handleTheme(darkState)

  useEffect(() => {
    const fetchData = async () => {
      const userinfo = await get_userinfo();
      const username = userinfo .Title + ' ' + userinfo.FirstName + ' ' + userinfo.LastName;
      const obsid = userinfo.Id ?? 4866;
      const semidsMsg = await get_semids(obsid);
      if (semidsMsg.success !== 'SUCCESS') {
        console.error('Failed to get semids', semidsMsg)
        return
      }

      const semesters = semidsMsg.programs.map((p: any) => p.semid.split('_')[0])
      const programs = semidsMsg.programs.map((p: any) => p.semid.split('_')[1])
      const pis = semidsMsg.programs.map((p: any) => p.name)
      setState({username, userinfo, semesters, programs, pis});
    };
    fetchData();
  }, []);

  const handleThemeChange = (): void => {
    setDarkState(!darkState);
  }

  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <TopBar darkState={darkState} handleThemeChange={handleThemeChange} username={state.username ?? "Mr. Tyler Coda"} />
      <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
        <Paper
          sx={{
            marginTop: '12px',
            padding: '6px',
            maxWidth: '2000px',
            minWidth: '300px',
            flexDirection: 'column',
          }}
        >
          <TargetTable />
        </Paper>
      </Stack>
    </ThemeProvider>
  )
}

export default App;

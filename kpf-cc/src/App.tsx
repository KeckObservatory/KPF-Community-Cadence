import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { ThemeProvider } from "@mui/material/styles";
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params'
import { TargetView } from './target_view'
import Paper from '@mui/material/Paper';
import { Control } from './control';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const username = 'Dr. Observer Observerson'

function App() {
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const theme = handleTheme(darkState)

  const handleThemeChange = (): void => {
    setDarkState(!darkState);
  }

  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <TopBar darkState={darkState} handleThemeChange={handleThemeChange} username={username} />
      <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
        <Paper
          sx={{
            marginTop: '12px',
            padding: '6px',
            maxWidth: '1000px',
            minWidth: '300px',
            flexDirection: 'column',
          }}
        >
          <Paper
            sx={{
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              '& .MuiTextField-root': {},
            }}
            elevation={3}
          >
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
            >
              Program Information
            </Typography>
            <Control />
          </Paper>
          <TargetView />
        </Paper>
      </Stack>
    </ThemeProvider>
  )
}

export default App;

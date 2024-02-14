import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { ThemeProvider } from "@mui/material/styles";
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params'
import { TargetView } from './target_view'
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { Control } from './control';

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
      <Paper
          sx={{
            marginTop: '12px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiTextField-root': {},
          }}
          elevation={3}
      >
          <Control />
      </Paper>
      <TargetView />
    </ThemeProvider>
  )
}

export default App;

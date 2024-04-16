import AppBar from '@mui/material/AppBar';
import Switch from "@mui/material/Switch"
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography'
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import { useEffect, useState } from 'react';
import { get_config } from './App';
import MarkdownDialogButton from './markdown_dialog';

interface Props {
  username?: string,
  darkState: boolean,
  handleThemeChange: () => void
}

export function TopBar(props: Props) {

  const [welcomeMsg, setWelcomeMsg] = useState<string>('')
  const [motivationMsg, setMotivationMsg] = useState<string>('')


  useEffect(() => {

    const init_msgs = async () => {

      const config = await get_config()
      const welcomeResp = await fetch(config.welcome_path)
      const motivationResp = await fetch(config.motivation_path)
      const wtxt = await welcomeResp.text()
      const mtxt = await motivationResp.text()
      console.log('welcome', wtxt, 'motivation', mtxt)
      setMotivationMsg(wtxt)
      setWelcomeMsg(mtxt)
    }

    init_msgs()


  }, [])



  return (
    <AppBar
      position='sticky'
    >
      <Toolbar
        sx={{
          paddingRight: '8px',
          paddingLeft: '20px'
        }}
      >

        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{
            marginLeft: '12px',
            flexGrow: 1,
          }}
        >
          KPF Community Cadence Coversheet Webform
        </Typography>
        <Typography
          component="h3"
          variant="h6"
          color="inherit"
          noWrap
          sx={{
            marginLeft: '12px',
            flexGrow: 1,
          }}
        >
          Welcome {props.username}
        </Typography>
        <MarkdownDialogButton
          icon={<HelpIcon />}
          msg={motivationMsg}
          tooltipMsg='Select to view Motivation message'
          header='Motivation'
        />
        <MarkdownDialogButton
          icon={<InfoIcon />}
          msg={welcomeMsg}
          tooltipMsg='Select to view Welcome message'
          header='Welcome'
        />
        <Tooltip title="Toggle on for dark mode">
          <Switch
            checked={props.darkState}
            onChange={props.handleThemeChange} />
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
import AppBar from '@mui/material/AppBar';
import Switch from "@mui/material/Switch"
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography'
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import { get_config } from './App';
import MarkdownDialogButton from './markdown_dialog';
import IconButton from '@mui/material/IconButton';
import { observer_logout } from './api/api_root';
import Button from '@mui/material/Button';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';

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
      setMotivationMsg(wtxt)
      setWelcomeMsg(mtxt)
    }

    init_msgs()


  }, [])


  const handleLogout = async () => {
    observer_logout().then((resp: any) => {
      console.log(resp)
    }).finally(() => {
      window.location.reload();
    })
  }

  const handleSurveyClick = () => {
    window.open('https://forms.gle/MjgHD2Tode7Dvv6g8', '_blank')
  }


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
        <Tooltip title="Plz, select me to take a survey">
          <Button
            variant='contained'
            onClick={handleSurveyClick}>
              Submit Survey
          </Button>
        </Tooltip>
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

        <Tooltip title="Select to logout via observer portal">
          <IconButton onClick={handleLogout}
            aria-label="logout" color="primary">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
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
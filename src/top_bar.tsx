import AppBar from '@mui/material/AppBar';
import Switch from "@mui/material/Switch"
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography'
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import { get_config, KPFModule } from './App';
import MarkdownDialogButton from './markdown_dialog';
import IconButton from '@mui/material/IconButton';
import { observer_logout } from './api/api_root';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface Props {
  username?: string,
  darkState: boolean,
  module: KPFModule,
  setModule: (module: KPFModule) => void,
  handleThemeChange: () => void
}

interface KPFModuleSelectProps {
  module: KPFModule,
  setModule: (module: KPFModule) => void
}


export default function KPFModuleSelect(props: KPFModuleSelectProps) {

  const handleChange = (event: SelectChangeEvent) => {
    props.setModule(event.target.value as KPFModule);
  };

  return (
    <Tooltip
      placement="right"
      title="Select KPF Module. Either the Observing Block Webform for requesting/submitting OBS or viewing the Dashboard">
      <Box sx={{ minWidth: 120, height: 30 }}>
        <FormControl fullWidth>
          <InputLabel id="select-kpf-module-label">KPF Module</InputLabel>
          <Select
            labelId="select-kpf-module"
            id="select-kpf-module"
            value={props.module}
            label="KPF Module"
            onChange={handleChange}
          >
            <MenuItem value={'webform'}>Webform</MenuItem>
            <MenuItem value={'dashboard'}>Dashboard</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Tooltip>
  );
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

  const color = props.darkState ? 'primary' : 'secondary'

  const title = props.module === 'webform' ? 'KPF Observing Block Webform' : 'KPF Dashboard'


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
        <KPFModuleSelect
          module={props.module}
          setModule={props.setModule}
        />
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{
            marginLeft: '12px',
            flexGrow: .5,
          }}
        >
          {title}
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
            aria-label="logout" color={color}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
        <MarkdownDialogButton
          icon={<HelpIcon color={color} />}
          msg={motivationMsg}
          tooltipMsg='Select to view Motivation message'
          header='Motivation'
        />
        <MarkdownDialogButton
          icon={<InfoIcon color={color} />}
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
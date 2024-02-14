import { useEffect } from 'react'
import { Control } from './control'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup, Switch, Typography } from '@mui/material'

export interface Props {

}


export const TargetView = () => {

    useEffect(() => {
    }, [])

    return (
        <Stack sx={{
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
        }}
            maxWidth='100%'
        >
            <Paper
                sx={{
                    padding: '12px',
                    margin: '6px',

                }}
                elevation={3}
            >
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Target Information
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Write Target Name Here.">
                            <TextField
                                // focused
                                label={'TargetName'}
                                id="target-name"
                            />
                        </Tooltip>
                        <Tooltip title="Write Magnitude Here.">
                            <TextField
                                // focused
                                label={'V-mag'}
                                id="target-name"
                            />
                        </Tooltip>
                        <Tooltip title="Write Teff Here.">
                            <TextField
                                // focused
                                label={'Teff'}
                                id="target-name"
                            />
                        </Tooltip>
                    </Stack>
                </Box>
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Observation Info
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Is SimulCal On?">
                            <FormGroup>
                                <FormControlLabel control={<Switch defaultChecked />} label="Simucal On?" />
                            </FormGroup>
                            {/* <FormControl>
                                <FormLabel id="simucal-radio-button-group-label">Simucal On?</FormLabel>
                                <RadioGroup
                                    aria-labelledby="simucal-radio-buttons-group-label"
                                    defaultValue="true"
                                    name="simucal-radio-buttons-group"
                                >
                                    <FormControlLabel value="true" control={<Radio />} label="True" />
                                    <FormControlLabel value="false" control={<Radio />} label="False" />
                                </RadioGroup>
                            </FormControl> */}
                        </Tooltip>
                        <Tooltip title="Write Nominal Exposure Time here (s).">
                            <TextField
                                // focused
                                label={'Nominal Exposure Time'}
                                id="exposure-time"
                            />
                        </Tooltip>
                        <Tooltip title="Write Maximum Exposure Time here (s).">
                            <TextField
                                // focused
                                label={'Maximum Exposure Time'}
                                id="max-exposure-time"
                            />
                        </Tooltip>
                    </Stack>
                </Box>
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Cadence Information
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Write Observation per minute here.">
                            <TextField
                                // focused
                                label={'Observation per minute'}
                                id="obs-per-minute"
                            />
                        </Tooltip>
                        <Tooltip title="Write Visits per night here.">
                            <TextField
                                // focused
                                label={'Visits per night'}
                                id="visits-per-night"
                            />
                        </Tooltip>
                        <Tooltip title="Write # unique nights per semester here.">
                            <TextField
                                // focused
                                label={'# unique nights per semester'}
                                id="unique-nights"
                            />
                        </Tooltip>
                    </Stack>
                    <Stack sx={{
                        marginBottom: '4px',
                    }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                        <Stack justifyContent='center' spacing={2}>
                            <Typography
                                variant="h6"
                                color="inherit"
                                noWrap
                                gutterBottom
                            >
                                Intra Night Cadence
                            </Typography>
                            <Tooltip title="Write minimum intra night cadence here.">
                                <TextField
                                    // focused
                                    label={'Min'}
                                    id="min-intra-night-cadence"
                                />
                            </Tooltip>
                            <Tooltip title="Write maximum intra night cadence here.">
                                <TextField
                                    // focused
                                    label={'Max'}
                                    id="max-intra-night-cadence"
                                />
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Box>
                <Box>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                    >
                        Validation Check
                    </Typography>
                    <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title="Write Target Name Here.">
                            <TextField
                                // focused
                                label={'TargetName'}
                                id="target-name"
                            />
                        </Tooltip>
                        <Tooltip title="Write Magnitude Here.">
                            <TextField
                                // focused
                                label={'V-mag'}
                                id="target-name"
                            />
                        </Tooltip>
                        <Tooltip title="Write Teff Here.">
                            <TextField
                                // focused
                                label={'Teff'}
                                id="target-name"
                            />
                        </Tooltip>
                    </Stack>
                </Box>
            </Paper>
        </Stack>
    )

}
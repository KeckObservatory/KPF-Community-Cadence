import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import {
    Autocomplete,
    Box,
    Typography
} from '@mui/material'
import { MuiChipsInput } from 'mui-chips-input';
import { useCommCadContext, useSnackbarContext } from '../App';
import { ComponentRow } from '../ob_component_table';
import { Metadata } from '../module_selector';
import { input_label, text_change, array_change, TextChangeInput, BaseChangeInput, ArrayChangeInput } from '../ob_edit_util';
import { useDebounceCallback } from '../use_debounce_callback';

interface Props {
    open: boolean
    metadata: ComponentRow & Metadata
    setMetadata: (schedule: Metadata & ComponentRow) => void
    handleClose: Function
}

export default function MetadataForm(props: Props) {
    const componentName = 'metadata'
    const { metadata, open, handleClose, setMetadata } = props
    const debounced_save = useDebounceCallback(setMetadata, 1000)
    const context = useCommCadContext()
    const snackbarContext = useSnackbarContext()

    const baseInput: BaseChangeInput = {
        obs: context.obs,
        setOBs: context.setOBs,
        setSnackbarMessage: snackbarContext.setSnackbarMessage,
        componentName: componentName,
        row: metadata,
        saveFunction: debounced_save
    }

    const handleTextChange = (key: string, value: string | number, isNumber = false) => {
        const input: TextChangeInput = {
            ...baseInput,
            key,
            value,
            isNumber
        }
        text_change(input)
    }

    const handleArrayChange = (key: string, value: string[]) => {
        const input: ArrayChangeInput = {
            ...baseInput,
            key,
            value
        }
        array_change(input)
    }


    return (
        <Dialog
            maxWidth="lg"
            onClose={() => handleClose()}
            open={open}

        >
            <DialogTitle>
                <>
                    <span>{componentName.toUpperCase()}</span>
                </>
            </DialogTitle>
            <DialogContent >
                <Stack sx={{
                    paddingTop: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
                    justifyContent='center'
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
                            <Stack sx={{ marginBottom: '4px' }} width="100%" direction="column" justifyContent='center' spacing={2}>
                                <Typography
                                    component="h1"
                                    variant="h6"
                                    color="inherit"
                                    align='center'
                                    noWrap
                                >
                                    Program Information
                                </Typography>
                                <Stack sx={{ marginBottom: '4px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                    <Tooltip title="Select semid"
                                    >
                                        <Autocomplete
                                            disablePortal
                                            id="semid-selection"
                                            value={metadata.semid ? { label: metadata.semid } : { label: 'input semid' }}
                                            onChange={(_, value) => handleTextChange('semid', value?.label ?? "")}
                                            options={context.semids.map((s) => { return { label: s } })}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField {...params} label="Semid" />}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Box>
                        <Box>
                            <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('tags', componentName, true)}>
                                    <MuiChipsInput
                                        value={metadata.tags}
                                        onChange={(value: string[]) => handleArrayChange('tags', value)}
                                        label={input_label('tags', componentName)}
                                        id="tags"
                                    />
                                </Tooltip>
                            </Stack>
                            <Stack sx={{
                                marginBottom: '4px',
                            }} width="100%" direction="row" alignItems='center' justifyContent='center' spacing={2}>
                                <Tooltip title={input_label('comment', componentName, true)}>
                                    <TextField
                                        // focused
                                        multiline
                                        maxRows={4}
                                        label={input_label('comment', componentName)}
                                        id="comment"
                                        onChange={(event) => handleTextChange('comment', event.target.value)}
                                        value={metadata.comment}
                                    />
                                </Tooltip>
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}
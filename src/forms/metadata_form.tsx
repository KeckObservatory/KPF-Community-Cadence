import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import {
    Box,
    Typography
} from '@mui/material'
import { MuiChipsInput } from 'mui-chips-input';
import { ComponentRow } from '../ob_component_table';
import { Metadata } from '../module_selector';
import { input_label, text_change, array_change, TextChangeInput, BaseChangeInput, ArrayChangeInput, make_text_field, make_autocomplete_field } from '../ob_edit_util';
import { useCommCadContext } from '../App'

interface Props {
    open: boolean
    metadata: ComponentRow & Metadata
    setMetadata: (schedule: Metadata & ComponentRow) => void
    handleClose: Function
}

export default function MetadataForm(props: Props) {
    const componentName = 'metadata'
    const { metadata, open, handleClose, setMetadata } = props
    const context = useCommCadContext()

    const baseInput: BaseChangeInput = {
        row: metadata,
        saveFunction: setMetadata 
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


    const CreateTextField = (key: string, isNumber = false) => {
        return make_text_field(key, metadata, componentName, handleTextChange, isNumber)
    }

    const CreateAutocompleteField = (key: string,
        defaultValue: string = "",
        label: string = "",
        choices?: { label: string}[],
    ) => {
        return make_autocomplete_field(key, metadata, componentName, handleTextChange, defaultValue, label, choices)
    }

    const semidChoices = context.semids.map((s) => { return { label: s } })

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
                                    {CreateAutocompleteField('semid', 'input semid', 'Semid', semidChoices)}
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
                                {CreateTextField('comment')}
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}
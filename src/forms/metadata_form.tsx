import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import {
    Box,
} from '@mui/material'
import { MuiChipsInput } from 'mui-chips-input';
import { ComponentRow } from '../ob_component_table';
import { Metadata } from '../component_selector';
import { input_label, tag_array_change, BaseChangeInput, ArrayChangeInput } from '../ob_edit_util';

interface Props {
    open: boolean
    metadata: ComponentRow & Metadata
    setMetadata: (schedule: Metadata & ComponentRow) => void
    handleClose: Function
}

export default function MetadataForm(props: Props) {
    const componentName = 'metadata'
    const { metadata, open, handleClose, setMetadata } = props

    const baseInput: BaseChangeInput = {
        row: metadata,
        saveFunction: setMetadata
    }

    const handleArrayChange = (key: string, value: string[]) => {
        const input: ArrayChangeInput = {
            ...baseInput,
            key,
            value
        }
        tag_array_change(input)
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
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}
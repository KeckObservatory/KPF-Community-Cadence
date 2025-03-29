import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Dayjs } from 'dayjs';

const datePickerStyle = {
    //paddingTop: '9px',
    width: '175px',
    VerticalAlign: 'bottom'
}

interface Props {
    date: Dayjs 
    minDate?: Dayjs 
    maxDate?: Dayjs 
    handleDateChange: (date: Dayjs | null) => void
}

export default function NightPicker(props: Props) {

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopDatePicker
                sx={datePickerStyle}
                views={['year', 'month', 'day']}
                label="Date of observation (HT)"
                value={props.date}
                onChange={props.handleDateChange}
                minDate={props.minDate}
                maxDate={props.maxDate}
            />
        </LocalizationProvider>
    );
}
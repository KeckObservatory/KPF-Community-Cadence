import { Calibration } from '../module_selector';

interface Props {
    open: boolean
    calibration: Calibration
    handleClose: Function
}

export default function CalibrationForm(props: Props) {
    const { calibration, open, handleClose } = props
    console.log('calibration', calibration, open, handleClose)
    return <div></div>
}
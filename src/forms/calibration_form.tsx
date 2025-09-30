import { Calibration } from '../component_selector';

interface Props {
    open: boolean
    calibration: Calibration
    setCalibration: Function
    handleClose: Function
}

export default function CalibrationForm(props: Props) {
    const { calibration, open, handleClose, setCalibration } = props
    console.log('calibration', calibration, open, handleClose, setCalibration)
    return <div></div>
}
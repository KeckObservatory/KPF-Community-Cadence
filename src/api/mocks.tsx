import { OB } from "../module_selector"
import { NewOB } from "../ob_component_table"
import { GaiaResp, GetOBResponse, SubmitResp, UserInfo } from "./api_root"
import mock_ob_resp from './mock_ob_resp.json'


export const mock_get_simbad = async (target: string): Promise<string> => {
    return Promise.resolve(`mocked ${target}`) 
}

export const mock_get_gaia = async (gaia_id: string): Promise<GaiaResp> => {
    const resp = {
        "success": "SUCCESS",
        "message": "mocked",
        "details": "mocked", 
        "gaia_id": gaia_id,
        "gaia_params": {
            "ra": 0,
            "dec": 0,
            "parallax": 0,
            "systemic_velocity": 0,
            "g_mag": 0,
            "t_eff": 0
        }
    }
    return Promise.resolve(resp) 
}

export const mock_observer_logout = async (): Promise<SubmitResp> => {
    return { details: 'mocked', message: 'mocked', success: 'mocked' }
}

export const mock_get_semids = async (): Promise<SubmitResp> => {
    const programs = [{semid: '0000A_A234'}]
    const isAdmin = 'true'
    return { isAdmin, programs, details: 'mocked', message: `$mocked`, success: 'SUCCESS' }
}

export const mock_get_userinfo = async (): Promise<UserInfo> => {
    return {"status": "GOOD", "Id": 1234, "Title": "Mr.", "FirstName": "Observer", "MiddleName": "", "LastName": "Observerson", "Email": "oobserverson@keck.hawaii.edu", "Affiliation": "W. M. Keck Observatory", "WorkArea": "", "Interests": "", "Street": "", "City": "", "State": "", "Country": "", "Zip": "", "Phone": "", "Fax": "", "URL": "", "ModDate": "2021-01-26", "Exposed": "yes", "username": "ttucker", "resetcode": 0, "AllocInst": "KECK", "BadEmail": "N", "Category": "Faculty/Professional Staff"}
}

export const mock_get_obs = async (semester?: string, semid?: string, id?: string): Promise<GetOBResponse> => {
    //@ts-ignore
    return { details: 'mocked', message: `${id} ${semester} ${semid} mocked`, success: 'SUCCESS', observing_blocks: mock_ob_resp.observing_blocks }
}

export const mock_edit_obs = async (obs: OB[] | NewOB[]): Promise<SubmitResp> => {
    const obNames = obs.map((ob) => ob._id ?? 'new OB')
    return { details: 'mocked', message: `${obNames} mocked`, success: 'mocked', observing_blocks: [] }
}

export const mock_submit_obs = async (obs: OB[]): Promise<SubmitResp> => {
    const obNames = obs.map((ob) => ob._id)
    return { details: 'mocked', message: `${obNames} mocked`, success: 'mocked', observing_blocks: [] }
}
export const mock_delete_ob = async (_id: string): Promise<SubmitResp> => {
    return { details: 'mocked', message: `${_id} delete mocked`, success: 'mocked'}
}
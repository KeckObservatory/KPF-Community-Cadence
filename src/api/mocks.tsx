import { Target } from "../App"
import { OB } from "../module_selector"
import { NewOB } from "../target_table"
import { GetOBResponse, SubmitResp, UserInfo } from "./api_root"


export const mock_get_simbad = async (target: string): Promise<string> => {
    return Promise.resolve(`mocked ${target}`) 
}

export const mock_observer_logout = async (): Promise<SubmitResp> => {
    return { details: 'mocked', message: 'mocked', success: 'mocked' }
}

export const mock_delete_target = async (tgt: Target): Promise<SubmitResp> => {

    return { details: 'mocked', message: `${tgt.target_name} mocked`, success: 'mocked' }
}

export const mock_save_target = async (targets: Target[],
    semid: string,
    action = 'save',
    edit = false): Promise<SubmitResp> => {

    let msg = edit ? 'edited' : 'submitted'
    msg += action 
    msg += ` for ${semid}`
    msg += ` ${targets.length} targets`
    return { details: 'mocked', message: `${msg} mocked`, success: 'mocked' }
}

export const mock_get_target = async (oid: string): Promise<Target> => {
    const target: Target = {_id: oid} as Target
    return target 
}

export const mock_get_all_semester_targets = async (semester: string, notApproved?: Boolean): Promise<SubmitResp> => {
    let msg = `fetched for ${semester}`
    if (notApproved) {
        msg += ' not approved'
    }
    return { details: 'mocked', message: `${msg} mocked`, success: 'mocked' }
}

export const mock_get_all_targets = async (semester: string): Promise<SubmitResp> => {
    return { details: 'mocked', message: `${semester} mocked`, success: 'mocked' }
}

export const mock_get_semids = async (): Promise<SubmitResp> => {
    const programs = ['0000A_A234']
    const isAdmin = 'true'
    return { isAdmin, programs, details: 'mocked', message: `$mocked`, success: 'SUCCESS' }
}

export const mock_get_userinfo = async (): Promise<UserInfo> => {
    return {"status": "GOOD", "Id": 1234, "Title": "Mr.", "FirstName": "Observer", "MiddleName": "", "LastName": "Observerson", "Email": "oobserverson@keck.hawaii.edu", "Affiliation": "W. M. Keck Observatory", "WorkArea": "", "Interests": "", "Street": "", "City": "", "State": "", "Country": "", "Zip": "", "Phone": "", "Fax": "", "URL": "", "ModDate": "2021-01-26", "Exposed": "yes", "username": "ttucker", "resetcode": 0, "AllocInst": "KECK", "BadEmail": "N", "Category": "Faculty/Professional Staff"}
}

export const mock_get_obs = async (semester?: string, semid?: string, id?: string): Promise<GetOBResponse> => {
    return { details: 'mocked', message: `${id} ${semester} ${semid} mocked`, success: 'mocked', observing_blocks: [] }
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
import axios from 'axios';

import { handleResponse, handleError, intResponse, intError } from './response';
import { Target } from '../App';
const SIMBAD_ADDR = "https://simbad.u-strasbg.fr/simbad/sim-id?NbIdent=1&submit=submit+id&output.format=ASCII&obj.bibsel=off&Ident="
const API_ADDR = "/api/proposals"
import * as mocks from './mocks'
import { OB } from '../module_selector';
import { NewOB } from '../target_table';

export interface UserInfo {
    status: string;
    Id: number;
    Title: string;
    FirstName: string;
    MiddleName: string;
    LastName: string;
    Email: string;
    Affiliation: string;
    WorkArea: string;
    Interests: string;
    Street: string;
    City: string;
    State: string;
    Country: string;
    Zip: string;
    Phone: string;
    Fax: string;
    URL: string;
    ModDate: string;
    Exposed: string;
    username: string;
    resetcode: number;
    AllocInst: string;
    BadEmail: string;
    Category: string;
}

export interface NameSemid {
    name: string,
    semid: string
}

export interface SemidResp {
    message: string,
    obsid: number,
    isAdmin: string,
    details?: string,
    programs: NameSemid[]
    success: string
}

export interface SubmitResp {
    details: string,
    message: string,
    success: string,
    [key: string]: any,
}

export interface GetLogsArgs {
    n_logs: number,
    loggername: string,
    minutes?: number,
    subsystem?: string,
    semid?: string,
    startdatetime?: string,
    enddatetime?: string,
    dateformat?: string
}

const axiosInstance = axios.create({
    withCredentials: false,
    // timeout: 2000,
    headers: {
        'Content-Type': 'application/json',
        'withCredentials': false,
    }
})
axiosInstance.interceptors.response.use(intResponse, intError);


const get_simbad_call = (obj: string): Promise<string> => {
    const url = SIMBAD_ADDR + obj
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const observer_logout_call = (): Promise<SubmitResp> => {
    const url = API_ADDR + '/logout'
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const delete_target_call = (tgt: Target): Promise<SubmitResp> => {
    const url = API_ADDR + `/deleteTarget?id=${tgt._id}`
    return axiosInstance.delete(url)
        .then(handleResponse)
        .catch(handleError)
}

const save_target_call = (targets: Target[],
    semid: string,
    action = 'save',
    edit = false): Promise<SubmitResp> => {
    let url = API_ADDR
    url += edit ? '/editTarget' : '/submitTarget'
    url += `?action=${action}&semid=${semid}`
    return axiosInstance.put(url, { targets })
        .then(handleResponse)
        .catch(handleError)
}

const get_target_call = (oid: string): Promise<string> => {
    const url = API_ADDR + `/getTarget?id=${oid}`
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_all_semester_targets_call = (semester: string, notApproved?: Boolean): Promise<SubmitResp> => {
    let queryParams = `semester=${semester}`
    queryParams += notApproved ? `&notapproved=${notApproved}`: ''
    const url = API_ADDR + `/getAllSemesterTargets?${queryParams}`
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_all_targets_call = (semid: string): Promise<SubmitResp> => {
    const queryParams = `semid=${semid}`
    const url = API_ADDR + `/getAllTargets?${queryParams}`
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_semids_call = (oid?: number): Promise<SemidResp> => {
    const url = API_ADDR + '/getProgramIDs?' + (oid ? `obsid=${oid}` : '')
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_userinfo_call = (): Promise<UserInfo> => {
    const url = "/userinfo"
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_obs_call = (semester?: string, semid?: string, id?: string): Promise<any> => {
    let url = API_ADDR 
    if (semester) {
        url += `/getObservingBlock?semester=${semester}`
    }
    else if (semid) {
        url += `/getAllObservingBlocks?semid=${semid}`
    }
    else if (id) {
        url += `/getObservingBlock?id=${id}`
    }
    else {
        return Promise.reject("No arguments provided")
    }
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

export type Actions = 'save' | 'submit'

const edit_ob_call = (obs: OB[] | NewOB[]): Promise<SubmitResp> => {
    const actions='save'
    const url = API_ADDR + `/submitObservingBlock?action=${actions}`
    return axiosInstance.put(url, obs)
        .then(handleResponse)
        .catch(handleError)
}

const submit_ob_call = (obs: OB[]): Promise<SubmitResp> => {
    const actions='submit'
    const url = API_ADDR + `/submitObservingBlock?action=${actions}&observing_blocks?${JSON.stringify(obs)}`
    return axiosInstance.put(url, obs)
        .then(handleResponse)
        .catch(handleError)
}

const delete_ob_call = (_id: string): Promise<SubmitResp> => {
    const url = API_ADDR + `/deleteObservingBlock?_id=${_id}`
    return axiosInstance.delete(url)
        .then(handleResponse)
        .catch(handleError)
}


const IS_PRODUCTION: boolean = import.meta.env.PROD
export const get_simbad  = IS_PRODUCTION ? get_simbad_call : mocks.mock_get_simbad
export const observer_logout = IS_PRODUCTION ? observer_logout_call : mocks.mock_observer_logout
export const delete_target = IS_PRODUCTION ? delete_target_call : mocks.mock_delete_target
export const save_target = IS_PRODUCTION ? save_target_call : mocks.mock_save_target
export const get_target = IS_PRODUCTION ? get_target_call : mocks.mock_get_target
export const get_all_semester_targets = IS_PRODUCTION ? get_all_semester_targets_call : mocks.mock_get_all_semester_targets
export const get_all_targets = IS_PRODUCTION ? get_all_targets_call : mocks.mock_get_all_targets
export const get_semids = IS_PRODUCTION ? get_semids_call : mocks.mock_get_semids
export const get_userinfo = IS_PRODUCTION ? get_userinfo_call : mocks.mock_get_userinfo
export const get_obs = IS_PRODUCTION ? get_obs_call: mocks.mock_get_obs
export const save_obs = IS_PRODUCTION ? edit_ob_call: mocks.mock_edit_obs
export const delete_obs = IS_PRODUCTION ? delete_ob_call: mocks.mock_delete_ob
export const submit_obs = IS_PRODUCTION ? submit_ob_call: mocks.mock_submit_obs
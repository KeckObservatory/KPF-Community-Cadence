import axios from 'axios';

import { handleResponse, handleError, intResponse, intError } from './response';
const SIMBAD_ADDR = "https://simbad.u-strasbg.fr/simbad/sim-id?NbIdent=1&submit=submit+id&output.format=ASCII&obj.bibsel=off&Ident="
const API_ADDR = "/api/proposals"
import * as mocks from './mocks'
import { OB } from '../module_selector';
import { NewOB } from '../ob_component_toolbar';

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

export interface GetOBResponse extends SubmitResp {
    observing_blocks: OB[],
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

export interface GaiaParams {
    ra_deg?: number,
    dec_deg?: number,
    parallax?: number,
    systemic_velocity?: number,
    g_mag?: number,
    t_eff?: number,
}

export interface GaiaResp {
    success: string,
    message: string,
    gaia_id: string,
    details?: string,
    gaia_params?: GaiaParams
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

const get_gaia_call = (gaia_id: string): Promise<GaiaResp> => {
    const url = API_ADDR + `/getGaiaParameters?gaia_id=${gaia_id}`
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const observer_logout_call = (): Promise<SubmitResp> => {
    const url = '/logout'
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

const get_obs_call = (semester?: string, semid?: string, id?: string): Promise<GetOBResponse> => {
    let url = API_ADDR 
    if (semester) {
        url += `/getAllSemesterObservingBlocks?semester=${semester}`
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
    return axiosInstance.put(url, {observing_blocks: obs})
        .then(handleResponse)
        .catch(handleError)
}

const submit_ob_call = (obs: OB[]): Promise<SubmitResp> => {
    const actions='submit'
    const url = API_ADDR + `/submitObservingBlock?action=${actions}`
    return axiosInstance.put(url, {observing_blocks: obs})
        .then(handleResponse)
        .catch(handleError)
}

const delete_ob_call = (_id: string): Promise<SubmitResp> => {
    const url = API_ADDR + `/deleteObservingBlock?id=${_id}`
    return axiosInstance.delete(url)
        .then(handleResponse)
        .catch(handleError)
}




const IS_PRODUCTION: boolean = import.meta.env.PROD
export const get_simbad  = IS_PRODUCTION ? get_simbad_call : mocks.mock_get_simbad
export const get_gaia = IS_PRODUCTION ? get_gaia_call: mocks.mock_get_gaia
export const observer_logout = IS_PRODUCTION ? observer_logout_call : mocks.mock_observer_logout
export const get_semids = IS_PRODUCTION ? get_semids_call : mocks.mock_get_semids
export const get_userinfo = IS_PRODUCTION ? get_userinfo_call : mocks.mock_get_userinfo
export const get_obs = IS_PRODUCTION ? get_obs_call: mocks.mock_get_obs
export const save_obs = IS_PRODUCTION ? edit_ob_call: mocks.mock_edit_obs
export const delete_obs = IS_PRODUCTION ? delete_ob_call: mocks.mock_delete_ob
export const submit_obs = IS_PRODUCTION ? submit_ob_call: mocks.mock_submit_obs
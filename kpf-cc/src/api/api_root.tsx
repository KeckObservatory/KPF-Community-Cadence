import axios from 'axios';

import { handleResponse, handleError, intResponse, intError } from './response';
import { Target } from '../App';
const SIMBAD_ADDR = "https://simbad.u-strasbg.fr/simbad/sim-id?NbIdent=1&submit=submit+id&output.format=ASCII&obj.bibsel=off&Ident="
//const API_ADDR = "https://www3build.keck.hawaii.edu/api/proposals"
const API_ADDR = "/api/proposals"


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

interface NameSemid {
    name: string,
    semid: string
}

interface SemidResp {
    message: string,
    obsid: number,
    programs: NameSemid[]
    success: string
}

const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'withCredentials': false,
    }
})
axiosInstance.interceptors.response.use(intResponse, intError);

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


export const get_simbad = (obj: string): Promise<string> => {
    const url = SIMBAD_ADDR + obj
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}


export interface SubmitResp {
    details: string,
    message: string,
    success: string,
    [key: string]: any,
}

export const delete_target = (tgt: Target): Promise<SubmitResp> => {
    const url = API_ADDR + `/deleteTarget?id=${tgt._id}`
    return axiosInstance.delete(url)
        .then(handleResponse)
        .catch(handleError)
}

export const save_target = (targets: Target[],
    semester: string,
    progId: string,
    action = 'save',
    edit = false): Promise<SubmitResp> => {
    let url = API_ADDR
    url += edit ? '/editTarget' : '/submitTarget'
    url += `?action=${action}&semester=${semester}&progid=${progId}`
    return axiosInstance.put(url, { targets })
        .then(handleResponse)
        .catch(handleError)
}

export const get_target = (oid: string): Promise<string> => {
    const url = API_ADDR + `/getTarget?id=${oid}`
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

export const get_all_targets = (semester: string, progid: string): Promise<SubmitResp> => {
    const url = API_ADDR + `/getAllTargets?semester=${semester}&progid=${progid}`
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

export const get_semids = (oid?: number): Promise<SemidResp> => {
    const url = API_ADDR + '/getProgramIDs?' + (oid ? `obsid=${oid}` : '')
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

export const get_userinfo = (): Promise<UserInfo> => {
    const url = "https://www3build.keck.hawaii.edu/userinfo"
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}


import axios from 'axios';

import { handleResponse, handleError, intResponse, intError } from './response';
const SIMBAD_ADDR = "http://simbad.u-strasbg.fr/simbad/sim-id?NbIdent=1&submit=submit+id&output.format=ASCII&obj.bibsel=off&Ident=M31"


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
import React from 'react';
import { save_obs } from './api/api_root';
import { OB } from './module_selector';
import { ComponentRow, OBComponentName } from './ob_component_table';
import { useDebounceCallback } from './use_debounce_callback';
import { ob_schemas } from './validation_check_dialog';



export const input_label = (param: string, componentName: OBComponentName, tooltip = false): string => {
    const componentSchema = ob_schemas[componentName]
    const props = componentSchema['properties'][param]
    return tooltip ?
        props.description
        :
        props.short_description ?? props.description
}

export const format_tags = (tags: string[]) => {
    const pattern = /[,]/g
    tags = tags ?? [] //if tags is undefined, set to empty array
    tags = tags.map((tag) => tag.trim().replace(pattern, '')).filter((tag) => tag.length > 0) //no empty strings or whitespace
    tags = [...new Set(tags)]
    return tags
}

const sanitize_number = (value: string) => {
    const pattern = /[^\d.-]/g
    value = value.replace(pattern, '')
    const split = value.split('.')
    if (split.length > 2) {
        value = value.split('.').reduce((acc, val, idx) => {
            console.log('acc', acc, 'val', val, 'idx', idx)
            if (idx === 0) {
                return val + acc
            }
            return acc + val //concatenate strings after first decimal
        }, '.')
    }
    return value
}

export const format_edit_entry = (key: string, value?: string | number, isNumber = false) => {
    //add trailing zero if string ends in a decimal 
    if (isNumber) {
        value = sanitize_number(String(value))
    }
    if (value && (key === 'ra' || key === 'dec')) {
        key === 'ra' && String(value).replace(/[^+-]/, "")
        value = raDecFormat(value as string)
    }
    if (value && key === 'target_name') {
        value = String(value).replace(/[^\w^\-^\s]+/g, '') //remove non alphanumeric characters
        value = value.slice(0, 15) //truncate to 15 characters
    }
    value = String(value).replace(/\t/, '') //remove tabs
    return value
}

export const raDecFormat = (input: string) => {
    // Strip all characters from the input digits and keep pos/neg sign
    const sign = input.length > 0 ? input[0].replace(/[^+-]/, "") : ""
    input = input.replace(/[^0-9]+/g, "");

    // Based upon the length of the string, we add formatting as necessary
    var size = input.length;
    if (size < 2) {
        input = input;
    }
    else if (size < 3) {
        input = input + ':';
    } else if (size < 5) {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':';
    } else if (size < 6) {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6);
    } else if (size < 7) {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6) + '.';
    } else {
        input = input.substring(0, 2) + ':' + input.substring(2, 4) + ':' + input.substring(4, 6) + '.' + input.substring(6);
    }
    return sign + input;
}

const obSetter = (ob: OB, componentName: keyof OB) => {
    // if num_vists_per_night is 1, set num_intranight_cadences to 0
    if (componentName === 'schedule' && ob.schedule.num_visits_per_night === 1) {
        ob.schedule = {
            ...ob.schedule,
            'num_intranight_cadence': 0,
            'num_internight_cadence': 0,
        }
    }
    return ob
}

export const ob_to_component_row = (ob: OB, componentName: OBComponentName): ComponentRow => {
    const _id = ob._id ?? Math.random().toString(36).substring(7)
    const target_name = ob.target?.target_name ?? "TBD"
    const target_name_semid = target_name + '_' + ob.metadata.semid
    const cmp = ob[componentName] as Object
    const state = ob.metadata?.state ?? 'CREATED' //overwrite state with metadata state
    const ob_feasible = ob.metadata.ob_feasible
    const details = ob.metadata.details ?? ''
    return {
        ...cmp,
        _id,
        target_name,
        target_name_semid,
        state,
        ob_feasible,
        details,
        submitted: ob.metadata.submitted ?? false,
    }
}

export const row_to_ob_component = (row: ComponentRow, componentName: OBComponentName) => {
    //removes row metadata.
    let cmp: Partial<ComponentRow> = { ...row }
    delete cmp._id
    delete cmp.target_name_semid
    if (!componentName.includes('target')) {
        delete cmp.target_name
    }
    if (!componentName.includes('metadata')) {
        delete cmp.state
        delete cmp.submitted
        delete cmp.ob_feasible
        delete cmp.details
    }
    return cmp
}

export const edit_ob = async (
    row: ComponentRow,
    componentName: OBComponentName,
    obs: OB[],
    setOBs: Function,
    setSnackbarMessage: Function,
) => {
    const idx = obs.findIndex((ob) => ob._id === row._id)
    const obComponent = row_to_ob_component(row, componentName)
    let newOB = obs.at(idx)
    if (!newOB) return
    newOB = { ...newOB, [componentName]: obComponent }
    newOB = obSetter(newOB, componentName)
    const resp = await save_obs([newOB])
    if (!resp.observing_blocks) {
        console.error('edit ob save failed', resp)
        setSnackbarMessage(
            { severity: 'error', message: `OB not saved. Details: ${resp.details}` })
    }
    else if (resp.observing_blocks.length === 0) {
        console.error('edit ob save failed', resp)
        setSnackbarMessage(
            { severity: 'error', message: `OB not saved. Details: ${resp.details}` })
    }
    else {
        const respOB = resp.observing_blocks.at(0)
        setSnackbarMessage(
            { severity: 'success', message: `OB saved` })
        //replace old ob with saved ob
        setOBs(obs.map((ob) => ob._id === respOB?._id ? respOB : ob))
    }
    return resp
}

export interface BaseChangeInput {
    componentName: OBComponentName,
    saveFunction: Function,
    obs: OB[]
    setOBs: Function
    setSnackbarMessage: Function
    row: ComponentRow,
    isNumber?: boolean
}

export interface TextChangeInput extends BaseChangeInput {
    key: string,
    value: string | number
}

export interface ArrayChangeInput extends BaseChangeInput {
    key: string,
    value: string[]
}

export interface SwitchChangeInput extends BaseChangeInput {
    key: string,
    event: React.SyntheticEvent<Element, Event>
}

export const text_change = (input: TextChangeInput ) => {
    const formattedValue = format_edit_entry(input.key, input.value, input.isNumber ?? false)
    const newRow = { ...input.row, [input.key]: formattedValue }
    input.saveFunction(newRow, input.componentName, input.obs, input.setOBs, input.setSnackbarMessage)
}

export const array_change = (input: ArrayChangeInput ) => {
    const formattedValue = format_tags(input.value)
    const newRow = { ...input.row, [input.key]: formattedValue }
    input.saveFunction(newRow, input.componentName, input.obs, input.setOBs, input.setSnackbarMessage)
}

export const switch_change = (input: SwitchChangeInput ) => {
    const value = (input.event.target as HTMLInputElement).checked
    const newRow = { ...input.row, [input.key]: value}
    input.saveFunction(newRow, input.componentName, input.obs, input.setOBs, input.setSnackbarMessage)
}
import React from 'react';
import { save_obs } from './api/api_root';
import { OB, OBComponent, Schedule } from './module_selector';
import { ComponentRow, OBComponentName } from './ob_component_table';
import { ob_schemas } from './validation_check_dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';



export const input_label = (param: string, componentName: OBComponentName, tooltip = false): string => {
    const componentSchema = ob_schemas[componentName]
    const props = componentSchema['properties'][param]
    return tooltip ?
        props?.description
        :
        props?.short_description ?? props?.description
}

interface EnumChoice {
    label: string
}

export const enum_choices = (param: string, componentName: OBComponentName): string[] => {
    const componentSchema = ob_schemas[componentName]
    const props = componentSchema['properties'][param]
    const enumChoices = props.enum.map((choice: string | number) => {
        return { label: String(choice) } as EnumChoice
    })
    return enumChoices
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

export const format_edit_entry = (key: string, value: string | number | undefined, type: string | Array<string>, isNumber = false) => {
    if (value && type.includes('integer')) {
        value = Number(String(value).replace(/[^0-9]/, ""))
    }
    //add trailing zero if string ends in a decimal 
    if (value && isNumber) {
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

export const adjust_cadences = (component: Schedule) => {
    let schedule = { ...component } 
    //convert to integers 
    schedule.num_internight_cadence && (schedule.num_internight_cadence = Number(schedule.num_internight_cadence))
    schedule.num_intranight_cadence && (schedule.num_intranight_cadence = Number(schedule.num_intranight_cadence))
    schedule.num_visits_per_night && (schedule.num_visits_per_night = Number(schedule.num_visits_per_night))
    schedule.num_nights_per_semester && (schedule.num_nights_per_semester = Number(schedule.num_nights_per_semester))
    if (schedule.num_visits_per_night === 1) {
        schedule = {
            ...schedule,
            'num_intranight_cadence': 0,
        }
        console.log('setting intranight cadence to zero', component)
    }
    // if num_vists_per_night is 1, set num_internight_cadences to 0
    if (schedule.num_nights_per_semester === 1) {
        schedule = {
            ...schedule,
            'num_internight_cadence': 0,
        }
        console.log('setting internight cadence to zero', component)
    }
    // if is observing_mode is Single, set num_nights_per_semester to 1 and num_internight_cadences to 0
    if (schedule.scheduling_mode == 'Single') {
        schedule = {
            ...schedule,
            'num_nights_per_semester': 1,
            'num_internight_cadence': 0,
        }
        console.log('setting num nights to one and internight cadence to zero', component)
    }
    return schedule
}

const obSetter = (ob: OB, componentName: keyof OB) => {
    //auto fill object name with target name if empty.
    if (componentName === 'target' && ob.target.target_name && !ob.observation.object) {
        ob.observation = {
            ...ob.observation,
            'object': ob.target.target_name,
        }
    }
    // if num_vists_per_night is 1, set num_intranight_cadences to 0
    if (componentName === 'schedule' && Number(ob.schedule.num_visits_per_night ?? 0) === 1) {
        const adjustedComponent = adjust_cadences(ob[componentName])
        ob[componentName] = adjustedComponent
    }
    return ob
}

export const ob_to_component_row = (ob: OB, componentName: OBComponentName): ComponentRow => {
    const _id = ob._id ?? Math.random().toString(36).substring(7)
    const target_name = ob.target?.target_name ?? "TBD"
    const target_name_semid = target_name + '_' + ob.metadata.semid
    const cmp = ob[componentName] as Object
    const state = ob.metadata?.state ?? 'CREATED' //overwrite state with metadata state
    const ob_feasible = ob.metadata?.ob_feasible
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
    saveFunction: Function,
    row: ComponentRow,
    isNumber?: boolean
}

export interface TextChangeInput extends BaseChangeInput {
    type: string | Array<string>,
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

export const text_change = (input: TextChangeInput) => {
    const formattedValue = format_edit_entry(input.key, input.value, input.type, input.isNumber ?? false)
    const newRow = { ...input.row, [input.key]: formattedValue, state: 'ROW_EDITED' }
    input.saveFunction(newRow)
}

export const array_change = (input: ArrayChangeInput) => {
    const formattedValue = format_tags(input.value)
    const newRow = { ...input.row, [input.key]: formattedValue, state: 'ROW_EDITED' }
    input.saveFunction(newRow)
}

export const switch_change = (input: SwitchChangeInput) => {
    const value = (input.event.target as HTMLInputElement).checked
    const newRow = { ...input.row, [input.key]: value, state: 'ROW_EDITED' }
    input.saveFunction(newRow)
}

export const make_text_field = (
    key: string,
    component: OBComponent,
    componentName: OBComponentName,
    handleTextChange: Function,
    isNumber = false) => {
    const schemaProperties = ob_schemas[componentName].properties
    //@ts-ignore
    const value = component[key]
    if (!Object.keys(schemaProperties).includes(key)) {
        console.warn('make_text_field', `key ${key} not in component ${componentName}`)
        return
    }
    const shrinkInputLabel = (value==null || value==undefined || value=="")? false : true 
    return (
        <Tooltip title={input_label(key, componentName, true)}>
            <TextField
                label={input_label(key, componentName, false)}
                id={key.replace('_', '-')}
                slotProps={{
                    inputLabel: {
                        shrink: shrinkInputLabel,
                    }
                }}
                onChange={(event) => handleTextChange(key, event.target.value, isNumber)}
                value={value}
            />
        </Tooltip>)
}

export const make_autocomplete_field = (
    key: string,
    component: OBComponent,
    componentName: OBComponentName,
    handleTextChange: Function,
    defaultValue: string = "",
    label: string = "",
    choices?: { label: string }[],
    disabled = false
) => {

    const schemaProperties = ob_schemas[componentName].properties
    if (!Object.keys(schemaProperties).includes(key)) {
        console.warn('make_text_field', `key ${key} not in component ${componentName}`)
        return
    }
    //@ts-ignore
    const value = component[key] ?? defaultValue
    const options = choices ?? enum_choices(key, componentName)

    return (<Tooltip title={input_label(key, componentName, true)}>
        <Autocomplete
            disablePortal
            disabled={disabled}
            id={key.replace('_', '-')}
            value={value}
            onChange={(_, value) => handleTextChange(key, value.label ?? "")}
            options={options}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label={label} />}
        />
    </Tooltip>)
}

export const make_switch_field = (
    key: string,
    component: OBComponent,
    componentName: OBComponentName,
    handleSwitchChange: Function) => {

    const schemaProperties = ob_schemas[componentName].properties
    if (!Object.keys(schemaProperties).includes(key)) {
        console.warn('make_text_field', `key ${key} not in component ${componentName}`)
        return
    }
    //@ts-ignore
    const value = component[key]
    return (
        <Tooltip title={input_label(key, componentName, true)}>
            <FormGroup>
                <FormControlLabel
                    onChange={(event) => handleSwitchChange(key, event)}
                    control={<Switch checked={value} />}
                    label={input_label(key, componentName)} />
            </FormGroup>
        </Tooltip>
    )
}
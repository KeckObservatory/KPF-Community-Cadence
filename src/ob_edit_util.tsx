import { OB } from './module_selector';
import target_schema from './schemas/cc_target_schema.json'


interface Items extends PropertyProps {
    properties?: { [key: string]: PropertyProps }
}

export interface PropertyProps {
    description: string,
    type: string | string[],
    short_description?: string,
    default?: unknown,
    pattern?: string,
    minLength?: number,
    maxLength?: number,
    not_editable_by_user?: boolean,
    hide_column?: boolean,
    enum?: string[],
    items?: Items
    translator_mapping?: string
}

export interface SchemaProps {
    [key: string]: PropertyProps
}

const SchemaProps = target_schema.properties as SchemaProps

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
        console.log('value', value)
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

export const rowSetter = (ob: OB, componentName: keyof OB) => {
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

/* Block 0: general use definitions*/
export const WEEKDAYS: {[key:string]:string[]}= {
    "default": [
        "sun",
        "mon",
        "tue",
        "wed",
        "thu",
        "fri",
        "sat",
    ],
    "en": [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ],
    "nl": [
        "zondag",
        "maandag",
        "dinsdag",
        "woensdag",
        "donderdag",
        "vrijdag",
        "zaterdag"
    ],
    "fr": [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi"
    ]
}

/* Block 1: generic models shared between API and frontend */

// Base format for opening hours timeslots
// Empty values have an empty string for both properties
export interface HoursRange {
    open: string,
    closed: string
}

// Base format for standard opening hours fields, date agnostic
// export interface OHField {
//     week_day: number,
//     hours: HoursRange[]
// }

// Extended format for opening hours fields, for date-specific data
// export interface OHDayField extends OHField {
//     date: string,
//     description: string
// }

// Base format for exception fields
// export interface ExceptionField {
//     date: {
//         from: string,
//         until: string
//     },
//     description: string,
//     repeat: boolean,
//     hours: HoursRange[]
// }

// Base format for current opening hours data, as returned by the API
export interface current_OH_field {
    week: number,
    week_day: number,
    date: string,
    description: string,
    hours: HoursRange[]
}

// export const EMPTY_OH_DISPLAY_FIELD: OH_Display_Field = {
//     value: "",
//     type: 'text'
// }

// Base format for data fields, as returned by the API
// Note: during mapping, custom processing may be applied, e.g. empty translation fields
export interface DatabaseField {
    value: {[key:string]: string}|string,
    type:string
}

export interface translatedDatabaseField extends DatabaseField {
    value: string
}

// Toplevel structure of the response from the opening hours API
export interface OHData {
    code: string,
    name: string,
    data: {[key:string]:DatabaseField},
    current: current_OH_field[]
}

/* Block 2: Mapping field models used to control frontend options */

// Mapping field for labels, allows to select label source
export interface OH_Display_Field{
    field_name: string,
    type: string,// turn into enum
    value: string|{[key:string]:string},
    label?: LabelField,
    //tool_type?: string,// turn into enum
    custom_icon?: IconField
}

// export const EMPTY_OH_Display_Field: OH_Display_Field = {
//     type: 'text',
//     value: ''
// }

export interface LabelField {
    type: 'OH_db'|'NDE'|'text',
    value: string|{[key:string]:string},
}

export interface IconField {
    icon_type: 'svg'|'mat-icon',
    icon_path: string
}

// Mapping field for tools, geared towards custom processing and display per tool type
// export interface ToolField {
//     field: DatabaseField,
//     tool_type: string,
//     label: LabelField
// }

// Interface representing the structure of the overall opening hours mapping
// export interface ContactDetails {
//     lib_name: DatabaseField|undefined,
//     lib_photo: DatabaseField|undefined,
//     address: DatabaseField[],
//     social_media: {
//         field:DatabaseField,
//         platform:string
//     }[],
//     extra: ToolField[],
//     consultation: ToolField[],
//     appointment_only: boolean
// }

export interface OpeningHoursMap {
    base_URL: string,
    default_lang: string,
    general: {[key:string]: any}, 
    contact_details: {[key:string]: OHMapField[]},
    opening_hours_config: {[key:string]: any},
}

export interface OHGeneralField {
    field_name: string,
    field_source: 'NDE'|'OH_db'|'None',
    default?:string
}

export interface OHMapField {
    field_name: string,
    tool_type?: string,
    field_label?: {
        label_name: string,
        label_type: 'text'|'OH_db'|'NDE',
    },
    field_icon?: IconField,
    default?:string,
}

export interface OHStatusField {
    open_now: boolean,
    next_change: ParsedTimeslot|undefined
}

export interface ParsedTimeslot{
    open: Date,
    closed: Date
}

// Toplevel structure of the parsed opening hours data, language agnostic
export interface OpeningHoursOverview {
    default_lang: string,
    general: {[key:string]: {
        'value':string|{[key:string]:string},
        'type': 'text'|'NDE'
    }},
    contact_details: {[key:string]: OH_Display_Field[]},
    this_week: current_OH_field[],
    next_week: current_OH_field[],
    curr_status: OHStatusField,
    occupancy?: OccupancyField
}

export interface OccupancyField {
    value: {
        current: number,
        maximum: number
    },
    type: 'occupancy'
}

export const DEFAULT_OCCUPANCY: OccupancyField = {
    value: {
        current: 0,
        maximum: 0
    },
    type: 'occupancy'
}

// export const EMPTY_CONTACT_DETAILS: ContactDetails = {
//     lib_name: {
//       value: "My library",
//       type: 'text',
//     },
//     lib_photo: undefined,
//     address: [],
//     social_media: [],
//     extra: [],
//     consultation: [],
//     appointment_only: false
// }

export const EMPTY_OH_OVERVIEW: OpeningHoursOverview = {
    default_lang: 'en',
    general: {},
    contact_details: {},
    this_week: [],
    next_week: [],
    curr_status: {
        open_now: false,
        next_change: undefined
    } as OHStatusField
}
















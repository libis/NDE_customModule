/* Block 0: general use definitions*/
// Weekdays translation array
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

/* Block 1: Opening hours API fields - raw or minimally parsed data */
// Base format for opening hours timeslots - empty entries 
export interface HoursRange {
    open: string,
    closed: string
}

// Base format for current opening hours data, as returned by the API
export interface current_OH_field {
    week: number,
    week_day: number,
    date: string,
    description: string,
    hours: HoursRange[]
}

// [currently not in use] Base format for opening hours week info
export interface OH_week_field {
    number: number,
    start: string,
    end: string
}

// [currently not in use] Base format for default opening hours schedule
export interface default_OH_field {
    week_day: number,
    hours: HoursRange[]
}

// [currently not in use] Base format for opening hours exceptions
export interface exception_OH_field {
    date: {
        from: string,
        to: string
    },
    description: string,
    repeat: boolean,
    hours: HoursRange[]
}

// Base format for data fields, as returned by the API (only properties relevant to Primo NDE are included)
// Note: during mapping, custom processing may be applied, e.g. removal of empty translation fields
export interface OH_DatabaseField {
    value: {[key:string]: string}|string|boolean,
    type:string
}

// Translated variant for easier use in html-templates
export interface translatedDatabaseField extends OH_DatabaseField {
    value: string
}

// Toplevel structure of the response from the opening hours API - only fields relevant to Primo NDE are included
export interface OH_Data {
    code: string,
    name: string,
    data: {[key:string]:OH_DatabaseField},
    current: current_OH_field[]
}

/* Block 2: Mapping field models used for configuration */

// Custom labels
export interface Label_Mapping_Field {
    label_type: 'NDE'|'database'|'text',
    label_name: string
}

// Contact details fields
export interface Data_Mapping_Field {
    field_name: string,
    tool_type?: string,
    field_label?: Label_Mapping_Field,
    field_icon?: IconField,
    default?: any
}

// Mapping fields for general section
export interface General_Mapping_Field {
    field_name:string,
    field_source: 'NDE'|'database'|'text'|'None',
    default?: string|boolean|null
}

// Overall structure of Opening Hours Map
export interface Opening_Hours_Map {
    base_URL: string,
    default_lang: string,
    general: {[key:string]: General_Mapping_Field}, 
    contact_details: {[key:string]: Data_Mapping_Field[]},
    opening_hours_config: {
        start_day: number|'today'
    },
}

export interface IconField {
    icon_type: 'mat-icon'|'svg',
    icon_name: string
}

/* Block 3: Display field models (including translated fields) */
export interface Label_Display_Field {
    type: 'database'|'NDE'|'text',
    value: string|{[key:string]:string},
}

export interface Transl_Label_Field extends Label_Display_Field {
    value: string
}

export interface General_Display_Field {
    value: string|{[key:string]:string}|boolean,
    type: 'database'|'NDE'|'text'
}

export interface Transl_General_Display_Field {
    value: string|boolean
}

export interface Data_Display_Field{
    field_name: string,
    type: string,// turn into enum
    value: string|{[key:string]:string}|boolean,
    label?: Label_Display_Field,
    custom_icon?: IconField
}

export interface Transl_Data_Display_Field extends Data_Display_Field {
    value: string|boolean,
    label?: Transl_Label_Field
}






export interface OH_Status_Field {
    open_now: boolean,
    next_change: Parsed_Timeslot|undefined
}

export interface Parsed_Timeslot{
    open: Date,
    closed: Date
}

// Toplevel structure of the parsed opening hours data, language agnostic
export interface OpeningHoursOverview {
    default_lang: string,
    general: {[key:string]: General_Display_Field},
    contact_details: {[key:string]: Data_Display_Field[]},
    this_week: current_OH_field[],
    next_week: current_OH_field[],
    curr_status: OH_Status_Field,
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

export const EMPTY_OH_OVERVIEW: OpeningHoursOverview = {
    default_lang: 'en',
    general: {},
    contact_details: {},
    this_week: [],
    next_week: [],
    curr_status: {
        open_now: false,
        next_change: undefined
    } as OH_Status_Field
}
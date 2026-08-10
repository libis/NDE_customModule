/* Block 0: general use definitions*/
export const WEEKDAYS = {
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
export interface OHField {
    week_day: string,
    hours: HoursRange[]
}

// Extended format for opening hours fields, for date-specific data
export interface OHDayField extends OHField {
    date: string,
    description: string
}

// Base format for exception fields
export interface ExceptionField {
    date: {
        from: string,
        until: string
    },
    description: string,
    repeat: boolean,
    hours: HoursRange[]
}

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
    data: DatabaseField[],
    week: {
        "number": number,
        "start": string,
        "end": string
    },
    defaults: OHField[],
    current: OHDayField[]
}

/* Block 2: Mapping field models used to control frontend options */

// Mapping field for labels, allows to select label source
export interface LabelField {
    type: string,
    value: string|DatabaseField,
    Default: string
}

// Mapping field for tools, geared towards custom processing and display per tool type
export interface ToolField {
    field: DatabaseField,
    tool_type: string,
    label: LabelField
}

// Interface representing the structure of the overall opening hours mapping
export interface ContactDetails {
    lib_name: DatabaseField|undefined,
    lib_photo: DatabaseField|undefined,
    address: DatabaseField[],
    social_media: {
        field:DatabaseField,
        platform:string
    }[],
    extra: ToolField[],
    consultation: ToolField[],
    appointment_only: boolean
}

export interface OpeningHoursMap {
    base_URL: string,
    default_lang: string,
    field_map: {[key:string]: any},
    opening_hours_config: {[key:string]: any},
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
    contact_details: ContactDetails,
    this_week: OHDayField[],
    next_week: OHDayField[],
    curr_status: OHStatusField
}

export const EMPTY_CONTACT_DETAILS: ContactDetails = {
    lib_name: {
      value: "My library",
      type: 'text',
    },
    lib_photo: undefined,
    address: [],
    social_media: [],
    extra: [],
    consultation: [],
    appointment_only: false
}

export const EMPTY_OH_OVERVIEW: OpeningHoursOverview = {
    default_lang: 'en',
    contact_details: EMPTY_CONTACT_DETAILS,
    this_week: [],
    next_week: [],
    curr_status: {
        open_now: false,
        next_change: undefined
    } as OHStatusField
}
















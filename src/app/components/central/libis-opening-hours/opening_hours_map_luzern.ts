import { OpeningHoursMap } from './libis-opening-hours-models.model';

export const OPENING_HOURS_MAP: OpeningHoursMap = {
  base_URL: 'https://services.libis.be/opening_hours/32KUL',
  default_lang: 'en',
  general: {
    OH_title: {
      field_name: 'nde.custom.opening_hours.title',
      field_source: 'NDE',
      default: 'Opening hours',
    },
    OH_subtitle: {
      field_name: 'nde.custom.opening_hours.subtitle',
      field_source: 'NDE',
    },
    lib_name: {
      field_name: 'name',
      field_source: 'OH_db',
      default: 'My library',
    },
    appointment_only: {
      field_name: 'appointment_only',
      field_source: 'None',
      default: false,
    },
    activate_OH: {
      field_name: '',
      field_source: 'None',
      default: false,
    },
  },
  contact_details: {
    lib_photo: [
      {
        field_name: 'lib_photo',
        tool_type: 'image',
        default:
          'https://assets.libis.be/limo/library_info/library_default.png',
      },
    ],
    phys_address: [
      {
        field_name: 'name',
        tool_type:'section_heading'
      },
      { field_name: 'address_building',
        tool_type: 'section_heading'
       },
      { field_name: 'address_line1' },
      { field_name: 'address_line2' },
      { field_name: 'address_line3' },
    ],
    other_address_info: [
      { field_name: 'tel' },
      { field_name: 'email' },
      { field_name: 'lib_website' },
    ],
    consultation: [
      {
        field_name: 'general_note',
        tool_type: 'html_text',
      },
      {
        field_name: 'general_note_2',
        tool_type: 'html_text',
      },
      {
        field_name: 'info_url',
        field_label: {
          label_type: 'OH_db',
          label_name: 'info_url_text',
        },
      },
    ],
    room_info: [
      {
        field_name: 'occupancy',
        tool_type: 'occupancy',
      },
      {
        field_name: 'reservation_link',
        field_label: {
          label_type: 'OH_db',
          label_name: 'reservation_text',
        },
      },
    ],
  },
  opening_hours_config: {
    start_day: 'today',
  },
};

// export const OPENING_HOURS_MAP = {
//         base_URL: "https://services.libis.be/opening_hours/32KUL",
//         default_lang: "en",
//         "contact_details": {
//             //"lib_name": "name",
//             "lib_photo": [
//                 {
//                 field_name: "lib_photo",
//                 tool_type: "image"
//             }
//         ],
//             "address": [
//                 {field_name: "address_building"},
//                 {field_name: "address_line1"},
//                 {field_name: "address_line2"},
//                 {field_name: "address_line3"},
//                 {field_name: "email"},
//                {field_name:  "tel"},
//                 {field_name: "lib_website"}
//             ],
//             "social_media": [
//                 {
//                     field_name:"facebook",
//                     field_label: {
//                         label_type:"NDE",
//                         label_name:"nde.custom.facebook"
//                     },
//                     field_icon:{
//                         type:"svg",
//                         value: "facebook.svg"
//                     }
//                 },
//                 {
//                     field_name:"instagram",
//                     label: {
//                         type: 'NDE',
//                         value: 'nde.custom.instagram'
//                     },
//                     custom_icon: {
//                         type: "NDE",
//                         value: "nde.custom.instagram"
//                     }
//                 }
//             ],
//             "extra": [
//             {
//                 "field": "route",
//                 "tool_type": "route",
//                 "label": {
//                     "type": "NDE",
//                     "value": "",
//                     "default":""
//                 }
//             },
//             {
//                 "field": "general_note",
//                 "tool_type": "note",
//                 "label": {
//                     "type": "text",
//                     "value": "",
//                     "default":""
//                 }
//             }
//     ],
//         "consultation": [
//             {
//                 "field":"opening_hours_note",
//                 "tool_type":"note",
//                 "label": {
//                     "type": "text",
//                     "value": "",
//                     "default":""
//                 }
//             }
//         ]
//         },
//         "appointment": "appointment_only",
//         "opening_hours_config": {
//             "title": {
//                 "field":"",
//                 "default":""
//             },
//             "subtitle": {
//                 "field":"",
//                 "default":""
//             },
//             "start_day": 1
//         }
//     } as OpeningHoursMap;

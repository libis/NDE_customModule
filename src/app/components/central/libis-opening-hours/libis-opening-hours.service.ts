import { Injectable } from '@angular/core';
import {OPENING_HOURS_MAP} from './opening_hours_map';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import {
  DatabaseField,
  EMPTY_OH_OVERVIEW,
  HoursRange,
  OHData,
  current_OH_field,
  OHStatusField,
  OpeningHoursMap,
  OpeningHoursOverview,
  ParsedTimeslot,
  OHMapField,
  OH_Display_Field,
  LabelField,
  OccupancyField,
} from './libis-opening-hours-models.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LIBISOpeningHoursService {
  //private openingHoursMap: OpeningHoursMap =opening_hours_map.opening_hours_map as OpeningHoursMap;
  private http: HttpClient;
  private transl: TranslateService;
  //opening_hours_default_lang = this.openingHoursMap.default_lang;

  constructor(http: HttpClient, transl: TranslateService) {
    this.http = http;
    this.transl = transl;

  }

  getOpeningHoursDefaultLang(){
    return OPENING_HOURS_MAP.default_lang;
  }

  // [ready to go] Collect opening hours from the institution's opening hours endpoint
  getOpeningHours(inst_code: string, lib_code: string, week?: number) {
     let OH_URL = `${OPENING_HOURS_MAP.base_URL}/${inst_code}/${lib_code}?accept=application/json`;
     if(OPENING_HOURS_MAP.opening_hours_config['start_day'] === 'today'){
      OH_URL += '&from_today=1';
     }

    // Return an observable that fetches the opening hours data and processes it
    return this.http.get(OH_URL).pipe(
      map((response) => this.parseOpeningHoursFull(response as OHData)),
      catchError((error) => {
        console.error('Error fetching opening hours:', error);
        return throwError(() => new Error('Failed to fetch opening hours'));
      }),
    );
  }

  parseOpeningHoursFull(raw_OH: OHData): any {
    console.log('Raw Opening hours data', JSON.stringify(raw_OH), typeof raw_OH);

    // Initialize empty opening hours overview
    let opening_hours_data: OpeningHoursOverview = structuredClone(EMPTY_OH_OVERVIEW);
    
    // Copy fixed settings from the opening hours map
    opening_hours_data.default_lang = OPENING_HOURS_MAP.default_lang;    

    // Add general data sections
    opening_hours_data.general = this.parseGeneralFields(raw_OH)
    // If 'lib_name' is empty after this step, copy default value from raw_OH
    if (!('lib_name' in opening_hours_data.general)){
        opening_hours_data.general['lib_name'] = {'value':raw_OH.name, 'type': 'text'}
    }

    // Add contact details
    for(const section in OPENING_HOURS_MAP.contact_details){
      opening_hours_data.contact_details[section] = [];
      for(const map_field of OPENING_HOURS_MAP.contact_details[section]){
        let contact_field = this.parseOHField(raw_OH, map_field);
        if(contact_field){
          opening_hours_data.contact_details[section].push(contact_field);
        }
      }
    }

    // Revised method: Copy opening hours of the current week and filter out empty timeslots
    opening_hours_data.this_week = structuredClone(raw_OH.current);
    opening_hours_data.this_week.forEach((day: current_OH_field) => {
      day.hours = day.hours.filter((h) => h.open !== '' && h.closed !== '');
    });

    // Calculate current status
    opening_hours_data['curr_status'] = this.calculateCurrentStatus(raw_OH);

    // Add occupancy
    opening_hours_data.occupancy = raw_OH.data['occupancy'] as unknown as OccupancyField;

    console.log('Parsed Opening hours data', JSON.stringify(opening_hours_data));
    return opening_hours_data;
  }

  // [ready to go] Revised method
  private parseGeneralFields(OH_data:OHData):{[key:string]:any}{
    let general_section: {[key:string]: {}} = {};
    
    for(const field in OPENING_HOURS_MAP.general){
      console.log(`Parsing general field ${field} with value ${OPENING_HOURS_MAP.general[field]}`);
      switch(OPENING_HOURS_MAP.general[field].field_source){
        case 'NDE':
          general_section[field] = {'value':OPENING_HOURS_MAP.general[field].field_name, 'type': 'NDE'}
        break;
        case 'OH_db':
          if(OPENING_HOURS_MAP.general[field].field_name in OH_data.data){
          let field_value = this.preprocessDbField(OH_data.data[OPENING_HOURS_MAP.general[field].field_name]);
          if(field_value !== undefined){
            general_section[field] = {'value': field_value, 'type': OH_data.data[OPENING_HOURS_MAP.general[field].field_name].type};
          }
          }
        break;
      }
      console.log(`Parsed general field ${field} to value ${general_section[field]}`);

    }
    console.log('Finished parsing general section: ', general_section);
    return general_section
  } 

  // Revised method for contact details prefab translation. Enforces the same language for all text fields to ensure consistent viewing experience
 translateContactDetails(OH_overview:OpeningHoursOverview, curr_lang: string, def_lang: string): {[key:string]:OH_Display_Field[]} {
  console.log('Translating contact details: ', OH_overview, curr_lang, def_lang);  
  let contact: {[key:string]:OH_Display_Field[]} = {};
    console.log('Calculating language-specific contact details: ', contact);
    console.log('Incoming language settings: ', curr_lang, def_lang);

    for(const section in OH_overview.contact_details){
      contact[section] = [];
      for(const field of OH_overview.contact_details[section]){
        let transl_field = structuredClone(field)
        switch(transl_field.type){
          case 'text':
            if(typeof field.value === 'object'){
              if(curr_lang in field.value){
                transl_field.value = field.value[curr_lang];
              }
              else {
                this.translateContactDetails(OH_overview, def_lang, def_lang);                
              }
            }
            break;
          case 'textarea':
          case 'html_text':
          case 'section_heading':
          case 'image':
          case 'route':
          case 'url':
            if(typeof field.value === 'object'){
              transl_field.value = field.value[curr_lang] ?? field.value[def_lang] ?? field.value[Object.keys(field.value)[0]];
            }                  
          }

          // Translate field labels if necessary
          if(field.label && field.label.type === 'OH_db' && typeof field.label.value === 'object' && transl_field.label){
            transl_field.label.value = field.label.value[curr_lang] ?? field.label.value[def_lang] ?? field.label.value[Object.keys(field.label.value)[0]];
          }

          if(field.label && field.label.type === 'NDE' && typeof field.label.value === 'string' && transl_field.label){
            console.log('Translating NDE label', field.label.value);
            console.log('Translated NDE label: ', this.transl.instant(field.label.value));
            transl_field.label.value = this.transl.instant(field.label.value);

          }
          contact[section].push(transl_field);
        }
      }
    console.log('Translated contact details: ', contact);
    return contact;
  }

  translateGeneralInfo(OH_overview:OpeningHoursOverview, curr_lang: string, def_lang: string):{[key:string]: {
        'value':string|{[key:string]:string},
        'type': 'text'|'NDE'|'OH_db'
    }}{
    let translInfo = structuredClone(OH_overview.general);
    for(const field in OH_overview.general){
      //let translField = {'type': OH_overview.general[field].type, 'value': OH_overview.general[field].value}
      if(translInfo[field].type === 'OH_db' && typeof translInfo[field].value === 'object'){
            translInfo[field].value = translInfo[field].value[curr_lang] ?? translInfo[field].value[def_lang] ?? translInfo[field].value[Object.keys(translInfo[field])[0]];
      } else if (OH_overview.general[field].type === 'NDE' && typeof translInfo[field].value === 'string'){
        translInfo[field].value = this.transl.instant(translInfo[field].value);
      }
    }
    return translInfo;
  } 

  // [ready to go] method to calculate current opening status and next change
    private calculateCurrentStatus(OH_data: OHData): OHStatusField {
    // Get current timestamp for matching and initialise status object
    const curr_time = new Date(Date.now());
    let curr_status = {
      open_now: false,
      next_change: undefined,
    } as OHStatusField;

    // Parse all timeslots into a structured object
    let all_openings = [] as ParsedTimeslot[];
    for (const dateSet of OH_data['current']) {
      for (const hoursSet of dateSet.hours) {
        if (hoursSet.open !== '' && hoursSet.closed !== '') {
          all_openings.push({
            open: new Date(Date.parse(`${dateSet.date}T${hoursSet.open}`)),
            closed: new Date(Date.parse(`${dateSet.date}T${hoursSet.closed}`)),
          });
        }
      }
    }
    //console.log('Openings', all_openings);

    // Loop over all openings to determine the best match. Stop when conditions are met
    for (const timeSlot of all_openings) {
      // Try to find matching element. If found, set "open_now" to 'true'
      if (timeSlot.open <= curr_time && curr_time <= timeSlot.closed) {
        //console.log('Found current opening');
        curr_status.open_now = true;
        curr_status.next_change = timeSlot;
        break;
      }
    }
    // If at this point the status is closed, loop over the openings to find the next opening time that is
    if (curr_status.open_now === false) {
      for (const timeSlot of all_openings) {
        if (timeSlot.open >= curr_time) {
          curr_status.next_change = timeSlot;
          break;
        }
      }
    }
    return curr_status;
  }

 // Old method - replaced by revised code
//   translateContactDetails_old(OH_overview: OpeningHoursOverview, curr_lang: string, def_lang: string): ContactDetails {
//     let contact = structuredClone(OH_overview.contact_details);
//     console.log('Calculating language-specific contact details: ', contact);
//     console.log('Incoming language settings: ', curr_lang, def_lang);

//     for(const field_key in contact){

//         switch(field_key){

//             case 'lib_name':
//             case 'lib_photo':
//                 if((contact[field_key] !== undefined) && (typeof contact[field_key] !== 'string')){
//                     contact[field_key].value = this.translContactField(contact[field_key], curr_lang, def_lang);
//                 }
//                 break;
//             case 'address':
//                 contact[field_key].forEach(f => {
//                     f.value = this.translContactField(f, curr_lang, def_lang);
//                 });
//                 break;
//             case 'social_media':
//             case 'extra':
//             case 'consultation':
//                 contact[field_key].forEach (f => {
//                     f.field.value = this.translContactField(f.field, curr_lang, def_lang);
//                     if(('label' in f) && (f.label.type === 'OH_db')){
//                         f.label.value = this.translContactField(f.label, curr_lang, def_lang);
//                     }
//                 });
//                 break;       
//             }
    

//     }

//     return contact;    
// }

// [ready-to-go] Revised method - use for parsing of new style display fields
private parseOHField(OH_data: OHData, mapping_field: OHMapField): OH_Display_Field|undefined {
  let field_value = undefined;

  // Try to collect the matching database field
  if(mapping_field.field_name in OH_data.data){
    // Collect and prefilter the database-field. If the value is empty or invalid, the field will be considered absent
    field_value = this.preprocessDbField(OH_data.data[mapping_field.field_name]);
  }

  // If field value is undefined after this step, apply default value, if defined
  if(field_value === undefined){
      // If a default is defined, set value to the default instead. Else, end method with undefined
      // Default values are always hardcoded string, so use with caution
      if(mapping_field.default){
        field_value = mapping_field.default;
      }
      else{
      return undefined;
      }
    }

    // For future use: add reference to additional pre-processing method for specialized tool_types here

    // Create initial OH_Display_Field
    let display_field: OH_Display_Field = {
      field_name: mapping_field.field_name,
      value: field_value,
      type: mapping_field.tool_type ? mapping_field.tool_type : OH_data.data[mapping_field.field_name].type ?? 'text'
    };
    if(mapping_field.field_icon !== undefined){
      display_field.custom_icon = mapping_field.field_icon;
    }

    // Collect and preprocess label, if defined
    if(mapping_field.field_label !== undefined){
    let display_label = this.collectLabel(OH_data, mapping_field);
    if (display_label !== undefined){
      display_field.label = display_label;
    }
    }
    return display_field;
}

// [ready-to-go] Revised method - used in parsing method for new style display fields
private collectLabel(OH_data: OHData, mapping_field:OHMapField):LabelField|undefined{

  if(mapping_field.field_label){
  switch (mapping_field.field_label.label_type){
    case 'text':
    case 'NDE':
      if(mapping_field.field_label.label_name.trim() !== ''){

      return {
        type: mapping_field.field_label.label_type,
        value: mapping_field.field_label.label_name
      };
    }
      return undefined;
    case 'OH_db':
      if(mapping_field.field_label.label_name in OH_data.data){
        let display_value = this.preprocessDbField(OH_data.data[mapping_field.field_label.label_name])
        if(display_value === undefined){
          return undefined
        }
        return {
        type: mapping_field.field_label.label_type,
        value: display_value
      }
    }
      return undefined;
  }
}
  return undefined
}


// [ready to go] Revised method for filtering database field values
private preprocessDbField(Db_field: DatabaseField): any{
  let field_value: any = structuredClone(Db_field.value);
  // Filter raw field values. If empty, reject the field and return undefined
  switch(Db_field.type){
    // Filter empty language entries for translatable fields
    case 'text':
    case 'textarea':
    case 'url':
      field_value = Object.fromEntries(
        Object.entries(Db_field.value).filter(([key, val]) => val.trim() !== ''),
      );
      if (Object.keys(field_value).length === 0){
        return undefined;
      }
      break;
    case 'tel':
    case 'email':
      if (Db_field.value === ''){
        return undefined
      }
      break;
  }
  return field_value;
}


// // Standard method to collect relevant database field from the raw response data
// private collectDatabaseField(OH_data: OHData, field_name: string): DatabaseField | undefined {
//   // Check if the field is present in the opening hours data
//   if (field_name in OH_data.data) {
//     return this.preprocessDbField(OH_data.data[field_name]);
//   }
//   return undefined;
// }

//  private translContactField(contactField: any, curr_lang: string, def_lang: string): string {
//   //console.log('Contact field: ', contactField);
//   if(['text', 'textarea', 'url'].includes(contactField.type)){
//     if(curr_lang in contactField.value){
//         return contactField.value[curr_lang];
//     }
//     else if(def_lang in contactField.value){
//         return contactField.value[def_lang];
//     }
//     else{
//         return contactField.value[Object.keys(contactField.value)[0]];
//     }
//   }
//   return contactField.value;
//  }

//  // Old method - no longer used
//   private collectOpeningsOverview(OH_data: OHData): current_OH_field[] {
//     let this_week = OH_data['current'];

//     if (OPENING_HOURS_MAP.opening_hours_config['start_date'] == 1) {
//       this_week = OH_data['current'];
//     }

//     // Filter out empty


//     return this_week;
//   }

  // Old method - no longer used
  // private parseDataField(field_map: any, OH_data: any): any {
  //   //console.log('Incoming field data for parsing: ', field);

  //   // Simple string value representing database field name ==> return the databasefield
  //   if (typeof field_map === 'string') {
  //     //console.log('Detected string mapping');
  //     if (field_map in OH_data) {
  //       //console.log('String field found in database');
  //       return this.preprocessDbField(OH_data[field_map]);
  //     }
  //     return undefined;
  //   }

  //   // Array of fields ==> loop over the array and collect relevant fields
  //   else if (Array.isArray(field_map)) {
  //     //console.log('Detected array mapping');
  //     let field_set: any = [];

  //     // Loop over fields, recursively call this function
  //     field_map.forEach((subf) => {
  //       let field_value = this.parseDataField(subf, OH_data);
  //       if (field_value !== undefined) {
  //         //console.log('Received field value: ', field_value);
  //         field_set.push(field_value);
  //       }
  //     });

  //     return field_set;
  //   }

  //   // Object mapping ==> collect field and label values (if applicable)
  //   else if (typeof field_map === 'object') {
  //     //console.log('Detected object mapping');
  //     // Get the database field name from the 'field' property
  //     if (field_map.field in OH_data) {
  //       // Collect field value
  //       field_map.field = this.preprocessDbField(OH_data[field_map.field]);
  //       if (field_map.field === undefined) {
  //         return undefined;
  //       }

  //       //Check if label has to be collected (label type = database)
  //       if ('label' in field_map && field_map.label.type === 'database') {
  //         let db_label = this.preprocessDbField(OH_data[field_map.label.value]);
  //         if (db_label !== undefined) {
  //           field_map.label.value = db_label;
  //         } else {
  //           field_map.label.value = '';
  //         }
  //       }
  //       //console.log('Returning field: ', field_map);
  //       return field_map;
  //     }
  //     return undefined;
  //   }
  // }
  
  // Method to perform basic pre-processing on database field values - returns initial Opening Hours
  // private preprocessDbField(field: DatabaseField): DatabaseField | undefined {
  //   //console.log('incoming database field: ', field);

  //   // Check if the field is a translatable field. If yes, purge empty entries
  //   if (typeof field.value === 'object') {
  //     field.value = Object.fromEntries(
  //       Object.entries(field.value).filter(([key, val]) => val.trim() !== ''),
  //     );

  //     // If no entries remain, consider the field empty and return undefined
  //     if (Object.keys(field.value).length === 0) {
  //       return undefined;
  //     }
  //   } else {
  //     if (field.value.trim() === '') {
  //       return undefined;
  //     }
  //   }
  //   return field;
  // }
}

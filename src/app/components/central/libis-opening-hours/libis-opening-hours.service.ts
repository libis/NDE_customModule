import { Injectable } from '@angular/core';
import {OPENING_HOURS_MAP} from './opening_hours_map';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import {
  OH_DatabaseField,
  EMPTY_OH_OVERVIEW,
  HoursRange,
  OH_Data,
  current_OH_field,
  OH_Status_Field,
  Opening_Hours_Map,
  OpeningHoursOverview,
  Parsed_Timeslot,
  Data_Mapping_Field,
  Data_Display_Field,
  Label_Display_Field,
  OccupancyField,
  General_Display_Field,
  Transl_Data_Display_Field,
  Transl_General_Display_Field,
} from './libis-opening-hours-models.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LIBISOpeningHoursService {
  //private openingHoursMap: OpeningHoursMap =opening_hours_map.opening_hours_map as OpeningHoursMap;
  //private http: HttpClient;
  //private transl: TranslateService;

  constructor(private http: HttpClient,
    private transl: TranslateService) {}

  // Getter for opening hours default language
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
      map((response) => this.parseOpeningHoursFull(response as OH_Data)),
      catchError((error) => {
        console.error('Error fetching opening hours:', error);
        return throwError(() => new Error('Failed to fetch opening hours'));
      }),
    );
  }

  // [ready to go] Preparse Opening Hours overview for use in component
  parseOpeningHoursFull(raw_OH: OH_Data): any {
    //console.log('Raw Opening hours data', JSON.stringify(raw_OH), typeof raw_OH);

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

    //console.log('Parsed Opening hours data', JSON.stringify(opening_hours_data));
    return opening_hours_data;
  }

  // [ready to go] Parse general fields for display (non-translated)
  private parseGeneralFields(OH_data:OH_Data):{[key:string]:General_Display_Field}{
    let general_section: {[key:string]: General_Display_Field} = {};
    
    for(const field in OPENING_HOURS_MAP.general){
      //console.log(`Parsing general field ${field} with value ${OPENING_HOURS_MAP.general[field]}`);
      switch(OPENING_HOURS_MAP.general[field].field_source){
        case 'NDE':
          general_section[field] = {'value':OPENING_HOURS_MAP.general[field].field_name, 'type': 'NDE'}
        break;
        case 'database':
          if(OPENING_HOURS_MAP.general[field].field_name in OH_data.data){
          let field_value = this.preprocessDbField(OH_data.data[OPENING_HOURS_MAP.general[field].field_name]);
          if(field_value !== undefined){
            general_section[field] = {'value': field_value, 'type': 'database'};
          }
          }
        break;
        case 'text':
          general_section[field] = {'value':OPENING_HOURS_MAP.general[field].field_name, 'type': 'text'}
        break;
      }
      //console.log(`Parsed general field ${field} to value ${general_section[field]}`);
    }
    //console.log('Finished parsing general section: ', general_section);
    return general_section
  } 

  // [ready to go] Translate contact details. Enforces the same language for all text fields to ensure consistent viewing experience
 translateContactDetails(OH_overview:OpeningHoursOverview, curr_lang: string, def_lang: string): {[key:string]:Transl_Data_Display_Field[]} {
  //console.log('Translating contact details: ', OH_overview, curr_lang, def_lang);  
  let contact: {[key:string]:Transl_Data_Display_Field[]} = {};
    //console.log('Calculating language-specific contact details: ', contact);
    //console.log('Incoming language settings: ', curr_lang, def_lang);

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
              else if (def_lang in field.value) {
                this.translateContactDetails(OH_overview, def_lang, def_lang);                
              }
              else {
                const use_lang = field.value[Object.keys(field.value)[0]];
                this.translateContactDetails(OH_overview, use_lang, use_lang);
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
          if(field.label && field.label.type === 'database' && typeof field.label.value === 'object' && transl_field.label){
            transl_field.label.value = field.label.value[curr_lang] ?? field.label.value[def_lang] ?? field.label.value[Object.keys(field.label.value)[0]];
          }

          if(field.label && field.label.type === 'NDE' && typeof field.label.value === 'string' && transl_field.label){
            //console.log('Translating NDE label', field.label.value);
            //console.log('Translated NDE label: ', this.transl.instant(field.label.value));
            transl_field.label.value = this.transl.instant(field.label.value);
          }
          contact[section].push(transl_field as Transl_Data_Display_Field);
        }
      }
    //console.log('Translated contact details: ', contact);
    return contact;
  }

  //[ready to go] Translate general info fields
  translateGeneralInfo(OH_overview:OpeningHoursOverview, curr_lang: string, def_lang: string):{[key:string]: Transl_General_Display_Field}{
      //console.log(`Translating Opening Hours general info for lang ${curr_lang} from info set: `, OH_overview.general);
    let translInfo: {[key:string]:Transl_General_Display_Field} = {}
    for(const field in OH_overview.general){
      let translField = structuredClone(OH_overview.general[field])

      //let translField = {'type': OH_overview.general[field].type, 'value': OH_overview.general[field].value}
      if(translField.type === 'database' && typeof translField.value === 'object'){
        //console.log('Translating OH database field', translField);
            translField.value = translField.value[curr_lang] ?? translField.value[def_lang] ?? translField.value[Object.keys(translField)[0]];
      } else if (OH_overview.general[field].type === 'NDE' && typeof translField.value === 'string'){
        //console.log('Translating NDE code ', translField);
        translField.value = this.transl.instant(translField.value);
      }

      translInfo[field] = translField as Transl_General_Display_Field;
    }
    //console.log('Translated Opening Hours general info: ', translInfo);
    return translInfo;
  } 

  // [ready to go] Calculate current opening status and next change
    private calculateCurrentStatus(OH_data: OH_Data): OH_Status_Field {
    // Get current timestamp for matching and initialise status object
    const curr_time = new Date(Date.now());
    let curr_status = {
      open_now: false,
      next_change: undefined,
    } as OH_Status_Field;

    // Parse all timeslots into a structured object
    let all_openings = [] as Parsed_Timeslot[];
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

// [ready-to-go] Preprocess database fields - general method
private parseOHField(OH_data: OH_Data, mapping_field: Data_Mapping_Field): Data_Display_Field|undefined {
  let field_value = undefined;

  // Try to collect the matching database field
  if(mapping_field.field_name in OH_data.data){
    // Collect and prefilter the database-field. If the value is empty or invalid, the field will be considered absent
    field_value = this.preprocessDbField(OH_data.data[mapping_field.field_name]);
  }

  // If field value is undefined after this step, apply default value, if defined
  if(field_value === undefined){
      // If a default is defined, set value to the default instead. Else, end method with undefined
      // Default values are always hardcoded strings, so use with caution
      if(mapping_field.default){
        field_value = mapping_field.default;
      }
      else{
      return undefined;
      }
    }

    // For future use: add reference to additional pre-processing method for specialized tool_types here

    // Create initial OH_Display_Field
    let display_field: Data_Display_Field = {
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

// [ready-to-go] Collect and preprocess custom label for contact details field
private collectLabel(OH_data: OH_Data, mapping_field:Data_Mapping_Field):Label_Display_Field|undefined{

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
    case 'database':
      if(mapping_field.field_label.label_name in OH_data.data){
        let display_value = this.preprocessDbField(OH_data.data[mapping_field.field_label.label_name])
        if(display_value === undefined){
          return undefined
        }
        return {
        type: mapping_field.field_label.label_type,
        value: display_value as string|{[key:string]:string}
      }
    }
      return undefined;
  }
}
  return undefined
}


// [ready to go] Filter out empty database field values - only applicable to translatable fields
private preprocessDbField(Db_field: OH_DatabaseField): string|{[key:string]:string}|boolean|undefined {
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
}

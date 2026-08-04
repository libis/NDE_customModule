import { Injectable } from '@angular/core';
import opening_hours_map from '../libis-opening-hours/opening_hours_map.json';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import {
  ContactDetails,
  DatabaseField,
  EMPTY_CONTACT_DETAILS,
  EMPTY_OH_OVERVIEW,
  HoursRange,
  OHData,
  OHDayField,
  OHStatusField,
  OpeningHoursMap,
  OpeningHoursOverview,
  ParsedTimeslot,
} from './libis-opening-hours-models.model';

@Injectable({
  providedIn: 'root',
})
export class LIBISOpeningHoursService {
  private openingHoursMap: OpeningHoursMap =
    opening_hours_map.opening_hours_map as OpeningHoursMap;
  private http: HttpClient;
  //opening_hours_default_lang = this.openingHoursMap.default_lang;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getOpeningHoursDefaultLang(){
    return this.openingHoursMap.default_lang;
  }

  getOpeningHours(inst_code: string, lib_code: string, week?: number) {
     const OH_URL = `${this.openingHoursMap.base_URL}/${inst_code}/${lib_code}?accept=application/json`;

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

    // Parse general data
    let opening_hours_data: OpeningHoursOverview = { ...EMPTY_OH_OVERVIEW };
    // Copy default language from the opening hours mapping
    opening_hours_data.default_lang = this.openingHoursMap.default_lang;
    opening_hours_data.contact_details.lib_name = {
      value: { [opening_hours_data.default_lang]: raw_OH.name },
      type: 'text',
    };

    // Loop over contact details section to collect relevant data
    for (const field_key of Object.keys(
      opening_hours_data.contact_details,
    ) as (keyof ContactDetails)[]) {
      // Check if a mapping is available for the field. If yes, run the datafield parsing method
      if (field_key in this.openingHoursMap.field_map) {
        opening_hours_data.contact_details[field_key] = this.parseDataField(
          this.openingHoursMap.field_map[field_key],
          raw_OH.data,
        );
      }
    }

    // Parse opening hours overview
    opening_hours_data['this_week'] = this.collectOpeningsOverview(raw_OH);

    // Calculate current status
    opening_hours_data['curr_status'] = this.calculateCurrentStatus(raw_OH);


    console.log('Parsed Opening hours data', JSON.stringify(opening_hours_data));
    return opening_hours_data;
  }

  translateContactDetails(OH_overview: OpeningHoursOverview, curr_lang: string, def_lang: string): ContactDetails {
    let contact = structuredClone(OH_overview.contact_details);
    console.log('Calculating language-specific contact details: ', contact);
    console.log('Incoming language settings: ', curr_lang, def_lang);

    for(const field_key in contact){

        switch(field_key){

            case 'lib_name':
            case 'lib_photo':
                if((contact[field_key] !== undefined) && (typeof contact[field_key] !== 'string')){
                    contact[field_key].value = this.translContactField(contact[field_key], curr_lang, def_lang);
                }
                break;
            case 'address':
                contact[field_key].forEach(f => {
                    f.value = this.translContactField(f, curr_lang, def_lang);
                });
                break;
            case 'social_media':
            case 'extra':
            case 'consultation':
                contact[field_key].forEach (f => {
                    f.field.value = this.translContactField(f.field, curr_lang, def_lang);
                    if(('label' in f) && (f.label.type === 'database')){
                        f.label.value = this.translContactField(f.label, curr_lang, def_lang);
                    }
                });
                break;       
            }
    

    }

    return contact;    
}

 private translContactField(contactField: any, curr_lang: string, def_lang: string): string {
  //console.log('Contact field: ', contactField);
  if(['text', 'textarea', 'url'].includes(contactField.type)){
    if(curr_lang in contactField.value){
        return contactField.value[curr_lang];
    }
    else if(def_lang in contactField.value){
        return contactField.value[def_lang];
    }
    else{
        return contactField.value[Object.keys(contactField.value)[0]];
    }
  }
  return contactField.value;
 }

  private collectOpeningsOverview(OH_data: OHData): OHDayField[] {
    let this_week = OH_data['current'];

    if (this.openingHoursMap.opening_hours_config['start_date'] == 1) {
      this_week = OH_data['current'];
    }

    this_week.forEach((day: { hours: HoursRange[] }) => {
      day.hours = day.hours.filter((h) => h.open !== '' && h.closed !== '');
    });

    return this_week;
  }

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

  private parseDataField(field_map: any, OH_data: any): any {
    //console.log('Incoming field data for parsing: ', field);

    // Simple string value representing database field name ==> return the databasefield
    if (typeof field_map === 'string') {
      //console.log('Detected string mapping');
      if (field_map in OH_data) {
        //console.log('String field found in database');
        return this.preprocessDbField(OH_data[field_map]);
      }
      return undefined;
    }

    // Array of fields ==> loop over the array and collect relevant fields
    else if (Array.isArray(field_map)) {
      //console.log('Detected array mapping');
      let field_set: any = [];

      // Loop over fields, recursively call this function
      field_map.forEach((subf) => {
        let field_value = this.parseDataField(subf, OH_data);
        if (field_value !== undefined) {
          //console.log('Received field value: ', field_value);
          field_set.push(field_value);
        }
      });

      return field_set;
    }

    // Object mapping ==> collect field and label values (if applicable)
    else if (typeof field_map === 'object') {
      //console.log('Detected object mapping');
      // Get the database field name from the 'field' property
      if (field_map.field in OH_data) {
        // Collect field value
        field_map.field = this.preprocessDbField(OH_data[field_map.field]);
        if (field_map.field === undefined) {
          return undefined;
        }

        //Check if label has to be collected (label type = database)
        if ('label' in field_map && field_map.label.type === 'database') {
          let db_label = this.preprocessDbField(OH_data[field_map.label.value]);
          if (db_label !== undefined) {
            field_map.label.value = db_label;
          } else {
            field_map.label.value = '';
          }
        }
        //console.log('Returning field: ', field_map);
        return field_map;
      }
      return undefined;
    }
  }

  private preprocessDbField(field: DatabaseField): DatabaseField | undefined {
    //console.log('incoming database field: ', field);

    // Check if the field is a translatable field. If yes, purge empty entries
    if (typeof field.value === 'object') {
      field.value = Object.fromEntries(
        Object.entries(field.value).filter(([key, val]) => val.trim() !== ''),
      );

      // If no entries remain, consider the field empty and return undefined
      if (Object.keys(field.value).length === 0) {
        return undefined;
      }
    } else {
      if (field.value.trim() === '') {
        return undefined;
      }
    }
    return field;
  }
}

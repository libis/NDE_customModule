import { Injectable } from "@angular/core";
import { SearchParams } from "src/app/Models/search.model";
import searchAlso_map from '../libis-search-also/searchAlso_sourceMap.json';
import { HttpClient } from "@angular/common/http";

export interface SearchAlsoConfig {
    general: {
        iconURL:string,
        tooltipPath:string
    },
    sources: {[key:string]: SearchAlsoSource}
}

export interface SearchAlsoSource {
    name: string,
    baseURL:string,
    icon: {
        type: 'file'|'URL',
        value: string
    },
    tooltip: string,
    showInView: string
}

export interface SearchAlsoLink {
    name: string,
    URL: string,
    icon: string,
    tooltip: string
}

@Injectable({
  providedIn: 'root',
})
export class LIBISSearchAlsoService {
    private searchAlsoMap: SearchAlsoConfig = searchAlso_map.searchAlso_map as SearchAlsoConfig;

    constructor(http: HttpClient) {
        //console.log('Initializing Search also Service with config: ', this.searchAlsoMap);
    }

    generateLinks(viewCode: string|undefined, searchParams: SearchParams|null, advancedSearch:boolean): SearchAlsoLink[]{

        let searchAlsoLinks: SearchAlsoLink[] = [];

        if (viewCode !== undefined && searchParams !== null && advancedSearch === false){

            for (const source of Object.keys(this.searchAlsoMap.sources)){
                const sourceSettings = this.searchAlsoMap.sources[source];

                // Check if source is activated for the current view. If yes, build the search URL and add it to the search links array
                if(new RegExp(sourceSettings['showInView']).test(viewCode)){

                    // Calculate icon path
                    let iconPath = '';
                    switch(sourceSettings['icon']['type']){
                        case 'URL':
                            iconPath = sourceSettings.icon.value;
                            break;
                        case "file":
                            iconPath = `${this.searchAlsoMap.general.iconURL}/${sourceSettings.icon.value}`;
                            break;
                    }

                   searchAlsoLinks.push(
                    {
                      "name": sourceSettings["name"],
                      "icon": iconPath,
                      "tooltip": `${this.searchAlsoMap.general.tooltipPath}.${sourceSettings.tooltip}`,
                      "URL": encodeURI(this.buildQueryURL(searchParams, sourceSettings))
                    }
                   )
                }
            }
        }
        
        return searchAlsoLinks
    }
    
    buildQueryURL(searchParams:SearchParams, sourceSettings: SearchAlsoSource){
        let searchURL = ''
        const query = searchParams.q
        return `${sourceSettings.baseURL}${query}`
    }
}
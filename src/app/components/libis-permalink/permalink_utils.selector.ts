import { createFeatureSelector, createSelector } from "@ngrx/store";
//import { DeliveryState } from "src/app/LIBIS_models/delivery.model";
//import { FullDisplayState } from "src/app/LIBIS_models/display_states.model";
//import { SearchState } from "src/app/Models/search.model";
//import { ViewConfigData, ViewConfigState } from "src/app/Models/view-config.model";
import { LoadingStatus, SearchParams, SearchMetaData, Doc, Facet, PrimoView, Tiles, SystemConfiguration, MappingTables, Authentication, Customization, UIComponents, TabToTiles, AdvancedSearchConfiguration, QueryTerms, NdeAddonData, Facetview } from '@libis/primo-shared-state'

export interface langState {
    lang: string;
}

export interface SearchState{
  ids: string[];
  entities: { [key: string]: Doc };
  status: LoadingStatus,
  searchParams: SearchParams | null,
  searchResultsMetaData: SearchMetaData | null,
  selectedPageSize: number | null,
  filter: {status: LoadingStatus , filters: Facet[] | null},
  searchNotificationMsg:string,
  presentNotification:boolean,
  isSearchAndAppendMode?: boolean,
  numOfItemsToAppend?: number,
  pcAvailabilityToggleValue:boolean,
  searchInFullTextToggleValue: boolean,
  fullDisplayRecordYouCameFrom: string,
  lastSearchTerms?: string[],
  currentSearchTerm?: string,
  selectedSortBy?:string | null,
  isSnackBarOpen: boolean,
  isReportAProblemOpen: boolean,
  displaySummary: boolean
}

export interface FullDisplayState {
  selectedRecordId: string | undefined,
  //physicalServiceResponse: IPhysicalServices | undefined,
  //doneCalculateIlsServices: LoadingStatus,
  //serviceInfo: ServiceInfo[] | undefined,
  //getItLocations: GetItLocations | undefined,
  //getItOtherLocations: GetItFromOtherLocation[],
  //viewItOtherInstitutions: ViewItFromOtherInstitution[],
  //locationItemsMap: LocationItemsMap,
  //bxRecommendations: RecDoc[],
  //linkedDataRecommendations: EntityMultiLangData[],
  isServicePage: boolean,
  //currentItemRequest: ServiceInfo | undefined
}

export interface SearchState {
  entities: { [key: string]: Doc };
}

export interface ViewConfigState {
  status: LoadingStatus,
  config: ViewConfigData | undefined
  error?: unknown;
}

export interface ViewConfigData {
    beaconO22:                         string;
    vid:                               string
    "primo-view":                      PrimoView;
    tiles:                             Tiles;
    "system-configuration":            SystemConfiguration;
    "mapping-tables":                  MappingTables;
    authentication:                    Authentication[];
    backend_system:                    string;
    customization:                     Customization;
    fieldsWithUseTranslation:          string[];
    IsViewNdeEnabled:                  boolean;
    enable_mixpanel:                   boolean;
    enableExtendSession:               boolean;
    enableExtendSessionToMax:          boolean;
    enableUserSettingForExtendSession: boolean;
    UIComponents:                      UIComponents;
    "tab-to-tiles":                        TabToTiles;
    queryTerms:                        QueryTerms;
    advancedSearchConfiguration:      AdvancedSearchConfiguration;
    "country-codes":                   string[];
    "bx-enable":                      boolean;
    "syndeticunbound-enable":          boolean;
    "syndeticunbound-id":              string;
    "ndeAddons":                      Record<string,NdeAddonData>;
    collectionDiscoveryFacets:         Facetview[];
    enableLocalFullTextSearch:      boolean;
    localFullTextSearchDefaultValue:  boolean;
}

//export const selectDeliveryEntities = (state: DeliveryState) => state.entities;

//export const selectDeliveryIds = (state: DeliveryState) => state.ids;

// export const selectDeliveryById = (recordId: string) => createSelector(
//     selectDeliveryEntities,
//     deliveryEntities => deliveryEntities[recordId]
// )

// export const selectDisplayedAvailability = (recordId: string) => createSelector(
//     selectDeliveryById(recordId),   
//     record => record ? record.delivery?.displayedAvailability : undefined
// )

// export const selectDeliveryLinks = (recordId: string) => createSelector(
//     selectDeliveryById(recordId),   
//     record => record ? record.delivery?.link : undefined
// )

// Full display selectors
export const selectFullDisplay = createFeatureSelector<FullDisplayState>('full-display');

export const selectFullDisplayRecordId = createSelector(
    selectFullDisplay,
    (fullDisplay: FullDisplayState) => fullDisplay?.selectedRecordId ?? undefined
);

// View config selectors
export const selectViewConfig = createFeatureSelector<ViewConfigState>('viewConfig');

// = shared state configSignal()
export const selectViewConfigData = createSelector(
    selectViewConfig,
    (state: ViewConfigState) => state.config
);

// = shared state observable selectPrimoView$()
export const selectPrimoView = createSelector(
    selectViewConfigData,
    (config: ViewConfigData | undefined) => config ? config["primo-view"] : undefined
)

// = shared state vidSignal()
export const selectViewCode =createSelector(
    selectViewConfigData,
    (config: ViewConfigData | undefined) => config ? config.vid : undefined
)


// Language
export const selectLanguage = createFeatureSelector<langState>('language');
export const selectCurrentLanguage = createSelector(
    selectLanguage,
    (state: langState) => state.lang
)

// Search parameters
export const selectSearchState = createFeatureSelector<SearchState>('Search');

export const selectSearchParams = createSelector(
    selectSearchState,
    (searchState: SearchState) => searchState.searchParams? searchState.searchParams : undefined
);

export const selectSearchScope = createSelector(
    selectSearchParams,
    (searchParams) => searchParams ? searchParams.scope : undefined
)

export const selectSearchResults = createSelector(
    selectSearchState,
    (searchState: SearchState) => searchState.entities
)

export const selectRecordById = (recordId: string) => createSelector(
    selectSearchResults,
    searchResults => searchResults ? searchResults[recordId] : undefined
)
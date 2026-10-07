import { createFeatureSelector, createSelector } from "@ngrx/store";
//import { DeliveryState } from "src/app/LIBIS_models/delivery.model";
//import { FullDisplayState } from "src/app/LIBIS_models/display_states.model";
//import { SearchState } from "src/app/Models/search.model";
//import { ViewConfigData, ViewConfigState } from "src/app/Models/view-config.model";
import { LoadingStatus, SearchParams, SearchMetaData, Doc, Facet, PrimoView, Tiles, SystemConfiguration, MappingTables, Authentication, Customization, UIComponents, TabToTiles, AdvancedSearchConfiguration, QueryTerms, NdeAddonData, Facetview, FullDisplayState, ViewConfigState, ViewConfigData, SearchState, UserState } from '@libis/primo-shared-state'

export interface langState {
    lang: string;
}

// Search
export const selectSearchState = createFeatureSelector<SearchState>('Search');

export const selectSearchParams = createSelector(
    selectSearchState,
    (searchState: SearchState) => searchState.searchParams? searchState.searchParams : null
);

export const selectSearchMode = createSelector(
  selectSearchParams,
  searchParams => searchParams?.mode
)

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

// View config
export const selectViewConfig =
  createFeatureSelector<ViewConfigState>('viewConfig');

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

export const selectViewDefaultLang = createSelector(
  selectViewConfig,
  (state: ViewConfigState) =>
    state.config?.['primo-view']['attributes-map'].interfaceLanguage,
);


// User
export const selectUser = createFeatureSelector<UserState>('User');

export const selectLoggedIn = createSelector(
  selectUser,
  (state) => state.isLoggedIn
);

export const selectJWT = createSelector(
  selectUser,
  (state) => state.jwt
);

// Language
export const selectLanguage = createFeatureSelector<langState>('language');
export const selectCurrentLanguage = createSelector(
    selectLanguage,
    (state: langState) => state.lang
)

// Search parameters

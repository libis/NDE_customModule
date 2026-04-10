import { createFeatureSelector, createSelector } from "@ngrx/store";
import { DeliveryState } from "src/app/LIBIS_models/delivery.model";
import { FullDisplayState } from "src/app/LIBIS_models/display_states.model";
import { SearchState } from "src/app/Models/search.model";
import { ViewConfigData, ViewConfigState } from "src/app/Models/view-config.model";

export interface langState {
    lang: string;
}

export const selectDeliveryEntities = (state: DeliveryState) => state.entities;

export const selectDeliveryIds = (state: DeliveryState) => state.ids;

export const selectDeliveryById = (recordId: string) => createSelector(
    selectDeliveryEntities,
    deliveryEntities => deliveryEntities[recordId]
)

export const selectDisplayedAvailability = (recordId: string) => createSelector(
    selectDeliveryById(recordId),   
    record => record ? record.delivery?.displayedAvailability : undefined
)

export const selectDeliveryLinks = (recordId: string) => createSelector(
    selectDeliveryById(recordId),   
    record => record ? record.delivery?.link : undefined
)

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
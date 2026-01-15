// Define the map
// import { RecommendationsComponentComponent } from "../libis/recommendations-component/recommendations-component.component";
// import { PermalinkDialogComponent } from "../libis/permalink-dialog/permalink-dialog.component";
import { DotComponent } from "../libis/dot/dot.component";

interface ComponentMapping {
    element: string;
    component: any;
}

export const    selectorComponentMap = new Map<RegExp, ComponentMapping>([
    [/.*KULeuven_.*/, { element: 'nde-footer-after', component: DotComponent }]
]);
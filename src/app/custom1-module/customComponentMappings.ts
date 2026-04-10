import { LibisPasswordNoteComponent } from "./libis-password-note/libis-password-note.component";
import { LibisPermalinkComponent } from "./libis-permalink/libis-permalink.component";

// Define the map
export const selectorComponentMap = new Map<string, any>([

['nde-permalink-dialog-after', LibisPermalinkComponent],
['nde-view-it-card-bottom', LibisPasswordNoteComponent]
]);

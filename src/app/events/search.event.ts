import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { NDEEvent, NDEEventBase, GlobalHttpEvent } from '../decorators/nde-event.decorator';
import { SearchStateService, Doc } from '@libis/primo-shared-state';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import { ConfigService } from 'src/app/services/config.service'

@Injectable()
@NDEEvent({
  stream: 'response',
  match: /delivery|pnxs/,
  order: 30,
  description: 'Modify the doc.pnx.display fields returned in search responses.'
})
export class SearchEvent extends NDEEventBase {

  // private storeSub: Subscription;

  constructor(
    globalHttp: GlobalHttpEventService,
    private configService: ConfigService,
    private searchState: SearchStateService
  ) {
    super(globalHttp);

    // Subscribe to the ngrx store — the single source of truth.
    // When docs arrive, mutate titles in-place on the entity objects.
    // this.storeSub = this.searchState.selectAllDocs$()
    //   .subscribe(docs => this.transformDocsInStore(docs));
  }

  /**
   * Layer 1 response handler — mutates the XHR body BEFORE the host reads it.
   * This ensures the data enters the ngrx store already transformed.
   */
  override onResponse(method: string, url: string, status: number, body: unknown): unknown {
    const data = body as any;

    // /pnxs returns { docs: [...] }, /delivery returns Doc[] directly
    const docs = Array.isArray(data) ? data : data?.docs;

    const cfg = this.configService.getConfig();
    const currentVid = cfg["vid"] || ""

    if (Array.isArray(docs)) {
      for (const doc of docs) {
        console.log('[SearchEvent] Layer 1: Check vid :', currentVid);
        
        // this.reverseTitle(doc);

        if ( currentVid.match(/32KUL_KUL:Lirias_NDE/) ) {
          console.log('[SearchEvent] Layer 1: addHrefToIdentifiers for doc');
          this.addHrefToIdentifiers(doc);
        }

        if ( currentVid.match(/32KUL_KUL:Lirias_NDE/) ) {
          console.log('[SearchEvent] Layer 1: Handle ids from creators for doc');
          this.handleIdsFromCreators(doc);
        }

      }
      console.log('[SearchEvent] Layer 1: reversed titles for', docs.length, 'doc(s) from', url);
    }

    return data;
  }

  /**
   * Store subscription handler — safety net.
   * If the host overwrites our Layer 1 changes (e.g. re-processing, second API call),
   * this re-applies the transformation directly on the store entity references.
   */
  private transformDocsInStore(docs: Doc[]): void {
    if (!docs?.length) return;

    let changed = 0;
    for (const doc of docs) {
      if (this.reverseTitle(doc)) changed++;
    }

    if (changed > 0) {
      console.log('[SearchEvent] Store: reversed titles for', changed, 'doc(s)');
    }
  }

  /**
   * Reverse title strings on a doc. Returns true if anything changed.
   * Marks processed docs to avoid double-reversing (which would restore the original).
   */
  private reverseTitle(doc: any): boolean {
    if (!doc?.pnx?.display?.title) return false;
    // Skip if we already processed this doc
    if (doc.__nde_title_reversed) return false;

    const title = doc.pnx.display.title;
    if (!Array.isArray(title)) return false;

    doc.pnx.display.title = title.map((t: string) =>
      typeof t === 'string' ? t.split('').reverse().join('') : t
    );
    doc.__nde_title_reversed = true;
    return true;
  }


  /**
   * add a html-link with target blank to the indetifiers with $$CDOI$$V and $$CSCOPUSID$$V
   * 
   */
  private addHrefToIdentifiers(doc: any): boolean {
    if (!doc?.pnx?.display?.identifier) return false;
    // Skip if we already processed this doc
    if (doc.__nde_add_href_to_identifiers) return false;

    const identifiers = ([] as string[]).concat(doc.pnx.display.identifier); // Make it an Array

    doc.pnx.display.identifier = identifiers.map((identifier: string) => {


      // Match $$C<Key>:$$V<Value>
      const match = identifier.match(/^\$\$C([^:]+):\$\$V(.*)$/);
      if (!match) return identifier; // Not in expected format; leave as-is

      const [, key, rawValue] = match;
      const value = rawValue.trim();
      let url = undefined;
      let link = undefined;

      if (key === "DOI") {
        url = `https://doi.org/${value}`
      }

      if (key === "PMID") {
        url = `https://www.scopus.com/record/display.uri?eid=${value}&origin=resultslist}`
      }      

      if (key === "SCOPUSID") {
        url = `https://www.scopus.com/record/display.uri?eid=${value}&origin=resultslist}`
        link = `<a href='https://www.scopus.com/record/display.uri?eid=${value}&origin=resultslist}' target='_blank' class='ext-link-on-identifier'>${value} (todo ProxyUrl)<i class=\"material-icons prm-text\" style>launch</i></a>`;
        return `$$C${key}:$$V${link}`;
      }

      if (url !== undefined){
        link = `<a href='${url}' target='_blank' class='ext-link-on-identifier'>${value} <i class='material-icons prm-text' style>launch</i></a>`;
        console.log ("[SearchEvent] link ", link);
        return `$$C${key}:$$V${link}$$U${url}$$Q${url}`;
      }

      // For all other keys, keep the line as-is
      return identifier;

    });
    doc.__nde_add_href_to_identifiers = true;
    return true;
  }

  /**
   * Normalizes custom identifier suffixes embedded in creator strings.
   *
   * This method scans all creator entries inside `doc.pnx.display.creator`
   * and rewrites any embedded identifier markers (e.g. "orcid:", "staff_nr:",
   * "researcherid:") into a consistent internal format.
   */
  private handleIdsFromCreators(doc: any): boolean {
    if (!doc?.pnx?.display?.creator) return false;
    // Skip if we already processed this doc
    if (doc.__handle_ids_from_creators) return false;
    const creators = ([] as string[]).concat(doc.pnx.display.creator); // Make it an Array
    doc.pnx.display.creator = creators.map((creator: string) => {
      try {
        let creatorFields = creator.split('$$');

        // 1. Identify U-fields and Q-field
        let uFields = creatorFields.filter(f => f.startsWith('U'));
        let qIndex = creatorFields.findIndex(f => f.startsWith('Q'));

        // 2. Replace "; " with "$$U" inside U-fields
        uFields = uFields.map(f => f.replace(/;\s*/g, '$$$$U'));

        // 3. Remove U-fields from original list
        creatorFields = creatorFields.filter(f => !f.startsWith('U'));

        // 4. Append modified U-fields to the Q-field
        if (qIndex !== -1 && uFields.length > 0) {
            creatorFields[qIndex] = creatorFields[qIndex] + '$$' + uFields.join('$$');
        }

        // 5. Join back together
        creator = creatorFields.join('$$');
        
      } catch (error) {
        console.warn(`[SearchEvent::handleIdsFromCreators]  Failed to handle creator custom element: ${creator}`, error);
      }
      return creator
    });
    
    console.log ( doc.pnx.display.creator)

    doc.__handle_ids_from_creators = true;
    return true;
  }








  override ngOnDestroy(): void {
    super.ngOnDestroy();
    // this.storeSub?.unsubscribe();
  }
}

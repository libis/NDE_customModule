import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { NDEEvent, NDEEventBase, GlobalHttpEvent } from '../decorators/nde-event.decorator';
import { SearchStateService, Doc } from '@libis/primo-shared-state';
import { GlobalHttpEventService } from '../services/global-http-event.service';

@NDEEvent({
  stream: 'response',
  match: /delivery|pnxs/,
  order: 30,
  description: 'Reverses doc.pnx.display.title in search responses'
})
@Injectable()
export class TestEvent extends NDEEventBase {

  // private storeSub: Subscription;

  constructor(
    globalHttp: GlobalHttpEventService,
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

    if (Array.isArray(docs)) {
      for (const doc of docs) {
        this.reverseTitle(doc);
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

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    // this.storeSub?.unsubscribe();
  }
}

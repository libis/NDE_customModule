import { Injectable } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';

@NDEEvent({
  stream: 'response',
  match: /pnxs|directLink/,
  order: 30,
  description: 'Reverses doc.pnx.display.title in search responses'
})
@Injectable()
export class SearchEvent extends NDEEventBase {

  /**
   * Layer 1 response handler — runs BEFORE the host reads the XHR response.
   * Return the mutated body to replace it.
   */
  override onResponse(method: string, url: string, status: number, body: unknown): unknown {
    const data = body as any;
    const docs = data?.docs;

    if (Array.isArray(docs)) {
      for (const doc of docs) {
        const title = doc?.pnx?.display?.title;
        if (Array.isArray(title)) {
          doc.pnx.display.title = title.map((t: string) =>
            typeof t === 'string' ? t.split('').reverse().join('') : t
          );
        }
      }
      console.log('[SearchEvent] Reversed pnx.display.title for', docs.length, 'doc(s)');
    }

    return data;
  }
}

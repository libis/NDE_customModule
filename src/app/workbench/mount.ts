import { NdeWorkbenchElement } from './workbench.element';

const ELEMENT_TAG = 'nde-workbench';
const HOST_ID = 'nde-workbench-host';

/**
 * Define and mount the `<nde-workbench>` overlay into the page. Idempotent:
 * calling it more than once is a no-op. Intended to be invoked from
 * `bootstrap.ts` only when `isWorkbenchEnabled()` is true.
 */
export function mountWorkbench(): void {
  if (document.getElementById(HOST_ID)) return;

  if (!customElements.get(ELEMENT_TAG)) {
    customElements.define(ELEMENT_TAG, NdeWorkbenchElement);
  }

  const el = document.createElement(ELEMENT_TAG);
  el.id = HOST_ID;
  document.body.appendChild(el);

  console.log('[NDEWorkbench] mounted');
}

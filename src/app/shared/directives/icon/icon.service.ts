import { Injectable } from '@angular/core';
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {catchError, map, of, switchMap} from "rxjs";
import {customizationEnabled} from "../../../infra/customization-util";

export const VID_ICON_NAMESPACE_COLON_REPLACEMENT = '-';
@Injectable({
  providedIn: 'root'
})
export class IconService {

  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.matIconRegistry.addSvgIconSet(this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/icons.svg'));
    if (customizationEnabled) {
      this.registerCustomIconsBasedOnVidQueryParam();
    }
  }

  private registerCustomIconsBasedOnVidQueryParam() {
    this.getCustomNameSpaceFromVidQueryParam()
        .subscribe(customNamespace =>
            //TODO: custom icons url should vary based on vid
            this.matIconRegistry.addSvgIconSetInNamespace(customNamespace, this.domSanitizer.bypassSecurityTrustResourceUrl(`./custom/${customNamespace}/assets/icons/custom_icons.svg`))
        );
  }

  getCustomSVG(name: string) {
    return this.getCustomNameSpaceFromVidQueryParam().pipe(
        switchMap(customNamespace => this.matIconRegistry.getNamedSvgIcon(name, customNamespace).pipe(
            map(() => `${customNamespace}:${name}`),
            catchError(() => of(undefined)))),
        catchError(() => of(undefined))
    )
  }

  getCustomNameSpaceFromVidQueryParam() {
    const bootstrapCfg = (window as any).__BOOTSTRAP_CFG__ ?? {};
    let currentVid = bootstrapCfg.vid;
    // Make it an Observable
    if (!currentVid) {
        return of(undefined);
    }

    return of(
        currentVid.replace(':', VID_ICON_NAMESPACE_COLON_REPLACEMENT)
    );

    /*
    return this.activatedRoute.queryParams.pipe(map((queryParams) => queryParams['vid'] as string),
        filter(vid => !!vid), //filter out null values
        distinctUntilChanged(),
        map(vid => {
          //we need to replace the ':' char because angular material uses ':' to separate between name space and id
          return vid.replace(':', VID_ICON_NAMESPACE_COLON_REPLACEMENT);
        }))
    */
  }
}

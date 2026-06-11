import {Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {IconService} from "./icon.service";
import {Subscription} from "rxjs";

@Directive({
    selector: '[ndeIcon]',
    standalone: true
})
export class IconDirective implements OnInit, OnDestroy{

  @Input('ndeIcon') svgIconName!: string
  private subscription: Subscription | undefined;
  constructor(private iconService: IconService,
              private templateRef: TemplateRef<never>, private viewContainer: ViewContainerRef) {
  }

  ngOnInit() {
    const embeddedViewRef = this.viewContainer.createEmbeddedView(this.templateRef, {
      svgName: this.svgIconName
    });
    this.subscription = this.iconService.getCustomSVG(this.svgIconName).subscribe(
        (customSvgIconName) => {
          if (customSvgIconName) {
            embeddedViewRef.destroy();
            this.viewContainer.createEmbeddedView(this.templateRef, {
              svgName: customSvgIconName
            })
          }
        }
    )
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}

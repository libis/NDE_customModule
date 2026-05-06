//import { BaseCustomDirective } from '../../base-custom/base-custom.directive';
import {ChangeDetectionStrategy, Component, NgZone} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {AnimationOptions, LottieComponent} from "ngx-lottie";
import {AnimationItem} from "lottie-web";
//import { LottieModule } from 'ngx-lottie'

@Component({
    selector: 'libis-progress-spinner',
    templateUrl: './libis-progress-spinner.component.html',
    styleUrls: ['./libis-progress-spinner.component.scss'],
    standalone: true,
    imports: [MatIconModule, LottieComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    //hostDirectives: [BaseCustomDirective],
})
export class LIBISProgressSpinnerComponent {
  options: AnimationOptions = {
    path: 'assets/images/loadingAnimations/LoadingAnimationJson.json',

  };

  styles: Partial<CSSStyleDeclaration> = {
    transform: 'scale(0.5)'
  };

  animationItem!: AnimationItem;
  constructor(private ngZone: NgZone) {}


  animationCreated(animationItem: AnimationItem): void {
    this.ngZone.runOutsideAngular(() => {
      this.animationItem = animationItem;
    });
  }
}

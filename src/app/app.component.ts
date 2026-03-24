import { Component } from '@angular/core';
// import { injectStylesEarly } from '../app/config/inject-styles';
// injectStylesEarly();
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'custom-module';
  public getTitle() {
    return this.title;
  }
}

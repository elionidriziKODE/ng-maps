import { Component } from '@angular/core';

import { MapsAPILoader } from '@ng-maps/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  public title = 'sample';
  constructor(private mapsLoader: MapsAPILoader) {
    this.mapsLoader.configure({
      apiKey: 'AIzaSyAtee0zgzh-_8JgWoRXFf2Lac61vkk0GZc',
    });
  }
}

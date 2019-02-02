import {Component} from '@angular/core';
import {LOGS} from './logs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
    logs = LOGS;
    constructor() {
        console.log(this.logs);
    }
}

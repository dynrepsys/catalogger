import {Component} from 'angular2/core';
import {ChangeDetectorRef} from 'angular2/core';
import { Injectable } from 'angular2/core';

@Component({
    selector: 'logs',
    templateUrl: 'app/html/logsview.component.html',
    styles: [':host { padding: 0; margin: 0; margin-top: 4px; }'],
    inputs: ['mylogs'],
    directives: []
})

@Injectable()
export class LogsView {
    id: any;
    mylogs: any;
    logs: any[];
    logname: "";

    constructor(private cd: ChangeDetectorRef) {
        this.id = 0;
        this.logs = undefined;
    }

    ngOnInit() {
        this.logs = this.mylogs.logs;
    }

    openLog(e) {
        let logname = 'assets/log/' + e.target.attributes.title.nodeValue;
        console.log('clicked', logname);
    }
}

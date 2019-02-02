import {Component} from 'angular2/core';
import {DirView} from './dirview.component';
import {LogsView} from './logsview.component';
import {LOG} from './current.log';
import {LOGS} from './logs';

@Component({
    selector: 'my-app',
    template: '<logs [mylogs]="logs" >beforex</logs><dir [mydir]="log"></dir><div>afterx</div>',
    directives: [DirView, LogsView]
})

export class AppComponent {
    log: any;
    logs: any;
    vol: DirView;

    constructor() {
        this.log = LOG;
        this.logs = LOGS;
    }
}

import {Component} from '@angular/core';

@Component({
    selector: 'logview',
    templateUrl: './logview.component.html',
})

export class LogView {
    dirs: any;
    foo: string;

    constructor() {
        this.foo = "bar";    
    }
}


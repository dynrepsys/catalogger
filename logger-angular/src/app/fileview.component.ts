import {Component} from '@angular/core';

@Component({
    selector: 'fil',
    templateUrl: './fileview.component.html',
    styleUrls: ['./fileview.component.css'],
    inputs: ['myfile']
})

export class FileView {
    myfile: any;
    id: number;
    name: string;
    dbop: string;
    fsop: string;
    md5: string;
    parentid: number;
    warnings: string[];
    errors: string[];

    constructor() {
        this.name = 'none';
        this.dbop = undefined;
        this.fsop = undefined;
        this.warnings = [];
        this.errors = [];
    }

    ngOnInit() {
        this.name = this.myfile.name;
        this.id = this.myfile.id;
        this.dbop = this.myfile.db;
        this.fsop = this.myfile.fsop;
        this.md5 = this.myfile.md5;
        this.parentid = this.myfile.parentid;
        this.warnings = this.myfile.warnings;
        this.errors = this.myfile.errors;
    }
    
    opColor() {
       switch(this.dbop) {
            case "INSERT":
                return "green";
            case "UPDATE":
                return "blue";
            default:
                return "#808080";
        }
    }

    errColor() {
        if(this.errors.length > 0)
            return 'red';
        if(this.warnings.length > 0)
            return 'gold';
        return 'transparent';
    }
}

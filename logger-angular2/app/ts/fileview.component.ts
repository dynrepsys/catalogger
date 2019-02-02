import {Component} from 'angular2/core';

@Component({
    selector: 'fil',
    templateUrl: 'app/html/fileview.component.html',
    styles: [':host { padding: 0; margin: 0; margin-top: 4px; padding-left: 0px; }'],
    inputs: ['myfile'],
    directives: [FileView]
})

export class FileView {
    myfile: any;
    id: number;
    name: string;
    dbop: string;
    md5: string;
    parentid: number;
    warnings: string[];
    errors: string[];

    constructor() {
        this.id = 1;
        this.name = 'none';
        this.dbop = undefined;
        this.warnings = [];
        this.errors = [];
    }

    ngOnInit() {
        this.name = this.myfile.name;
        this.id = this.myfile.id;
        this.dbop = this.myfile.db;
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

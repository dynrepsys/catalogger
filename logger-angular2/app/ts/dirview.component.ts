import {Component} from 'angular2/core';
import {ChangeDetectorRef} from 'angular2/core';
import {FileView} from './fileview.component';

@Component({
    selector: 'dir',
    templateUrl: 'app/html/dirview.component.html',
    styles: [':host { padding: 0; margin: 0; margin-top: 4px; }'],
    inputs: ['mydir'],
    directives: [DirView,FileView]
})

export class DirView {
    mydir: any;
    id: number;
    name: string;
    dirs: any[];
    files: any[];
    frames: any[];
    warnings: string[];
    errors: string[];
    dbop: string;
    parentid: number;
    md5: string;
    numInserts: number;
    numUpdates: number;
    numCopies: number;
    numErrors: number;
    numWarnings: number;
    sign: string;

    constructor(private cd: ChangeDetectorRef) {
        this.id = 1;
        this.name = 'none';
        this.dbop = undefined;
        this.dirs = [];
        this.files = [];
        this.warnings = [];
        this.errors = [];
        this.parentid = 0;
        this.numInserts = 0;
        this.numUpdates = 0;
        this.numCopies = 0;
        this.numWarnings = 0;
        this.numErrors = 0;
        this.sign = "minus";
    }

    ngOnInit() {
        this.name = this.mydir.name;
        this.id = this.mydir.id;
        this.dbop = this.mydir.db;
        this.parentid = this.mydir.parentid;
        this.md5 = this.mydir.md5;

        var sorter = function(a, b) {
            return a.name.localeCompare(b.name, 'en', { sensitivity: 'base', ignorePunctuation: true, numeric: true });
        }

        this.mydir.dirs.sort(sorter);
        for(var i = 0; i < this.mydir.dirs.length; i++) {
            this.mydir.dirs[i].countErrors = this.countErrors;
            this.mydir.dirs[i].countWarnings = this.countWarnings;
            this.mydir.dirs[i].countInserts = this.countInserts;
            this.mydir.dirs[i].countUpdates = this.countUpdates;
            this.mydir.dirs[i].countCopies = this.countCopies;
            this.dirs.push(this.mydir.dirs[i]);
        }
        this.mydir.files.sort(sorter);
        for(var i = 0; i < this.mydir.files.length; i++) {
            this.files.push(this.mydir.files[i]);
        }
        if(this.mydir.frames) {
            this.frames = [];
            this.mydir.frames.sort(sorter);
            for(var i = 0; i < this.mydir.frames.length; i++) {
                this.mydir.frames[i].name = this.mydir.frames[i].name.split('.')[0];
                this.frames.push(this.mydir.frames[i]);
            }
        }    
        this.warnings = this.mydir.warnings;
        this.errors = this.mydir.errors;
        this.mydir.countErrors = this.countErrors;
        this.mydir.countWarnings = this.countWarnings;
        this.mydir.countInserts = this.countInserts;
        this.mydir.countUpdates = this.countUpdates;
        this.mydir.countCopies = this.countCopies;
    }
    
    ngAfterViewInit() {
        this.numErrors = this.mydir.countErrors();
        this.numWarnings = this.mydir.countWarnings();
        this.numInserts = this.mydir.countInserts();
        this.numUpdates = this.mydir.countUpdates();
        this.numCopies = this.mydir.countCopies();
        this.cd.detectChanges(); //prevents ExpressionChangedAfterItHasBeenCheckedError

        // this error (dev mode only) is thrown to indicate tree is not stable; i.e. angular tries to stabilize
        // parent components then add child components, whose properties may be bound to those of parent, then
        // stabilize children. if children cause parents to update, and depend on properties updated, an infinite
        // loop could result.
    }

    opColor() {
        if(this.mydir.mask)
            return "purple";

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

    countErrors() {
        var result = this.errors.length;

        for(let d of this.dirs) {
            result += d.countErrors();
        }

        for(let f of this.files) {
            result += f.errors.length;
        }

        return result;
    }

    countWarnings() {
        var result = this.warnings.length;

        for(let d of this.dirs) {
            result += d.countWarnings();
        }

        for(let f of this.files) {
            result += f.warnings.length;
        }

        return result;
    }

    countInserts() {
        var result = 0;

        for(let d of this.dirs) {
            if(d.db == "INSERT") {
                result++;
            }
            result += d.countInserts();
        }

        for(let f of this.files) {
            if(f.db == "INSERT") {
                result++;
            }
        }

        return result;
    }

    countUpdates() {
        var result = 0;

        for(let d of this.dirs) {
            if(d.db == "UPDATE") {
                result++;
            }
            result += d.countUpdates();
        }

        for(let f of this.files) {
            if(f.db == "UPDATE") {
                result++;
            }
        }

        return result;
    }

    countCopies() {
        var result = 0;

        for(let d of this.dirs) {
            result += d.countCopies();
        }

        if(this.frames){
            for(let f of this.frames) {
                if(f.fsop == "COPY") {
                    result++;
                }
            }
        }

        return result;
    }

    toggleSign() {
        if(this.sign == 'plus') {
            this.sign = 'minus';
        } else {
            this.sign = 'plus';
        } 
    }
}

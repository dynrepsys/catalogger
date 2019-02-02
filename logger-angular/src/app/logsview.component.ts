import {Component} from '@angular/core';
import {ChangeDetectorRef} from '@angular/core';
import {Input} from '@angular/core';
import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'logsview',
    templateUrl: './logsview.component.html',
})

@Injectable()
export class LogsView {
    @Input() mylogs: any;
    logs: any[];

    constructor(private cd: ChangeDetectorRef, private http: HttpClient) {
    }

    ngOnInit() {
        this.logs = this.mylogs.logs; //??? import here directly?
    }

    errColor(l) {
        //console.log('errorColor', l)
        if(l.errors && l.errors.length > 0)
            return 'red';
        if(l.warnings && l.warnings.length > 0)
            return 'gold';
        return 'black';
    }

    openLog(e) {
        if(!e.target.attributes.title)
            return;
        let logname = e.target.attributes.title.nodeValue;
        let lognum = -1;        
        console.log('looking for log', logname, this.logs);
        for(var l = 0; l < this.logs.length; l++) {
            //console.log(this.logs[l].name);
            if(this.logs[l].name == logname) {
                lognum = l;
                console.log('found it. lognum', l);
                break;            
            }
        }
        console.log('clicked', logname);
        this.http.get('assets/log/' + logname).subscribe(data => {
            console.log('data', data);
            if(lognum > -1) {
                //if(data.hasOwnProperty('dirs')) {
                    this.logs[lognum].dirs = data['dirs'];
                //}
                //this.logs[lognum].op = data.op;
                if(data.hasOwnProperty('total')) {
                //    this.logs[lognum].total = data.total;
                }
/*
                this.logs[lognum].errors = data.errors;
                this.logs[lognum].warnings = data.warnings;
                this.logs[lognum].dirs = data.dirs;
                this.logs[lognum].startdir = data.startdir;
                this.logs[lognum].start = data.start;
                this.logs[lognum].end = data.end;
                this.logs[lognum].duration = data.duration;
                console.log('loaded', this.logs[lognum]);
*/
            }      
        });
        console.log('after http get');
/*
        let log0 = this.http.get(logname)//, options) 
            .map((response: Response) => {
                console.log("mock data" + response.json());
                //return response.json();
                }
            )
            .catch(this.handleError);
*/
    }

    durStr(logobj) {
        if(!logobj || !logobj.duration)
            return;

        let hms = logobj.duration.split('.')[0].split(':');
        let h = new Number(hms[0]);
        let m = new Number(hms[1]);
        let s = new Number(hms[2]);

        if(h > 0)
            return h + ' hours,';
        if(m > 0)
            return m + ' minutes,';
        if(s > 0)
            return s + ' seconds,';

        return '';
    }

    agoStr(logobj) {
        if(!logobj || !logobj.end)
            return;
        let end = +new Date(logobj.end);
        let now = +new Date();
        let ago = +new Number(now - end);
        //console.log('date?', now, end, ago);
        const ONE_HOUR = 60*60*1000;
        const ONE_DAY = 24*ONE_HOUR;
        if(ago > ONE_DAY) {
            let days_ago = Math.floor(ago / ONE_DAY);
            return days_ago + ' day' + (days_ago == 1 ? '' : 's') + ' ago';
        }
        else {
            let hours_ago = Math.floor(ago / ONE_HOUR);
            return hours_ago + ' hour' + (hours_ago == 1 ? '' : 's') + ' ago';
        }
        //return "2 days ago";
    }
}

#!/usr/bin/env python3

import os
import sys
import json
import string
from datetime import datetime, time 

log = { 'logs': [] } 

basedir = '../log'

for filename in os.listdir(basedir):
    if(not os.path.isdir(filename)):
        print(filename)
        logfile = open(basedir + os.sep + filename, 'r')
        obj = json.load(logfile)
        logfile.close()
        del obj['dirs']
        print('obj', obj)

        logobj = { 'name': filename, 
                'startdir': obj['startdir'],
                'start': obj['start'],
                'end': obj['end'],
                'duration': obj['duration'],
                'errors': obj['errors'],
                'warnings': obj['warnings'] }

        if 'total' in obj:
            logobj['total'] = obj['total']

        log['logs'].append(logobj)

log['logs'] = sorted(log['logs'], key = lambda l: l['name'], reverse = True)        

logsfilename = '../logger-angular/app/logs.ts'
logsfile = open(logsfilename, 'w')
logsfile.write('export const LOGS = ')
logsfile.write(json.dumps(log, sort_keys=True, indent=2))
logsfile.close()

#!/usr/bin/env python3

import os
import sys
import json
import string
from datetime import datetime, time 
import argparse
import subprocess
from md5sum import md5sum, md5sums

LOG_DIR = '../log/'
MOVIE_EXTS = ('asf', 'asx', 'avi', 'divx', 'flv', 'm1v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'rm', 'vob', 'wmv')
EXCLUDED_DIRS = ('dup', 'etc', 'frames', 'img', 'log', 'old', 'tmp', 'work')
OP_SKIPS = { 'hash': ('frames'), 'frame': ('clips', 'frames'), 'slice': ('clips', 'frames'), 'zip': ('clips', 'frames') } 
OP_TIMEOUTS = { 'hash': 5, 'frame': 15, 'slice': 30, 'zip': 60 }
OP_FUNCTIONS = { 'hash': 'hash_file', 'frame': 'gen_frames', 'slice': 'slice_file', 'zip': 'compress_file' }
STRIP_PUNC = str.maketrans('', '', string.punctuation)

total_tasks = 0
ok_to_continue = True

def ok_to_process(op):
    if args.keep_going:
        return True

    global ok_to_continue
    if not ok_to_continue:
        return False

    YEP = 0 #xmessage timeout returns 0 even if default buttons value is 1
    NOPE = 1 #alt-f4 returns 1, which is also an error
    timeout = OP_TIMEOUTS[op]
    message = 'ok to continue with {} task?\n'.format(op.upper())
    message += 'enter=nope\n'
    message += 'timeout at {0:%H:%M:%S}+{1}s'.format(datetime.now().time(), timeout)
    choice = int(subprocess.getoutput('xmessage -nearmouse -timeout {} -buttons yep:{},nope:{} -default nope "{}"; echo $?'.format(timeout, YEP, NOPE, message)))
    ok_to_continue = (choice == YEP)
    return ok_to_continue

def is_movie_file(filename):
    ext = os.path.splitext(filename)[1]
    if(len(ext) > 0 and ext[0] == '.'):
        ext = ext[1:].lower()
    return (ext in MOVIE_EXTS)

def compress_file(dirpath, filename, log):
    filepath = dirpath + '/' + filename
    zippedfile = os.path.splitext(filename)[0] + '.mkv'
    zippedfilepath = dirpath + '/' + zippedfile
    if(not os.path.exists(zippedfilepath) and os.path.getsize(filepath) > 1):
        if(int(args.hard_stop) == 0 or datetime.now().time() < time(int(args.hard_stop), 0)):
            if(ok_to_process('zip')):
                probeinfo = json.loads(subprocess.getoutput('ffprobe -v quiet -print_format json -show_format -show_streams "' + filepath + '"'))
                if("veracrypt2" not in dirpath and int(probeinfo['streams'][0]['coded_height']) > 720):
                    result = subprocess.getoutput('ffmpeg -i "' + filepath + '" -c:v libx264 -c:a ac3 -vf scale=1280:720 "' + zippedfilepath + '"')
                    print('  created 720 ' +  zippedfile)
                elif("veracrypt2" in dirpath and int(probeinfo['streams'][0]['coded_height']) > 1920):
                    result = subprocess.getoutput('ffmpeg -i "' + filepath + '" -c:v libx264 -c:a aac -vf scale=3840:1920 -strict -2 -r 60 "' + zippedfilepath + '"')
                    print('  created 1920 ' +  zippedfile)
                else:
                    print('ffmpeg -i "' + filepath + '" -c:v libx264 -c:a aac -strict -2 "' + zippedfilepath + '"')
                    result = subprocess.getoutput('ffmpeg -i "' + filepath + '" -c:v libx264 -c:a aac -strict -2 "' + zippedfilepath + '"')
                    print('  created ' +  zippedfile)
                log['fsop'] = 'ZIP'
                global total_tasks
                total_tasks += 1
            else:
                log['warnings'].append('user prevented further processing. exiting.')
        else:
            log['warnings'].append('hard stop exceeded. exiting.')

def slice_file(dirpath, filename, log):
    filepath = dirpath + '/' + filename
    fileparts = os.path.split(filepath)
    filedir = fileparts[0]
    filebase = os.path.splitext(fileparts[1])[0]
    fileext = os.path.splitext(fileparts[1])[1]
    print(filedir, filebase, fileext)
    probeinfo = json.loads(subprocess.getoutput('ffprobe -v quiet -print_format json -show_format -show_streams "' + filepath + '"'))
    print(probeinfo['format']['duration'])

    duration = float(probeinfo['format']['duration'])
    dur_min = int(duration / 60)
    sec_rem = int(duration % 60)

    print(duration, dur_min, sec_rem)

    slices = int(dur_min / 5)
    min_rem = int(dur_min % 5)

    s = 0

    if(ok_to_process('slice')):
        total_slices = 0
        for i in range(0, slices):
            h = int(s / 60)
            m = int(s % 60)
            outfile = '../tmp/' + filebase + '.part{0:02d}'.format(i+1) + fileext
            if not os.path.exists(outfile):
                cmd = 'ffmpeg -ss {0:02d}:{1:02d}:00'.format(h, m) + ' -i "' + filepath + '" -c:v copy -c:a copy -t 00:04:59 -force_key_frames 00:00:00,00:04:59 "' + outfile + '"'
                print(cmd) 
                subprocess.getoutput(cmd)
                total_slices += 1
            s += 5

        if(min_rem > 0 or sec_rem > 0):
            h = int(s / 60)
            m = int(s % 60)
            outfile = '../tmp/' + filebase + '.part{0:02d}'.format(int(s/5)+1) + fileext
            if not os.path.exists(outfile):
                cmd = 'ffmpeg -ss {0:02d}:{1:02d}:00'.format(h, m) + ' -i "' + filepath + '" -c:v copy -c:a copy -t 00:{0:02d}:{1:02d} -force_key_frames 00:00:00,00:{0:02d}:{1:02d} "'.format(min_rem, sec_rem) + outfile + '"'
                print(cmd)
                subprocess.getoutput(cmd)
                total_slices += 1

        if(total_slices > 0):
            log['fsop'] = 'SLICE'
            global total_tasks 
            total_tasks += 1

    else:
        log['warnings'].append('user prevented further processing. exiting.')

def gen_frames(dirpath, filename, log):
    filepath = dirpath + '/' + filename
    framedir = dirpath + '/frames'
    framefiledir = framedir + '/' + filename
    if(not os.path.exists(framefiledir) and os.path.getsize(filepath) > 1):
        if(int(args.hard_stop) == 0 or datetime.now().time() < time(int(args.hard_stop), 0)):
            if(ok_to_process('frame')):
                if(not os.path.exists(framedir)):
                    os.mkdir(framedir)
                os.mkdir(framefiledir)
                result = subprocess.getoutput('ffmpeg -ss 00:00:00 -i "' + filepath + '" -vsync 1 -r 1/15 -an -y -vf scale=\'-1\':\'128\' -f image2 "' + framefiledir + '/%03d.jpg"')  
                log['fsop'] = 'FRAME'
                print('  ' + str(sum([len(frames) for r, d, frames in os.walk(framefiledir)])) + ' frames created')
                global total_tasks
                total_tasks += 1
            else:
                log['warnings'].append('user prevented further processing. exiting.')
        else:
            log['warnings'].append('hard stop exceeded. exiting.')

def hash_file(dirpath, filename, log):
    filepath = dirpath + '/' + filename
    md5filename = filepath + '.md5'
    if(not os.path.exists(md5filename) and os.path.getsize(filepath) > 1):
        if(ok_to_process('hash')):
            filemd5 = md5sum(filepath)
            md5file = open(md5filename, 'w')
            md5file.write(filemd5)
            md5file.close()
            log['md5'] = filemd5
            log['fsop'] = 'HASH'
            global total_tasks
            total_tasks += 1
            print('  md5=' +  filemd5)
            print(md5filename)
        else:
            log['warnings'].append('user prevented further processing. exiting.')

def process_files(dirpath, op):
    log = []
    filenames = []
    
    for filename in os.listdir(dirpath):
        if(os.path.isfile(dirpath + '/' + filename) and is_movie_file(filename)):
            filenames.append(filename)

    filenames = sorted(filenames, key = lambda s: s.lower().translate(STRIP_PUNC))        

    for filename in filenames:
        filelog = { 'name': filename, 'warnings': [], 'errors': [] }
        log.append(filelog)
        print('  ' + filename)
        if(int(args.hard_stop) == 0 or datetime.now().time() < time(int(args.hard_stop), 0)):
            eval(OP_FUNCTIONS[op])(dirpath, filename, filelog)
        else:
            filelog['warnings'].append('hard stop exceeded. exiting.')
            break

    return log
        
def process_dir(dirpath, op):
    log = { 'name': dirpath.split(os.sep)[-1], 'files': [], 'dirs':[], 'warnings': [], 'errors': [] }
    print(dirpath)

    subdirnames = []
    for subdirname in os.listdir(dirpath):
        if(os.path.isdir(dirpath + '/' + subdirname) and not subdirname in EXCLUDED_DIRS):
            subdirnames.append(subdirname)

    subdirnames = sorted(subdirnames, key = lambda s: s.lower().translate(STRIP_PUNC))        

    for subdirname in subdirnames:
        if(subdirname not in OP_SKIPS[op]):
            log['dirs'].append(process_dir(dirpath + '/' + subdirname, op))

    log['files'] = process_files(dirpath, op)

    return log

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=['hash', 'frame', 'slice', 'zip'], help='task to perform (hash, frame, slice, zip')
    parser.add_argument('startdir', help='directory to process (can be subdir of known volume)')
    parser.add_argument('-s', '--hard_stop', help="do not continue after this hour (0 = no hard stop)", default=6)
    parser.add_argument('-k', '--keep_going', help="skip confirmation", action="store_true")
    parser.add_argument('-p', '--parallel', help="parallel mode, bypass mutex", action="store_true")
    args = parser.parse_args()

    starttime = datetime.now()

    print('==================================================')
    print('starting processing at:', starttime)

    log = { 'startdir': args.startdir, 'op': args.operation, 'dirs':[], 'warnings': [], 'errors': [], 'start': starttime }

    if os.path.exists(args.startdir) and os.path.isdir(args.startdir):
        scriptfile = os.path.realpath(__file__)
        scriptdir = os.path.dirname(scriptfile)
        mutex_files = [f for f in os.listdir(scriptdir) if f.endswith('.mutex')]
        if(len(mutex_files) == 0):
            scriptbase = os.path.basename(scriptfile).split('.')[0]

            mutexfile = scriptdir + '/' + scriptbase + '.mutex'

            mutex = open(mutexfile, 'w')
            mutex.close
            try:
                log['dirs'].append(process_dir(args.startdir, args.operation))
            finally:
                if(os.path.exists(mutexfile)):
                    os.remove(mutexfile)
        elif(args.parallel):
            log['warnings'].append('parallel mode. bypassing mutex')
            log['dirs'].append(process_dir(args.startdir, args.operation))
        else:
            log['errors'].append('mutex found. exiting.')
    else:
        log['errors'].append('start directory invalid')

    endtime = datetime.now()
    log['end'] = endtime

    duration = endtime - starttime
    log['duration'] = endtime - starttime

    print('finished processing at:', endtime)
    print('for a duration of', endtime - starttime)
    print('==================================================')

    log['total'] = total_tasks

    logfilename = '{:%Y%m%d_%H%M%S}.'.format(starttime) + args.operation + '.log'

    if os.path.exists(LOG_DIR):
        logfilename = LOG_DIR + logfilename

    logfile = open(logfilename, 'w')
    logfile.write(json.dumps(log, sort_keys=True, indent=2, default=str))
    logfile.close()

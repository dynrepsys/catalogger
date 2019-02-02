#!/usr/bin/python3

import os
import sys
import sqlite3
import stat
import sortedcontainers
import hashlib
import subprocess
import json
import time
import datetime 
import string
import argparse
from dir import Dir
from md5sum import md5sum,md5sums

MOUNT_ROOT = 'media'
SQLITE3_DB_PATH = '../db/development.sqlite3'
MOVIE_EXTS = ('asf', 'asx', 'avi', 'divx', 'flv', 'm1v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'rm', 'vob', 'wmv')
EXCLUDED_DIRS = ('_.work', 'dup', 'etc', 'tmp', 'old', 'work', '.Trash-1000')
STRIP_PUNC = str.maketrans('', '', string.punctuation)

def indent(depth, indent_char):
    return 2 * (depth - startdirobj.depth) * indent_char

def is_mask_dir(dirobj):
    return (dirobj.name in volnames and dirobj.parent.name != None and dirobj.parent.name != MOUNT_ROOT)

def get_dir_id(dirname, parentid):
    dirid = None

    if(parentid == None):
        c.execute('select id from directory where name = ? and parent is null', (dirname,))
    else:
        c.execute('select id from directory where name = ? and parent = ?', (dirname, parentid))

    rows = c.fetchall()
    if(len(rows) > 0):
        dirid = rows[0][0]

    return dirid

def get_parent_id(dirobj):
    parentid = None

    #if parent name is mount root
    if(dirobj.parent.name == MOUNT_ROOT):
        #look for id where name = parent name and parentid is null
        parentid = get_dir_id(dirobj.parent.name, None)
    else:
        #look for id where name = parent name and parentid is grandparentid
        parentparentid = get_parent_id(dirobj.parent)
        parentid = get_dir_id(dirobj.parent.name, parentparentid)

    return parentid

def process_dir(dirobj, parentid):
    print(indent(dirobj.depth, ' ') + '/' + dirobj.name)

    log = { 'name': dirobj.name, 'files': [], 'dirs':[], 'warnings': [], 'errors': [] }

    if(not os.path.exists(dirobj.path)):
        log['errors'].append('dir must exist')
        return log

    if(dirobj.parent == None):
        log['errors'].append('dir must have parent')
        return log

    #conditionally process mask dir
    if(is_mask_dir(dirobj)):
        return process_mask_dir(dirobj)

    if(parentid == None and dirobj.parent.name != MOUNT_ROOT):
        parentid = get_parent_id(dirobj)
        if(parentid == None):
            log['errors'].append('dir must have parent id')
            return log

    log['parentid'] = parentid

    dirid = get_dir_id(dirobj.name, parentid)

    #if no dirid then create dir
    if(dirid == None):
        log['db'] = 'INSERT'
        c.execute('insert into directory (parent, name) values (?, ?)', (parentid, dirobj.name))
        dirid = c.lastrowid

    log['id'] = dirid

    #process frames or files first
    if(dirobj.parent.name == 'frames' or dirobj.parent.name == 'thumbs'):
        process_frames(dirobj, dirid, log)
    else:
        log['files'] = process_files(dirobj, dirid)

    subdirnames = []
    for subdirname in os.listdir(dirobj.path):
        if(os.path.isdir(dirobj.path + subdirname) and not subdirname in EXCLUDED_DIRS):
            subdirnames.append(subdirname)

    subdirnames = sorted(subdirnames, key = lambda s: s.lower().translate(STRIP_PUNC))        

    #process subdirs
    for subdirname in subdirnames:
        subdir = Dir(dirobj.path + subdirname)
        logsubdir = process_dir(subdir, dirid)
        log['dirs'].append(logsubdir)

    return log

def get_cached_md5(filepath):
    cached_md5 = None

    md5filename = filepath + '.md5'
    if(os.path.exists(md5filename)):
        md5file = open(md5filename, 'r')
        cached_md5 = md5file.readline().rstrip()

    return cached_md5

def get_gen_md5(filepath):
    ZERO_BYTE_HASH = 'd41d8cd98f00b204e9800998ecf8427e'
    ONE_BYTE_HASH = '68b329da9893e34099c7d8ad5cb9c940' #!!!just one byte: 0x0A, result of echo > file

    gen_md5 = md5sum(filepath)

    if(gen_md5 == ZERO_BYTE_HASH or gen_md5 == ONE_BYTE_HASH):
        return None

    return gen_md5

def get_vol_id(dirobj):
    volid = None

    if(dirobj.parent.name == MOUNT_ROOT):
        volid = get_dir_id(dirobj.name, None)
    else:
        volid = get_vol_id(dirobj.parent)

    return volid

def get_file_vol_id(fileid, dirid):
    c.execute('select parent from directory where id = ?', (dirid,))
    rows = c.fetchall()
    if(len(rows) > 0):
        parent = rows[0][0]
        if(parent == None):
            return dirid
        else:
            return get_file_vol_id(fileid, parent)
    else:
        sys.exit('cannot get vol for file at root - fileid: ' + str(fileid) + ', dirid: ' + str(dirid))

def get_sorted_files(dirobj, filefilter):
    result = []
    
    for filename in os.listdir(dirobj.path):
        filepath = dirobj.path + filename
        if(os.path.isfile(filepath)):
            ext = os.path.splitext(filename)[1]
            if(len(ext) > 0 and ext[0] == '.'):
                ext = ext[1:].lower()
            if(ext in filefilter):
                result.append(filename)

    result = sorted(result, key = lambda s: s.lower().translate(STRIP_PUNC))        
    
    return result
    
def get_dir_from_id(dirid):
    dirobj = None
    #recursive cte to fetch all parent dirs
    #print('recursing with:', dirid)
    c.execute('with parents(id, name, parent) as (select par.id, par.name, par.parent from directory par where par.id = ? union all select child.id, child.name, child.parent from directory child inner join parents par on par.parent = child.id) select id, name from parents', (dirid,))
    rows = c.fetchall()
    if(len(rows) > 0):
        dirpath = ''
        for r in rows:
            #print('row', r, r[1])
            dirpath = str(r[1]) + os.sep + dirpath
        dirpath = os.sep + 'media' + os.sep + dirpath
        #print(dirpath)
        dirobj = Dir(dirpath)

    return dirobj

def process_files(dirobj, parentid):
    log = []

    filenames = get_sorted_files(dirobj, MOVIE_EXTS)

    for filename in filenames:
        filepath = dirobj.path + filename

        print(indent(dirobj.depth, ' ') + '  ' + filename)
        filelog = { 'name': filename, 'warnings': [], 'errors': [], 'parentid': parentid }

        md5 = None

        #look for cached
        cached_md5 = get_cached_md5(filepath)

        #if cached
        if(cached_md5 != None):
            #set md5 to cached
            md5 = cached_md5

        #if no cached or if verify, generate
        if(cached_md5 == None or args.verify_md5): 
            generated_md5 = get_gen_md5(filepath)
            if(generated_md5 != None): #prefer generated
                md5 = generated_md5

        #if verify and cached and generated and not equal
        if(args.verify_md5 and cached_md5 != None and generated_md5 != None and cached_md5 != generated_md5):
            filelog['warnings'].append('md5 mismatch: ' + str(cached_md5) + ' (cached) != ' + generated_md5 + ' (generated)')
        
        #if no md5 continue
        if(md5 != None):
            filelog['md5'] = md5

            #look for file record
            c.execute('select id, name, size, modified, parentid from files where md5 = ? and parentid = ?', (md5, parentid)) #??? why does search for tat only show the first one? created a deleted file for one but not the other
            print('looking for', md5, parentid)
            rows = c.fetchall()
            if(len(rows) == 0):
                file_found = False
                c.execute('select id, name, parentid from files where md5 = ?', (md5,))
                print('looking for', md5)
                rows = c.fetchall()
                if(len(rows) > 0):
                    for r in rows:
                        #find first source match
                        match_fileid = r[0]
                        match_filename = r[1]
                        file_parentid = r[2]
                        if(get_file_vol_id(match_fileid, file_parentid) == curr_volid): #the match is in this volume
                            parentdirobj = get_dir_from_id(file_parentid)
                            if(parentdirobj != None and not os.path.exists(parentdirobj.path + match_filename)): #and the matched file doesnt also exist
                                print('other dir', parentdirobj.path)
                                print('other file', parentdirobj.path + match_filename)
                                print('other file exists', os.path.exists(parentdirobj.path + match_filename))
                                filelog['warnings'].append('found file with matching md5 but different parent ' + str(file_parentid))
                                c.execute('select id, name, size, modified, parentid from files where id = ?', (match_fileid,))
                                file_found = True
            else:
                file_found = True

            fileid = None
            size = os.path.getsize(filepath)
            modified = subprocess.getoutput('stat -c %y "' + filepath + '"')
            if(len(rows) == 0 or not file_found):
                c.execute('insert into files (md5, name, size, modified, parentid) values (?, ?, ?, ?, ?)', (md5, filename, size, modified, parentid))
                filelog['db'] = 'INSERT'
                fileid = c.lastrowid
                print('INSERTING file', fileid)
            elif(len(rows) == 1 and file_found):
                fileid = rows[0][0]
                if(rows[0][1] != filename or rows[0][2] != size or rows[0][3] != modified or rows[0][4] != parentid):
                    c.execute('update files set name = ?, size = ?, modified = ?, parentid = ? where id = ?', (filename,  os.path.getsize(filepath), modified, parentid, fileid))
                    filelog['db'] = 'UPDATE'
                    print('UPDATING file', fileid, filename, '(' + str(parentid) + ')')
                else:
                    print('NOOP file', fileid)
            else: #more than one, so skip (+++ pick one with same vol, or vol being updated)
                filelog['errors'].append('ambiguous file. rows:' + str(len(rows)))
        
            filelog['id'] = fileid
        else:
            filelog['errors'].append('no md5')

        log.append(filelog)
    
    return log

def get_file_id(filename, parentid):
    fileid = None

    c.execute('select id from files where name = ? and parentid = ?', (filename, parentid))

    rows = c.fetchall()
    if(len(rows) > 0):
        fileid = rows[0][0]

    return fileid

FRAME_BASEDIR='../img/'

def process_frames(dirobj, parentid, dirlog):
    log = dirlog 
    log['warnings'] = []

    #get grandparent
    grandparentid = get_parent_id(dirobj.parent)
    if(grandparentid != None):
        log['grandparentid'] = grandparentid
        #try to match file using name of this dir (!) and parent
        fileid = get_file_id(dirobj.name, grandparentid)

        if(fileid == None):
            log['warnings'].append('no rec for file in grandparent dir')
            #look for the one that has the same parent name as this dirs grandparent name
            #!!!requires there is a file named the same as containing dir
            c.execute('select f.id from files f join directory d on f.parentid = d.id where f.name = ? and d.name = ?', (dirobj.name, dirobj.parent.parent.name))
            rows = c.fetchall()
            if(len(rows) > 0):
                fileid = rows[0][0]
                log['warnings'].append('match ' + str(fileid))
                if(len(rows) > 1):
                    log['warnings'].append('multiple matches')
            else:
                log['warnings'].append('assuming file deleted')
                #md5 for file path including name (but no longer trailing 0x0a)
                pathmd5 = md5sums(dirobj.parent.parent.path + dirobj.name)
                #cant log a file INSERT here bc we are in frame dir and deleted file is in grandparent
                c.execute('insert into files (name, md5, parentid) values (?, ?, ?)', (dirobj.name, pathmd5, grandparentid))
                fileid = c.lastrowid

        log['fileid'] = fileid
               
        new_md5_dir = False

        #get md5
        c.execute('select md5 from files where id = ?', (fileid,))
        rows = c.fetchall()
        if(len(rows) > 0):
            md5 = rows[0][0]
            log['md5'] = md5
            #if no img/md5 dir
            if(not os.path.exists(FRAME_BASEDIR + md5) and not args.no_commit):
                try:
                    os.makedirs(FRAME_BASEDIR + md5)
                    log['fsop'] = 'MKDIR'
                    new_md5_dir = True
                except OSError:
                    log['fsop'] = 'ERROR'
                    log['errors'].append('error creating dir ' + FRAME_BASEDIR + md5)

            log['frames'] = []
            framefilenames = get_sorted_files(dirobj, ['jpg'])
            for framefilename in framefilenames:
                framelog = { 'name': framefilename }

                if(not new_md5_dir and args.skip_framedir):
                    continue

                #look for frame by name, md5
                frameid = None
                c.execute('select id, size, height, width, parentid from frame where filemd5 = ? and name = ? limit 1', (md5, framefilename)) #skip modified
                rows = c.fetchall()
                if(len(rows) > 0):
                    frameid = rows[0][0]

                framepath = dirobj.path + framefilename
                size = os.stat(framepath).st_size
                modified = subprocess.getoutput('stat -c %y "' + framepath + '"')
                height = subprocess.getoutput('identify -format "%h" "' + framepath + '"')
                width = subprocess.getoutput('identify -format "%w" "' + framepath + '"')
                #upsert
                if(not frameid):
                    #insert
                    c.execute('insert into frame (name, filemd5, modified, size, height, width, parentid) values (?, ?, ?, ?, ?, ?, ?)', (framefilename, md5, modified, size, height, width, parentid));
                    frameid = c.lastrowid
                    print('INSERT frame', frameid)
                    framelog['db'] = 'INSERT'
                elif(rows[0][1] != size or rows[0][2] != int(height) or rows[0][3] != int(width) or rows[0][4] != parentid):
                    c.execute('update frame set modified = ?, size = ?, height = ?, width = ?, parentid = ? where id = ?', (modified, size, height, width, parentid, frameid))
                    print('UPDATING frame', frameid, framefilename, rows[0], size, height, width, parentid)
                    framelog['db'] = 'UPDATE'
                else:
                    print('NOOP frame', frameid)

                framelog['id'] = frameid

                #if frame not copied
                if(not os.path.exists(FRAME_BASEDIR + md5 + os.sep + framefilename)): 
                    result = ''
                    if(not args.no_commit):
                        result = subprocess.getoutput('cp "' + framepath + '" ' + FRAME_BASEDIR + md5 + os.sep)
                    if(result == ''):
                        framelog['fsop'] = 'COPY'
                    else:
                        framelog['fsop'] = 'ERROR'
                        framelog['errors'].append(result)

                log['frames'].append(framelog)
        else:
            log['errors'].append('no md5')
    else:
        log['errors'].append('no grandparent')

    return

def process_mask_dir(dirobj):
    log = { 'name': dirobj.name, 'mask': True, 'files': [], 'dirs':[], 'errors': [], 'warnings': [] }

    print(indent(dirobj.depth, '-') + 'MASK: "' + dirobj.name + '"')

    return log

def check_empty(dirobj, dirid, delete_sql):
    empty = True

    #look for file records to delete
    c.execute('select id, name from files where parentid = ? and size is not null and size > 1', (dirid,))
    filerows = c.fetchall()
    for filerow in filerows:
        fileid = filerow[0]
        #build path
        filepath = dirobj.path + filerow[1]
        #if file exists
        if(not os.path.exists(filepath)):
            #append delete file sql
            print('file missing', fileid, filepath)
            delete_sql.append('delete from files where id = ' + str(fileid))
        else:
            empty = False

    #look for frame records to delete
    c.execute('select id, name from frame where parentid = ?', (dirid,))
    framerows = c.fetchall()
    for framerow in framerows:
        frameid = framerow[0]
        #build path
        framepath = dirobj.path + framerow[1]
        #if frame exists
        if(not os.path.exists(framepath)):
            print('frame missing', frameid, framepath)
            #append delete frame sql
            delete_sql.append('delete from frame where id = ' + str(frameid))
        else:
            empty = False

    #look for empty subdirs
    c.execute('select id, name from directory where parent = ?', (dirid,))
    subdirrows = c.fetchall()
    for subdirrow in subdirrows:
        subdirid = subdirrow[0]
        subdirobj = Dir(dirobj.path + subdirrow[1])

        if(not check_empty(subdirobj, subdirid, delete_sql)):
            empty = False

    if(empty):
        if(not os.path.exists(dirobj.path)):
            print('dir missing', dirid, dirobj.path)
        else:
            print('dir unused', dirid, dirobj.path)
        delete_sql.append('delete from directory where id = ' + str(dirid))

    return empty 

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('startdir', help='directory to process (can be subdir of known volume)')
    parser.add_argument('startparentid', nargs='?', help='parentid of startdir', default=None)
    parser.add_argument('-n', '--no_commit', help="skip commit and copying frames (dry run)", action="store_true")
    parser.add_argument('-v', '--verify_md5', help="verify file md5 even if .md5 file exists", action="store_true")
    parser.add_argument('-s', '--skip_framedir', help="skip frame processing if frame dir exists", action="store_true")
    parser.add_argument('-d', '--delete_sql', help="look for empty dirs and generate delete sql (not compatible with -n)", action="store_true")
    parser.add_argument('-c', '--copy_log', help="copy log to logviewer", action="store_true")
    args = parser.parse_args()

    try:
        startdirobj = Dir(args.startdir)
    except IndexError:
        sys.exit('Not a valid directory name (must start with a /)')
      
    print('startdir =', startdirobj.path)
    print('startdepth =', startdirobj.depth)

    conn = sqlite3.connect(SQLITE3_DB_PATH)
    c = conn.cursor()

    if(args.startparentid != None):
        startparentid = args.startparentid
    else:
        startparentid = get_parent_id(startdirobj)

    print('startparentid =', startparentid)

    curr_volid = get_vol_id(startdirobj)

    if(curr_volid == None):
        sys.exit('vol id must exist')

    print('volid =', curr_volid)

    c.execute('select name from directory where id = ? limit 1', (curr_volid,))
    curr_volname = c.fetchone()[0]

    if(curr_volname == None or curr_volname == ''):
        sys.exit('vol name must exist')

    volnames = []

    c.execute('select name from directory where parent is null')
    for row in c.fetchall():
        volnames.append(row[0])

    if(curr_volname not in volnames):
        sys.exit('vol name must be known')

    print('volname =', curr_volname)

    print('skip commit?', args.no_commit)
    print('verify md5s?', args.verify_md5)
    print('skip framedirs?', args.skip_framedir)
    print('copy log?', args.copy_log)

    starttime = datetime.datetime.now()
    print('starting processing at:', starttime)

    log = process_dir(startdirobj, startparentid)
    log['op'] = 'update'
    log['start'] = starttime
    log['startdir'] = args.startdir

    if(args.delete_sql):
        delete_sql = []
        check_empty(startdirobj, get_dir_id(startdirobj.name, get_parent_id(startdirobj)), delete_sql)
        print('delete sql:', delete_sql)

    if(not args.no_commit):
        conn.commit()
    conn.close()

    stoptime = datetime.datetime.now()
    print('finished processing at', stoptime, 'for a duration of', stoptime - starttime)
    log['end'] = stoptime
    log['duration'] = stoptime - starttime

    currentlogfilename = '../log/' + time.strftime('%Y%m%d_%H%M%S') + '.update.log'
    currentlogfile = open(currentlogfilename, 'w')
    currentlogfile.write(json.dumps(log, sort_keys=True, indent=2, default=str))
    currentlogfile.close()
    if(args.copy_log):
        viewerlogfilename = 'logviewer/app/ts/current.log.ts'
        print('copying', currentlogfilename, viewerlogfilename) 
        print(subprocess.getoutput('cp ' + currentlogfilename + ' ' + viewerlogfilename))


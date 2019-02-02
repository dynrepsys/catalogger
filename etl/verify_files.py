#!/usr/bin/python

import os
import sys
import sqlite3
import stat
import sortedcontainers

def is_movie(x):
    x = x.lower()
    return (x == '.asf' or x == '.asx' or x == '.avi' or x == '.divx' or x == '.flv' or x == '.m1v' or x == '.mkv' or   
        x == '.mov' or x == '.mp4' or x == '.mpeg' or x == '.mpg' or x == '.rm' or x == '.wmv')

def verify_dir_files(dirpath, parent):
    names = dirpath.split(os.sep)

    dirname = names[len(names)-1]
    if(parent == None):
        c.execute('SELECT id, name FROM directory WHERE name = ? AND parent is null', (dirname,))
    else:
        c.execute('SELECT id, name FROM directory WHERE name = ? AND parent = ?', (dirname, parent))
    dirrow = c.fetchone()
    print((len(names)-3) * '--' + dirrow[1] + ' (' + str(dirrow[0]) + ')' )
    parentid = dirrow[0]
    
    c.execute('SELECT name FROM files WHERE size > 0 AND parentid = ? ORDER BY name ASC', (parentid,))
    filerows = c.fetchall()
    global db_files_found
    db_files_found += len(filerows)

    ls = sortedcontainers.SortedList()
    
    global vol_files_found
    for filename in os.listdir(dirpath):
        filepath = dirpath + os.sep + filename
        fileext = os.path.splitext(filepath)
        if((not stat.S_ISDIR(os.stat(filepath).st_mode)) and is_movie(fileext[1])):
            ls.add(filename)
            vol_files_found += 1

    if(len(ls) > 0):
        print((len(names)-3) * '  ' + str(len(ls)) + ' files')

        mismatches = 0
        global files_verified
        for i in range(0, len(ls)): #+++ needs to use sizes of both lists and determine where errors are
            if(filerows[i][0] == ls[i]):
                files_verified += 1
            else:
                mismatches += 1
                print((len(names)-3) * '  ' + '\033[01;31m' + filerows[i][0] + ' <> ' + ls[i] + '\033[1;0m')

        print((len(names)-3) * '  ' + str(len(ls) - mismatches) + ' matches')

        if(mismatches > 0):
            global file_mismatches
            file_mismatches += mismatches
            print((len(names)-3) * '  ' + '\033[01;31m' + str(mismatches) + ' mismatches\033[1;0m')
    
    for subdirname in os.listdir(dirpath):
        subdirpath = dirpath + os.sep + subdirname
        if(stat.S_ISDIR(os.stat(subdirpath).st_mode)):
            verify_dir_files(subdirpath, parentid)
     
startdir = sys.argv[1].rstrip('/')
print('startdir=' + startdir)

conn = sqlite3.connect('../db/development.sqlite3')

c = conn.cursor()

vol_files_found = 0
db_files_found = 0
files_verified = 0
file_mismatches = 0

verify_dir_files(startdir, None)

conn.close()

print('> vol files found: ', vol_files_found)
print('< db files found:  ', db_files_found)
print('  files verified:  ', files_verified)
if(file_mismatches > 0):
    print('  \033[01;31mfile mismatches:  ' + str(file_mismatches) + '\033[1;0m')


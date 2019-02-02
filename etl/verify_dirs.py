#!/usr/bin/python

import os
import sys
import sqlite3
import stat

def verify_subdirs_exist(dirpath, dirid):
    names = dirpath.split(os.sep)
    c.execute('SELECT id, name FROM directory WHERE parent = ?', (dirid,))
    dirrows = c.fetchall()
    global db_max_subdirs
    if(len(dirrows) > db_max_subdirs[0]):
        db_max_subdirs = (len(dirrows), dirpath)
    for dirrow in dirrows:
        global db_dirs_found
        db_dirs_found += 1
        subdirid = dirrow[0]
        subdirname = dirrow[1]
        global db_max_name_len
        if(len(subdirname) > db_max_name_len[0]):
            db_max_name_len = (len(subdirname), subdirname)
        subdirpath = dirpath + os.sep + subdirname
        if(os.path.exists(subdirpath) and stat.S_ISDIR(os.stat(subdirpath).st_mode)):
            global db_dirs_verified
            db_dirs_verified += 1
            print((len(names)-2) * '< ' + subdirname)
            verify_subdirs_exist(subdirpath, subdirid)
    
def verify_dir_in_db(dirpath, parent):
    global vol_dirs_found
    vol_dirs_found += 1
    names = dirpath.split(os.sep)
    dirname = names[len(names)-1]
    global vol_max_name_len
    if(len(dirname) > vol_max_name_len[0]):
        vol_max_name_len = (len(dirname), dirname)
    c.execute('SELECT id, name FROM directory WHERE name = ? AND parent = ?', (dirname, parent))
    dirrows = c.fetchall()
    if(len(dirrows) > 1):
        sys.exit('\033[01;31mtoo many directories\033[1;0m')
    if(len(dirrows) < 1):
        sys.exit('\033[01;31mno directories\033[1;0m')
    global vol_dirs_verified
    vol_dirs_verified += 1
    dirrow = dirrows[0]
    dirid = dirrow[0]
    print((len(names)-3) * '> ' + dirname)
    subdirs_found = 0
    for subdirname in os.listdir(dirpath):
        subdirpath = dirpath + os.sep + subdirname
        if(stat.S_ISDIR(os.stat(subdirpath).st_mode)):
            subdirs_found += 1
            verify_dir_in_db(subdirpath, dirid)

    global vol_max_subdirs
    if(subdirs_found > vol_max_subdirs[0]):
        vol_max_subdirs = (subdirs_found, dirpath)

def verify_vol_in_db(volpath):
    if(os.path.exists(volpath)):
        global vol_dirs_found
        vol_dirs_found += 1
    names = volpath.split(os.sep)
    volname = names[len(names)-1]
    c.execute('SELECT id, name FROM directory WHERE name = ? AND parent is null', (volname,))
    volrows = c.fetchall()
    if(len(volrows) > 1):
        sys.exit('\033[01;31mtoo many volumes\033[1;0m')
    if(len(volrows) < 1):
        sys.exit('\033[01;31mno volumes\033[1;0m')
    global vol_dirs_verified
    vol_dirs_verified += 1
    volrow = volrows[0]
    volid = volrow[0]
    volname = volrow[1]
    print(volname)
    subdirs_found = 0
    for dirname in os.listdir(volpath):
        dirpath = volpath + os.sep + dirname
        if(stat.S_ISDIR(os.stat(dirpath).st_mode)):
            subdirs_found += 1
            verify_dir_in_db(dirpath, volid)

    global vol_max_subdirs
    if(subdirs_found > vol_max_subdirs[0]):
        vol_max_subdirs = (subdirs_found, volpath)

    global db_dirs_found
    db_dirs_found += 1
    global db_dirs_verified
    db_dirs_verified += 1

    verify_subdirs_exist(volpath, volid)

startdir = sys.argv[1].rstrip('/')
print('startdir=' + startdir)

conn = sqlite3.connect('../db/development.sqlite3')

c = conn.cursor()

vol_dirs_found = 0
vol_dirs_verified = 0
db_dirs_found = 0
db_dirs_verified = 0
vol_max_subdirs = (0, "")
db_max_subdirs = (0, "")
vol_max_name_len = (0, "")
db_max_name_len = (0, "")

verify_vol_in_db(startdir)

conn.close()

print('==========================')
print('  vol dirs found:    ', vol_dirs_found)
print('> vol dirs verified: ', vol_dirs_verified)
print('  db dirs found:     ', db_dirs_found)
print('< db dirs verified:  ', db_dirs_verified)
print('  vol max subdirs:   ', vol_max_subdirs)
print('  db max subdirs:    ', db_max_subdirs)
print('  vol max name len:  ', vol_max_name_len)
print('  db max name len:   ', db_max_name_len)

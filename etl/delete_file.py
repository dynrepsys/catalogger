#!/usr/bin/python

import os
import sys
import sqlite3
import argparse

FRAME_BASEDIR='../img/'
SQLITE3_DB_PATH = '../db/development.sqlite3'

def delete_linked(filemd5, table):
    c.execute('delete from ' + table + ' where filemd5 = ?', (filemd5,))
    print('deleted', c.rowcount, 'records from ' + table)

def check_linked(filemd5, table):
    c.execute('select filemd5 from ' + table + ' where filemd5 = ?', (filemd5,))
    if(len(c.fetchall())>0):
        sys.exit('dependent rows found in ' + table + ' for ' + filemd5)
    else:
        print('confirmed no rows in ' + table + ' for ' + filemd5)

def delete_frames(filemd5):
    delete_linked(filemd5, 'frame')
    framepath = FRAME_BASEDIR + filemd5
    if(os.path.isdir(framepath)):
        print('deleting frames in ', framepath)
        for frame in os.listdir(framepath):
            print('deleting', frame)
            if(not args.no_commit and os.path.isfile(framepath + os.sep + frame)):
                os.remove(framepath + os.sep + frame)

        print('deleting', framepath)
        if(not args.no_commit):
            os.rmdir(framepath)
    else:
        print('no path found', framepath)

def delete_file(fileid):
    c.execute('select name, md5 from files where id = ?', (fileid,))
    filerows = c.fetchall()
    if(len(filerows) == 0):
        sys.exit('no file found with id: ' + str(fileid))

    if(len(filerows) > 1):
        sys.exit('multiple files found with id: ' + str(fileid))

    filename = filerows[0][0]
    filemd5 = filerows[0][1]

    print('found file', filename, filemd5)

    if(args.cascade):
        print('cascade deleting everything...')
        delete_linked(filemd5, 'file_title')
        delete_linked(filemd5, 'file_star')
        delete_linked(filemd5, 'file_note')
        delete_linked(filemd5, 'file_tag')
        delete_linked(filemd5, 'file_list')
        delete_linked(filemd5, 'file_time')
    else:
        check_linked(filemd5, 'file_title')
        check_linked(filemd5, 'file_star')
        check_linked(filemd5, 'file_note')
        check_linked(filemd5, 'file_tag')
        check_linked(filemd5, 'file_list')
        check_linked(filemd5, 'file_time')

    if(args.framestoo):
        delete_frames(filemd5)
    else:
        check_linked(filemd5, 'frame')
        framepath = FRAME_BASEDIR + filemd5
        if(os.path.isdir(framepath) and len(os.listdir(framepath)) > 0):
            sys.exit('frames found for ' + filemd5)
        else:
            print('confirmed no frames stored for', filemd5)
   
    print('deleting file record for', fileid)
    c.execute('delete from files where id = ?', (fileid,))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('fileid', help='file id to delete')
    parser.add_argument('-n', '--no_commit', help="skip commit (dry run)", action="store_true")
    parser.add_argument('-c', '--cascade', help="also delete records associated with hash", action="store_true")
    parser.add_argument('-f', '--framestoo', help="also delete frames stored for hash", action="store_true")
    args = parser.parse_args()

    print('fileid =', args.fileid)
    print('skip commit?', args.no_commit)
    print('cascade?', args.cascade)
    print('include frames?', args.framestoo)

    conn = sqlite3.connect(SQLITE3_DB_PATH)
    c = conn.cursor()

    delete_file(int(args.fileid))

    if(not args.no_commit):
        conn.commit()
        print('committed.')
    else:
        print('skipping commit')
    conn.close()

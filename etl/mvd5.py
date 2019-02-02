#!/usr/bin/env  python3
import os
import sys
import math
import shutil
import sqlite3
import argparse
import subprocess

MOUNT_ROOT = 'media'
DB_PATH = '../db/development.sqlite3'

def get_dir_id(dirpath, parentid):  #??? use this to refactor get_files?
    dirid = None

    dirname = os.path.basename(dirpath)
    parentpath = os.path.dirname(dirpath)
    print('getting dirid for dir', dirname, 'with parent', parentpath)
    if(parentid == None):
        if(os.path.basename(parentpath) == MOUNT_ROOT or dirname == ''):
            c.execute('select id from directory where name = ? and parent is null', (dirname,))
        else:
            parentid = get_dir_id(parentpath, None)
            c.execute('select id from directory where name = ? and parent = ?', (dirname, parentid))
    else:
        c.execute('select id from directory where name = ? and parent = ?', (dirname, parentid))

    rows = c.fetchall()
    if(len(rows) > 0):
        dirid = rows[0][0]

    print('got dirid for dir', dirname, 'with parent', parentpath, dirid)
    return dirid

def move_dir(dirpath, destpath):
    dirid = get_dir_id(dirpath, None)
    destid = get_dir_id(destpath, None)
    print('dirid:', dirid, 'destid:', destid)

    #check not none
    if(dirid == None or destid == None):
        sys.exit('both dir and dest must exist in database')
    
    #check different
    if(dirid == destid):
        sys.exit('dir and dest must be different')

    #make sure depth > 2
    if(len(dirpath.split(os.sep)) <= 3 or len(destpath.split(os.sep)) <= 3): #eg ['', 'media', 'veracrypt2']
        sys.exit('both dir and dest must be subdirectories of volumes')

    c.execute('update directory set parent = ? where id = ?', (destid, dirid))

total_size = 0

def get_total_size(path):
    subtotal = 0
    for name in os.listdir(path):
        fullname = path + os.sep + name
        if(os.path.isdir(path + os.sep + name)):
            subtotal += get_total_size(fullname)
        else:
            subtotal += os.path.getsize(fullname)
             
    return subtotal

def copy_w_progress(src, dst):
    with open(src, 'rb') as fsrc:
        with open(dst, 'wb') as fdst:
            copied = 0
            while True:
                buf = fsrc.read(16*1024)
                if not buf:
                    break
                fdst.write(buf)
                copied += len(buf)
                update_progress(min(16*1024,len(buf)))

pcts_printed = []
total_copied = 0

def update_progress(copied):
    global total_copied
    total_copied += copied
    pct = math.floor((total_copied / total_size)*100)
    global pcts_printed
    if(pct % 2 == 0 and pct not in pcts_printed): 
        pcts_printed.append(pct)
        print((str(pct) + '%' if pct % 10 == 0 else '.'),  end='')
        sys.stdout.flush()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('dir', help='directory to move (can be relative)')
    parser.add_argument('dest', help='destination directory (can be relative)')
    parser.add_argument('-n', '--no_commit', help="skip commit (dry run)", action="store_true")
    args = parser.parse_args()

    dirpath = os.path.abspath(args.dir)
    destpath = os.path.abspath(args.dest)

    print('moving dir:', dirpath)
    print('to dir:', destpath)

    #check mounted in /media
    if(dirpath.split('/')[1] != MOUNT_ROOT or destpath.split('/')[1] != MOUNT_ROOT ):
        sys.exit('error: both dir and dest must be under /' + MOUNT_ROOT)

    total_size = get_total_size(dirpath)
    print('total size:', total_size)

    if(os.path.exists(dirpath) and os.path.isdir(dirpath) and
            os.path.exists(destpath) and os.path.isdir(destpath) and not args.no_commit):
        print('moving files...')
        shutil.move(dirpath, destpath, copy_w_progress)
        print()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    move_dir(dirpath, destpath)

    if(not args.no_commit):
        conn.commit()
        print('committed.')
    else:
        print('skipping commit')
    conn.close()

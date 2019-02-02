#!/usr/bin/python

import os
import sys
import sqlite3

def delete_subdirs(dirid, depth):
    #fetch dir name for output
    c.execute('SELECT name FROM directory WHERE id = ?', (dirid,))
    dirrow = c.fetchone()
    if depth == 0 and input("Are you sure you want to delete '" + dirrow[0] + "' and all its subdirectories? (Y/n): ").lower().strip()[:1] == "n": sys.exit(1)

    print((depth * '--') + dirrow[0])

    #make sure subdirs empty (will delete subdir records)
    c.execute('SELECT id FROM directory WHERE parent = ?', (dirid,))
    subdirrows = c.fetchall()
    for subdirrow in subdirrows:
        delete_subdirs(subdirrow[0], depth+1)

    #delete all frame records (leave frame images on disk - cleanup during integrity checks/purge)
    c.execute('SELECT id, name FROM frame WHERE parentid = ?', (dirid,))
    framerows = c.fetchall()
    for framerow in framerows:
        print((depth * '  ') + '  ' + framerow[1])
        c.execute('DELETE FROM frame WHERE id = ?', (framerow[0],))

    #delete all file records
    c.execute('SELECT id, name FROM files WHERE parentid = ?', (dirid,))
    filerows = c.fetchall()
    for filerow in filerows:
        print((depth * '  ') + '  ' + filerow[1])
        c.execute('DELETE FROM files WHERE id = ?', (filerow[0],))

    #delete the dir record
    c.execute('DELETE FROM directory WHERE id = ?', (dirid,))

rootdirid = sys.argv[1]
print('rootdirid=' + rootdirid) #rootdir is included in delete

conn = sqlite3.connect('../db/development.sqlite3')

c = conn.cursor()

delete_subdirs(rootdirid, 0)

conn.commit()
conn.close()

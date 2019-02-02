#!/usr/bin/python

import sys
import hashlib
from functools import partial

def md5sum(filename):
    with open(filename, mode='rb') as f:
        d = hashlib.md5()
        for buf in iter(partial(f.read, 1024), b''):
            d.update(buf)
    return d.hexdigest()

def md5sums(string):
    return hashlib.md5(string.encode('utf-8')).hexdigest()

if __name__ == "__main__":
    print(md5sum(sys.argv[1]))

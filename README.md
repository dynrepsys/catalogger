# Catalogger
Catalogger is a data organization tool and interface for large volumes of archives.

Primary design objectives:
1. Enable post-hoc metadata to be added and tracked for any file in any archive on any volume _forever_
1. Enable browsing/searching/filtering based on file metadata, and content (within reason)
1. Maintain backwards compatibility with old volumes even as metadata tracking mechanisms evolve
1. Agnostic with respect to operating-system, file-system, encryption standard, compression algorithm, or technology used to read or write files, _or_ metadata

Secondary objectives:
1. Avoid duplicate storage of identical files, or enable recovering space used by duplicates
1. Support automatic generation of thumbnails for images, video files, docs, pdfs and other suitable file types
1. Maintain tracking of content as files are transformed across volumes, eg compressed or re-encoded
1. Actual files may depend only on file-system, compression, and encryption used; and metadata may only additionally dependent on generic SQL

Tertiary objectives:
1. Support volumes that are _dynamic_ as well as static, ie they are still being built and are subject to change, as opposed to being burned into media and effectively read-only
1. Serve as a proving ground for new and emerging technolgies, platforms, and libraries
1. Support end-to-end encryption, including of entire volumes

## Approach
Since each binary file has a unique hash, this, rather than the file's name, location, or id in a table is used as its primary identifier. All metadata is attached to that through association tables, so that volumes can be recompressed, reorganized or transferred to different physical media without losing metadata.

Since files are all stored in common file systems, which are in turn all based on trees, all archiving and retrieval technologies developed for this system are designed around recursive functions and relationships.

## Organization
The system is divided into basic areas of functionality:
* **database** The metadata store, which should be exportable and thus can be rebuilt from scratch using any relational database technology with zero loss of data
* **images** Thumbnails of any suitable content, stored externally from the database as binary compressed images in subdirectories named for the orginating file hash
* **etl** Scripts load and transform files, perform consistency checks and other file/directory-centric operations 
* **viewers** Interfaces built with various technologies
* **loggers** Automated operation auditing tools

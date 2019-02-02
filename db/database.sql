--
-- File generated with SQLiteStudio v3.0.7 on Sat Feb 2 17:00:53 2019
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: site
DROP TABLE IF EXISTS site;

CREATE TABLE site (
    id     INTEGER       PRIMARY KEY,
    domain VARCHAR (128) NOT NULL
);


-- Table: file_star
DROP TABLE IF EXISTS file_star;

CREATE TABLE file_star (
    filemd5 CHAR (32),
    starid  INTEGER   REFERENCES star (id),
    PRIMARY KEY (
        filemd5,
        starid
    )
);


-- Table: title
DROP TABLE IF EXISTS title;

CREATE TABLE title (
    id       INTEGER       PRIMARY KEY,
    title    VARCHAR (128),
    year     INTEGER,
    studioid INTEGER,
    titleid  VARCHAR,
    movieid  INTEGER
);


-- Table: frame
DROP TABLE IF EXISTS frame;

CREATE TABLE frame (
    id       INTEGER  PRIMARY KEY,
    name     VARCHAR,
    filemd5  VARCHAR,
    modified DATETIME,
    size     INTEGER,
    height   INTEGER,
    width    INTEGER,
    parentid INTEGER
);


-- Table: file_title
DROP TABLE IF EXISTS file_title;

CREATE TABLE file_title (
    filemd5 CHAR (32),
    titleid INTEGER   REFERENCES title (id),
    PRIMARY KEY (
        filemd5,
        titleid
    )
);


-- Table: file_list
DROP TABLE IF EXISTS file_list;

CREATE TABLE file_list (
    filemd5 CHAR (32),
    listid  INTEGER   REFERENCES list (id),
    [order] INTEGER,
    PRIMARY KEY (
        filemd5,
        listid
    )
);


-- Table: file_time
DROP TABLE IF EXISTS file_time;

CREATE TABLE file_time (
    filemd5   VARCHAR (32),
    time      INTEGER,
    timestamp TIME
);


-- Table: files
DROP TABLE IF EXISTS files;

CREATE TABLE files (
    id       INTEGER   PRIMARY KEY,
    md5      CHAR (32) NOT NULL,
    name     VARCHAR,
    size     INTEGER,
    modified DATETIME,
    parentid INTEGER
);


-- Table: tag
DROP TABLE IF EXISTS tag;

CREATE TABLE tag (
    id       INTEGER      PRIMARY KEY,
    name     VARCHAR (32),
    parentid INTEGER
);


-- Table: list
DROP TABLE IF EXISTS list;

CREATE TABLE list (
    id          INTEGER PRIMARY KEY,
    name        VARCHAR,
    description TEXT
);


-- Table: star
DROP TABLE IF EXISTS star;

CREATE TABLE star (
    id         INTEGER       PRIMARY KEY,
    i_name     VARCHAR (128),
    i_perfid   VARCHAR (50),
    i_perfname VARCHAR (50),
    i_start    INTEGER,
    i_end      INTEGER,
    i_titles   INTEGER,
    i_imgsrc   VARCHAR (255),
    modified_i DATETIME      DEFAULT (CURRENT_TIMESTAMP) 
);


-- Table: title_star
DROP TABLE IF EXISTS title_star;

CREATE TABLE title_star (
    titleid INTEGER REFERENCES title (id),
    starid  INTEGER REFERENCES star (id),
    PRIMARY KEY (
        titleid,
        starid
    )
);


-- Table: directory
DROP TABLE IF EXISTS directory;

CREATE TABLE directory (
    id     INTEGER       PRIMARY KEY,
    parent INTEGER,
    name   VARCHAR (128) 
);


-- Table: studio
DROP TABLE IF EXISTS studio;

CREATE TABLE studio (
    id   INTEGER      PRIMARY KEY,
    name VARCHAR (50) NOT NULL
);


-- Table: file_tag
DROP TABLE IF EXISTS file_tag;

CREATE TABLE file_tag (
    filemd5 CHAR (32),
    tagid   INTEGER   REFERENCES tag (id),
    PRIMARY KEY (
        filemd5,
        tagid
    )
);


-- Table: file_note
DROP TABLE IF EXISTS file_note;

CREATE TABLE file_note (
    filemd5 VARCHAR (32),
    note    VARCHAR
);


-- Index: unique_junction
DROP INDEX IF EXISTS unique_junction;

CREATE UNIQUE INDEX unique_junction ON file_title (
    filemd5,
    titleid
);


-- View: list_files
DROP VIEW IF EXISTS list_files;
CREATE VIEW list_files AS
    SELECT '/media/' || fp.path || '/' || f.name AS filepath
      FROM files f
           JOIN
           file_list fl ON f.md5 = fl.filemd5
           JOIN
           file_path fp ON f.md5 = fp.fmd5
     WHERE fl.listid = 1
     ORDER BY fl.[order];


-- View: duplicate_md5
DROP VIEW IF EXISTS duplicate_md5;
CREATE VIEW duplicate_md5 AS
    SELECT md5,
           count(md5) 
      FROM files
     GROUP BY md5
    HAVING count(md5) > 1;


-- View: file_path
DROP VIEW IF EXISTS file_path;
CREATE VIEW file_path AS
WITH parents (
        fid,
        fmd5,
        fname,
        id,
        name,
        parent
    )
    AS (
        SELECT f.id,
               f.md5,
               f.name,
               par.id,
               par.name,
               par.parent
          FROM directory par
               JOIN
               files f ON f.parentid = par.id
        UNION ALL
        SELECT fid,
               fmd5,
               fname,
               child.id,
               child.name,
               child.parent
          FROM directory child
               INNER JOIN
               parents par ON par.parent = child.id
    )
    SELECT fid,
           fmd5,
           fname,
           group_concat(name, '/') AS path
      FROM (
               SELECT fid,
                      fmd5,
                      fname,
                      id,
                      name
                 FROM parents
                ORDER BY id ASC
           )
     GROUP BY fid;


-- View: star_file
DROP VIEW IF EXISTS star_file;
CREATE VIEW star_file AS
    SELECT f.id,
           f.md5,
           f.name,
           f.size,
           f.parentid
      FROM files f
           JOIN
           directory d ON f.parentid = d.id
           JOIN
           directory g ON d.parent = g.id
     WHERE d.name = 'star' OR 
           g.name = 'star';


-- View: clip_file
DROP VIEW IF EXISTS clip_file;
CREATE VIEW clip_file AS
    SELECT f.id,
           f.md5,
           f.name,
           f.size,
           f.parentid
      FROM files f
           JOIN
           directory d ON f.parentid = d.id
           JOIN
           directory g ON d.parent = g.id
     WHERE d.name = 'clips' OR 
           g.name = 'clips';


-- View: duplicate_file
DROP VIEW IF EXISTS duplicate_file;
CREATE VIEW duplicate_file AS
    SELECT id,
           d.md5,
           name,
           size,
           modified,
           parentid
      FROM files f
           JOIN
           duplicate_md5 d ON f.md5 = d.md5
     ORDER BY d.md5;


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;

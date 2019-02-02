--each successive parent of a dir
with parents(id, name, parent) as (select par.id, par.name, par.parent from directory par where par.id = 5137 union all select child.id, child.name, child.parent from directory child inner join parents par on par.parent = child.id) select id, name from parents;

--each successive parent reverse order
with parents(id, name, parent) as (select par.id, par.name, par.parent from directory par where par.id = 5137 union all select child.id, child.name, child.parent from directory child inner join parents par on par.parent = child.id) select id, name from parents order by id;

--each successive parent in order (tags) 34
with parents(id, name, parentid) as (select par.id, par.name, par.parentid from tag par where par.id = 34 union all select child.id, child.name, child.parentid from tag child inner join parents par on par.parentid = child.id) select id, name from parents order by id;

--each successive parent grouped, concatenated
with parents(g, id, name, parent) as (select 0, par.id, par.name, par.parent from directory par where par.id = 5137 union all select 0, child.id, child.name, child.parent from directory child inner join parents par on par.parent = child.id) select id, group_concat(name, '/') from parents group by g;

--each successive parent grouped, concatenated, ordered
with parents(g, id, name, parent) as (select 0, par.id, par.name, par.parent from directory par where par.id = 5137 union all select 0, child.id, child.name, child.parent from directory child inner join parents par on par.parent = child.id) select group_concat(name, '/') from (select g, id, name from parents order by id asc) group by g;

--just the volume of a dir
with parents(id, name, parent) as (select par.id, par.name, par.parent from directory par where par.id = 5137 union all select child.id, child.name, child.parent from directory child inner join parents par on par.parent = child.id) select id, name, parent from parents where parent is null;

-- not sure .. same thing?
WITH RECURSIVE rel(child, name, parent) AS (
        SELECT id, name, parent FROM directory where id = 5137
        UNION ALL
        SELECT directory.id, directory.name, directory.parent FROM directory join rel on rel.parent = directory.id
    )
    SELECT * FROM rel;

-- breadth-first, indented list of all subdirs    
WITH RECURSIVE
  under_vol(id, name, parent, level) AS (
    VALUES(3479, '20131222_2210', null, 0)
    UNION ALL
    SELECT directory.id, directory.name, directory.parent, under_vol.level+1
      FROM directory JOIN under_vol ON directory.parent = under_vol.id
     ORDER BY 2 --add DESC to get depth-first
  )
SELECT substr('.....................',1,level*4) || name as indented_name FROM under_vol;

-- depth-first, indented list of all subdirs    
WITH RECURSIVE
  under_dir(id, name, parent, level) AS (
    VALUES(7731, 'cut', 7730, 0)
    UNION ALL
    SELECT directory.id, directory.name, directory.parent, under_dir.level+1
      FROM directory JOIN under_dir ON directory.parent = under_dir.id
     ORDER BY 2 --add DESC to get breadth-first
  )
SELECT id, substr('.....................',1,level*4) || name as indented_name, parent FROM under_dir;
--hmm this doesnt work as it shows subdirs beneath dirs that are not its parent




--okay .. this is the mandelbrot set
WITH RECURSIVE
  xaxis(x) AS (VALUES(-2.0) UNION ALL SELECT x+0.05 FROM xaxis WHERE x<1.2),
  yaxis(y) AS (VALUES(-1.0) UNION ALL SELECT y+0.1 FROM yaxis WHERE y<1.0),
  m(iter, cx, cy, x, y) AS (
    SELECT 0, x, y, 0.0, 0.0 FROM xaxis, yaxis
    UNION ALL
    SELECT iter+1, cx, cy, x*x-y*y + cx, 2.0*x*y + cy FROM m 
     WHERE (x*x + y*y) < 4.0 AND iter<28
  ),
  m2(iter, cx, cy) AS (
    SELECT max(iter), cx, cy FROM m GROUP BY cx, cy
  ),
  a(t) AS (
    SELECT group_concat( substr(' .+*#', 1+min(iter/7,4), 1), '') 
    FROM m2 GROUP BY cy
  )
SELECT group_concat(rtrim(t),x'0a') FROM a;
    
select count(*) from directory; --5658
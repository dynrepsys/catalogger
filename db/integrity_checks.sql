--find files that dont have frames
select f.id, f.name, f.md5, f.size, f.parentid, d.name 
from files f 
join directory d on f.parentid = d.id 
left join frame i on f.md5 = i.filemd5 where i.filemd5 is null;
--20060518_1617 only have thumbs for orig, need for mkv
--20061020_2040 same
--20000419_1128 frames are pngs
--20020513_1716 asx file is an error

--include grandparent to more easily filter out clips
select f.id, f.name, f.md5, f.size, f.parentid, d.name, gp.name 
from files f 
join directory d on f.parentid = d.id 
join directory p on d.parent = p.id
join directory gp on p.parent = gp.id
left join frame i on f.md5 = i.filemd5 where i.filemd5 is null;--does this exclude the non-clips above?

--frames that have no file - should be 0
select * 
from frame i 
left join files f on i.filemd5 = f.md5 
where f.md5 is null; 

--files that have no parent - should be 0
select * 
from files f 
left join directory d 
on f.parentid = d.id 
where d.id is null;

--duplicate directories - should be 0
select name, COUNT(*) c 
from directory 
group by name, parent 
having c > 1;

--duplicate files - should be 0
select name, COUNT(*) c 
from files 
group by name, parentid 
having c > 1;

--duplicate frames, by parent - should be 0
select name, COUNT(*) c 
from frame
group by name, parentid 
having c > 1;

--duplicate frames, by filemd5 - should be 0
select name, COUNT(*) c 
from frame
group by name, filemd5 
having c > 1;

--self-referencing directories - should be 0
select *
from directory
where id = parent;

--self-referencing files - should be 0
select *
from files
where id = parentid;
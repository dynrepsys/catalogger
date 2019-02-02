const app = new (require('koa'))();
const fs = require('fs');
const sqlite3 = require('co-sqlite3'); //verbose implicit
const router = require('koa-router')();
const exec = require('async-exec');
var config = require('./config');

var frame_basedir = "/media/veracrypt/work/catalog/directories/img/";

// logger
app.use(async function (ctx, next) {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

app.use(async function (ctx, next){
    this.db = await sqlite3('../../files/db/development.sqlite3');
    await next();
});

var stars = null;

router
    .get('/', async function (ctx, next) {
        await next();
        ctx.type = 'text/html';
        ctx.body = fs.createReadStream('./index.html' , 'utf-8');
    })
    .get('/favicon.ico', async function (ctx, next) {
        await next();
        ctx.type = 'image/x-icon';
        ctx.body = fs.createReadStream("./padlock.png");
    })
    .get('/:file\.html', async function (ctx, next) {
        await next();
        ctx.type = 'text/html';
        ctx.body = fs.createReadStream('./' + ctx.params.file + '.html' , 'utf-8');
    })
    .get('/js/:file\.js', async function (ctx, next) {
        await next();
        ctx.type = 'text/javascript';
        ctx.body = fs.createReadStream('./js/' + ctx.params.file + '.js' , 'utf-8');
    })
    .get('/css/:file\.css', async function (ctx, next) {
        await next();
        ctx.type = 'text/css';
        ctx.body = fs.createReadStream('./css/' + ctx.params.file + '.css' , 'utf-8');
    })
    .get('/html/:file\.html', async function (ctx, next) {
        await next();
        var template = fs.readFileSync('./html/' + ctx.params.file + '.html' , 'utf-8').replace(/\n/g, '').replace(/'/g, '\\\'');
        ctx.type = 'text/javascript';
        ctx.body = "templates[\"" + ctx.params.file + "\"] = '" + template + "';\n";
    })
    .get('/tagger.css', async function (ctx, next) {
        await next();
        ctx.type = 'text/css';
        ctx.body = fs.createReadStream("./tagger.css" , 'utf-8');
    })
    .get('/init.js', async function (ctx, next) {
        await next();
        ctx.type = 'text/javascript';
        ctx.body = "var dburl_base = \"" + config.dburl_base + "\";  \
                    var title_api = \"" + config.title_api + "\"; \
                    var actor_api = \"" + config.actor_api + "\"; \
                    var templates = {}";
    })
    .get('/volumes', async function (ctx, next) {
        await next();  
        ctx.body = await this.db.all("select * from directory where parent is null;");
    })
    .get("/dirs/:id", async function(ctx, next) {
        await next();
        subdirs = await this.db.all("select * from directory where parent = ?;", ctx.params.id);
        ctx.body = subdirs.sort(function (a, b) { 
            if(a.name.toUpperCase() < b.name.toUpperCase()) { return -1; }
            if(a.name.toUpperCase() > b.name.toUpperCase()) { return 1; }
            return 0; 
        });
    })
    .get("/files/:id", async function(ctx, next) {
        await next();

        if(stars == null) {
            stars = {};
            var starids = await this.db.all("select id from star_file;");
            for(let starid of starids) {
                stars['' + starid.id] = true;
            }
        }

        var starcountsql = "(select count(s.id) from file_star fs join star s on fs.starid = s.id where fs.filemd5 = f.md5) as stars";
        var tagcountsql = "(select count(tag.id) from file_tag join tag on file_tag.tagid = tag.id where file_tag.filemd5 = f.md5) as tags";
        async function getFiles(subdir) {
            var result = [];
            if(subdir.name != 'clips' && subdir.name != 'frames' && subdir.name != 'thumbs') {
                var subsubdirs = await this.db.all("select * from directory where parent = ?;", subdir.id);
                for(let subsubdir of subsubdirs) {
                    result = result.concat(await getFiles(subsubdir));
                }
                var files = await this.db.all("select f.id, name, md5, (size is null or size == 0 or size == 1) as isDeleted, t.title, " + starcountsql + ", " + tagcountsql + " from files f left join file_title ft on f.md5 = ft.filemd5 left join title t on ft.titleid = t.id where f.parentid = ?;", subdir.id);
                if(subdir.name in config.subddirs) {
                    files.map((file) => {
                        file.isSubd = true;
                        return file;
                    });
                }
                files.map((file) => {
                    file.isSubd = file.isSubd || (('' + file.id) in stars);
                });
                result = result.concat(files);
            }
            return result;
        }

        var result = [];
        if(ctx.query.mode == 'flat') {
            console.log('getting all files');
            var subdirs = await this.db.all("select * from directory where parent = ?;", ctx.params.id);
            for(let subdir of subdirs) {
                result = result.concat(await getFiles(subdir));
            }
        }
        ctx.body = result.concat(await this.db.all("select f.id, name, md5, (size is null or size == 0 or size == 1) as isDeleted, t.title, " + starcountsql + ", " + tagcountsql + " from files f left join file_title ft on f.md5 = ft.filemd5 left join title t on ft.titleid = t.id where f.parentid = ?;", ctx.params.id));
    })
    .get("/clips/:id", async function(ctx, next) {
        await next();

        var starcountsql = "(select count(s.id) from file_star fs join star s on fs.starid = s.id where fs.filemd5 = c.md5) as stars";
        var tagcountsql = "(select count(tag.id) from file_tag join tag on file_tag.tagid = tag.id where file_tag.filemd5 = c.md5) as tags";
        async function getFiles(subdir) {
            var result = [];
            if(subdir.name = 'clips') {
                var subsubdirs = await this.db.all("select * from directory where parent = ?;", subdir.id);
                for(let subsubdir of subsubdirs) {
                    result = result.concat(await getFiles(subsubdir));
                }
                var clips = await this.db.all("select c.id as id, md5, name, (size is null) as isDeleted, t.title as title, " + starcountsql + ", " + tagcountsql + " from clip_file c left join file_title ft on c.md5 = ft.filemd5 left join title t on ft.titleid = t.id where c.parentid = ?;", subdir.id);
                result = result.concat(clips);
            }
            return result;
        }

        var result = [];
        if(ctx.query.mode == 'flat') {
            console.log('getting all clips  ');
            var subdirs = await this.db.all("select * from directory where parent = ?;", ctx.params.id);
            for(let subdir of subdirs) {
                result = result.concat(await getFiles(subdir));
            }
        }
        ctx.body = result.concat(await this.db.all("select c.id as id, md5, name, (size is null) as isDeleted, t.title as title, " + starcountsql + ", " + tagcountsql + " from clip_file c left join file_title ft on c.md5 = ft.filemd5 left join title t on ft.titleid = t.id where c.parentid = ?;", ctx.params.id)); //assumes no clips in volume root
    })
    .get("/file/:md5/frames", async function(ctx, next) {
        await next();
        var result = [];
        var framePath = frame_basedir + ctx.params.md5;
        console.log(framePath);
        if( fs.existsSync(framePath) && fs.statSync(framePath).isDirectory() ){
            console.log('frames exist');
            var frames = fs.readdirSync(framePath);
            var dotJpg = /\.jpg$/;
            for (var f in frames) {
                if (dotJpg.test(frames[f])){
                    result.push({ src: 'img/' + ctx.params.md5 + '/' + frames[f] });
                }
            }
        }
        ctx.body = result;
    })
    .get('/img*', async function (ctx, next) {
        await next();
        ctx.type = 'image/jpeg';
        ctx.body = fs.createReadStream("." + ctx.request.url);
    })
    .get("/search/:file", async function(ctx, next) {
      await next();
      var result = {files: [], dirs: [], parents: []};

      var files = await this.db.all("select id, parentid from files where name like '%" + ctx.params.file + "%' order by id;");
      result.files = new Array(files.length);
      for(var f = 0; f < files.length; f++){
        result.files[f] = files[f].id;
        result.parents.push(files[f].parentid);
      }

      var titles = await this.db.all("select f.id as id, f.parentid from files f join file_title ft on f.md5 = ft.filemd5 join title t on ft.titleid = t.id where t.title like '%" + ctx.params.file + "%' order by f.id;");
      for(var t = 0; t < titles.length; t++){
        result.files.push(titles[t].id);
        result.parents.push(titles[t].parentid);
      }

      var dirs = await this.db.all("select id, parent from directory where name like '%" + ctx.params.file + "%' order by id;");
      result.dirs = new Array(dirs.length);
      for(var d = 0; d < dirs.length; d++){
        result.dirs[d] = dirs[d].id;
        result.parents.push(dirs[d].parent);
      }

      var l = 0;
      var pids = result.parents.slice();

      do {
          var pq = await this.db.all("select distinct parent from directory where id in (" + pids.join() + ") and parent is not null;");

          pids = []; console.log('pq', pq);
          for(var p = 0; p < pq.length; p++){
            pids.push(pq[p].parent);
          }
          result.parents = result.parents.concat(pids); 
          l++;
      } 
      while( pids.length > 0 );
        
      ctx.body = result;
    })
    .get("/findtitles/:title", async function(ctx, next) {
        await next();
        var title = encodeURIComponent(ctx.params.title);
        ctx.body = await exec.execWithCallbackOnData(`scrapy runspider ../../files/find_titles.py -o - -t json --nolog -a search=` + title);    
    })
    .get("/findstars/:name", async function(ctx, next) {
        await next();
        var name = encodeURIComponent(ctx.params.name);
        ctx.body = await exec.execWithCallbackOnData(`scrapy runspider ../../files/find_names.py -o - -t json --nolog -a search=` + name);    
    })
    .get("/titles", async function(ctx, next) {
        await next();
        console.log("cq", ctx.query);
        if(ctx.query.q) {
            var titles = await this.db.all("select t.id, t.title, year, s.name as studio, titleid from title t left join studio s on t.studioid = s.id where t.title like '%" + ctx.query.q + "%'");
        }
        else {
            var titles = await this.db.all("select t.id, t.title, year, s.name as studio, t.titleid, (f.count is not null) as isLinked from title t left join studio s on t.studioid = s.id left join (select titleid, count(filemd5) as count from file_title group by titleid) f on t.id = f.titleid ");
        }
        ctx.body = titles;
    })
    .post("/title", async function(ctx, next) {
        await next();
        console.log('post title', ctx.query.title, ctx.query.studio, ctx.query.year, ctx.query.titleid, ctx.query.movieid);
        var studio = await this.db.get("select id from studio where name = ?;", ctx.query.studio);
        console.log("studio", studio);
        if(!studio) {
            studio = await this.db.run("insert into studio (name) values (?);", ctx.query.studio);
            console.log("studio2", studio.lastID);
            studio.id = studio.lastID;
        }
        var title = await this.db.get("select count(id) as count from title where titleid = ?;", ctx.query.titleid);
        console.log('existing title', ctx.query.titleid, title);
        if(title.count == 0) {
            title = await this.db.run("insert into title (title, year, studioid, titleid, movieid) values (?, ?, ?, ?, ?);", ctx.query.title, ctx.query.year, studio.id, ctx.query.titleid, ctx.query.movieid);
            console.log("new title", ctx.query.titleid, title);
            if(title && title.lastID > 0) {
                ctx.status = 200;
                ctx.body = { status: 200, body: 'OK' };
            }
            else {
                ctx.status = 500;
                ctx.body = { status: 500, body: 'ERROR' };
            }
        } else {
            ctx.status = 200;
            ctx.body = { status: 200, body: 'OK' };
        }
    })
    .post("/filetitle", async function(ctx, next) {
        await next();
        var filetitle = await this.db.get("select count(filemd5) as count from file_title where filemd5 = ? and  titleid = ?;", ctx.query.filemd5, ctx.query.titleid);
        console.log("existing filetitle", filetitle);
        if(filetitle.count == 0) {
            filetitle = await this.db.run("insert into file_title (filemd5, titleid) values (?, ?);", ctx.query.filemd5, ctx.query.titleid);
            console.log("new filetitle", filetitle);
            if(filetitle) {
                ctx.status = 200;
                ctx.body = { status: 200, body: 'OK' };
            }
            else {
                ctx.status = 500;
                ctx.body = { status: 500, body: 'ERROR' };
            }
        } else {
            ctx.status = 200;
            ctx.body = { status: 200, body: 'OK' };
        }
    })
    .get("/stars", async function(ctx, next) {
        await next();
        console.log("cq", ctx.query);
        if(ctx.query.q) {
            var stars = await this.db.all("select id, i_name as name, i_start as start, i_end as end, i_titles as titles, i_perfid, i_perfname from star where i_name like '%" + ctx.query.q + "%'");
        }
        else {
            var stars = await this.db.all("select id, i_name as name, i_start as start, i_end as end, i_titles as titles, i_perfid, i_perfname, (f.count is not null) as isLinked from star s left join (select starid, count(filemd5) as count from file_star group by starid) f on s.id = f.starid ");
        }
        ctx.body = stars;
    })
    .post("/star", async function(ctx, next) {
        await next();
        console.log('post star', ctx.query.name, ctx.query.perfid, ctx.query.perfname, ctx.query.start, ctx.query.end, ctx.query.titles, ctx.query.imgsrc);
        var star = await this.db.get("select count(id) as count from star where i_perfid = ?;", ctx.query.perfid);
        console.log('existing star', ctx.query.perfid, star);
        if(star.count == 0) {
            star = await this.db.run("insert into star (i_name, i_perfid, i_perfname, i_start, i_end, i_titles, i_imgsrc) values (?, ?, ?, ?, ?, ?, ?);", ctx.query.name, ctx.query.perfid, ctx.query.perfname, ctx.query.start, ctx.query.end, ctx.query.titles, ctx.query.imgsrc);
            console.log("new star", ctx.query.perfid, star);
            if(star && star.lastID > 0) {
                ctx.status = 200;
                ctx.body = { status: 200, body: 'OK' };
            }
            else {
                ctx.status = 500;
                ctx.body = { status: 500, body: 'ERROR' };
            }
        } else {
            ctx.status = 200;
            ctx.body = { status: 200, body: 'OK' };
        }
    })
    .post("/filestar", async function(ctx, next) {
        await next();
        var filestar = await this.db.get("select count(filemd5) as count from file_star where filemd5 = ? and  starid = ?;", ctx.query.filemd5, ctx.query.starid);
        console.log("existing filestar", filestar);
        if(filestar.count == 0) {
            filestar = await this.db.run("insert into file_star (filemd5, starid) values (?, ?);", ctx.query.filemd5, ctx.query.starid);
            console.log("new filestar", filestar);
            if(filestar) {
                ctx.status = 200;
                ctx.body = { status: 200, body: 'OK' };
                stars = null;
            }
            else {
                ctx.status = 500;
                ctx.body = { status: 500, body: 'ERROR' };
            }
        } else {
            ctx.status = 200;
            ctx.body = { status: 200, body: 'OK' };
        }
    })
    .get("/tags", async function(ctx, next) {
        await next();
        console.log("cq", ctx.query);
        if(ctx.query.q) {
            var tags = await this.db.all("select id, name from tag where name like '%" + ctx.query.q + "%'");
        }
        else {
            async function getSubtags(tag) {
                var subtags = await this.db.all("select id, name, '" + tag.path + "/' || name as path from tag where parentid = ?;", tag.id);
                var result = [];
                for(let subtag of subtags) {
                    result = result.concat(await getSubtags(subtag));
                }
                return subtags.concat(result);
            }
            var tags = await this.db.all("select id, name, '/' || name as path from tag where parentid is null");
            for(let tag of tags) {
                tags = tags.concat(await getSubtags(tag));
            }
        }
        ctx.body = tags.sort(function (a, b) { 
            if(a.path < b.path) { return -1; }
            if(a.path > b.path) { return 1; }
            return 0; 
        })//;tags;
    })
    .get("/tagstree", async function(ctx, next) {
        await next();
        console.log("cq", ctx.query);
        if(ctx.query.q) {
            var tags = await this.db.all("select id, name from tag where name like '%" + ctx.query.q + "%'");
        }
        else {
            async function getSubtags(tag) {
                var subtags = await this.db.all("select id, name from tag where parentid = ?;", tag.id);
                for(let subtag of subtags) {
                    subtag.subtags = await getSubtags(subtag);
                }
                return subtags;
            }

            var tags = await this.db.all("select id, name from tag where parentid is null");
            for(let tag of tags) {
                tag.subtags = await getSubtags(tag);
            }            
        }
        ctx.body = tags;
    })
    .get("/filetags/:filemd5", async function(ctx, next) {
        await next();
        console.log("cq", ctx.query);
        var tags = await this.db.all("select id, name from tag t join file_tag f on t.id = f.tagid where f.filemd5 = '" + ctx.params.filemd5 + "'");
        for(let tag of tags) {
            parents = await this.db.all("with parents(id, name, parentid) as (select par.id, par.name, par.parentid from tag par where par.id = ? union all select child.id, child.name, child.parentid from tag child inner join parents par on par.parentid = child.id) select id, name from parents order by id", tag.id);
            tag.path = '/';            
            for(let par of parents) {
                tag.path += par.name + '/';
            }
        }
        ctx.body = tags; 
    })
    .post("/filetag", async function(ctx, next) {
        await next();
        var filetag = await this.db.get("select count(filemd5) as count from file_tag where filemd5 = ? and  tagid = ?;", ctx.query.filemd5, ctx.query.tagid);
        console.log("existing filetag", filetag);
        if(filetag.count == 0) {
            filetag = await this.db.run("insert into file_tag (filemd5, tagid) values (?, ?);", ctx.query.filemd5, ctx.query.tagid);
            console.log("new filetag", filetag);
            if(filetag) {
                ctx.status = 200;
                ctx.body = { status: 200, body: 'OK' };
            }
            else {
                ctx.status = 500;
                ctx.body = { status: 500, body: 'ERROR' };
            }
        } else {
            ctx.status = 200;
            ctx.body = { status: 200, body: 'OK' };
        }
    })
    .delete("/filetag", async function(ctx, next) {
        await next();
        var filetag = await this.db.get("select count(filemd5) as count from file_tag where filemd5 = ? and  tagid = ?;", ctx.query.filemd5, ctx.query.tagid);
        console.log("existing filetag", filetag);
        if(filetag.count > 0) {
            var statement = await this.db.run("delete from file_tag where filemd5 = ? and tagid = ?;", ctx.query.filemd5, ctx.query.tagid);
            console.log("deleted filetag", statement);
            if(statement.changes > 0) {
                ctx.status = 200;
                ctx.body = { status: 200, body: 'OK' };
            }
            else {
                ctx.status = 500;
                ctx.body = { status: 500, body: 'ERROR' };
            }
        } else {
            ctx.status = 200;
            ctx.body = { status: 200, body: 'OK' };
        }
    });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3001);

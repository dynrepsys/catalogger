var app = require('koa')();
var db = new (require('sqlite3').verbose()).Database('../files/db/development.sqlite3');
var Promise = require('bluebird');
var fs = new require('fs');

var frame_basedir = "../img/";

Promise.promisifyAll(fs);
Promise.promisifyAll(db, {multiArgs: false});

var exec = require('child_process').exec;
Promise.promisifyAll(exec);

app.use(function *() {  

  var volrx = new RegExp(/^\/volume\/(\d+)$/);
  var dirrx = new RegExp(/^\/directory\/(\d+)$/);
  var filerx = new RegExp(/^\/file\/(\d+)$/);
  var imgrx = new RegExp(/^\/img\/*/);
  var jsrx = new RegExp(/^\/js\/.*\.js/);
  var cssrx = new RegExp(/^\/css\/.*\.css/);
  var srchrx = new RegExp(/^\/search\/([-_.A-Za-z0-9]*)$/);
  var titlrx = new RegExp(/^\/title\/([-_.+A-Za-z0-9]*)$/);

  switch(this.request.url) {
    case (cssrx.test(this.request.url) ? this.request.url : false):
      this.type = 'text/css';
      this.body = yield fs.readFileAsync("." + this.request.url , 'utf-8')
        .then(function(val){
            return val;
        });
      break;
    case (jsrx.test(this.request.url) ? this.request.url : false):
      this.type = 'text/javascript';
      this.body = yield fs.readFileAsync("." + this.request.url , 'utf-8')
        .then(function(val){
            return val;
        });
      break;
    case "/volumes":
      this.body = yield db.allAsync("select * from directory where parent is null;")
        .then(function(rows){
            var row = "[\n";
            for(var r = 0; r < rows.length; r++){
              row += "    { \"id\": \"" + rows[r].id + "\", \"name\": \"" + rows[r].name + "\" }";
              if( r < rows.length - 1)
                  row += ",\n";
            }
            return row + "\n]";
        });
      break;
    case (volrx.test(this.request.url) ? this.request.url : false):
    case (dirrx.test(this.request.url) ? this.request.url : false):
      console.log(this.request.url);
      var pid = RegExp.$1;
      this.body = "{";
      this.body += yield db.allAsync("select * from directory where id = " + pid + ";")
        .then(function(rows){
            var dir = "\"id\": \"" + rows[0].id + "\",\n" +
                "\"name\": \"" + rows[0].name + "\",\n" +
                "\"parent\": \"" + rows[0].parent + "\"";
            return dir;
        });
      this.body += ", \n \"subdirs\": [\n";
      this.body += yield db.allAsync("select * from directory d left join (select d.id as did, f.id as fid from directory d join files f on d.name = f.name where parent = " + pid + ") as f on d.id = f.did where d.parent = " + pid + ";")
        .then(function(rows){
            var row = "";
            for(var r = 0; r < rows.length; r++){
              row += "    { \"id\": \"" + rows[r].id + "\", \"name\": \"" + rows[r].name + "\"";
              if(rows[r].fid != null){
                  row += ", \"fid\": \"" + rows[r].fid + "\"";
              }
              row += " }";
              if( r < rows.length - 1)
                  row += ",\n";
            }
            return row;
        });
      this.body += "\n], \n \"files\": [\n";
      this.body += yield db.allAsync("select * from files where parentid = " + pid + ";")
        .then(function(rows){
            var row = "";
            for(var r = 0; r < rows.length; r++){
              row += "    { \"id\": \"" + rows[r].id + "\", \"name\": \"" + rows[r].name + "\", \"size\": \"" + rows[r].size  + "\", \"md5\": \"" + rows[r].md5 + "\" }";
              if(r < rows.length - 1)
                  row += ",\n";
            }
            return row;
        });
      //!!! depends on there never being frames in the same folder as files
      this.body += yield db.allAsync("select * from frame where parentid = " + pid + ";")
        .then(function(rows){
            var row = "";
            for(var r = 0; r < rows.length; r++){
              row += "    { \"id\": \"" + rows[r].id + "\", \"name\": \"" + rows[r].name + "\", \"size\": \"" + rows[r].size + "\" }";
              if(r < rows.length - 1)
                  row += ",\n";
            }
            return row;
        });
      this.body += "\n] }";
      break;
    case (filerx.test(this.request.url) ? this.request.url : false):
      console.log(this.request.url);
      var id = RegExp.$1;
      this.body = yield db.allAsync("select * from files where id = " + id + ";")
        .then(function(rows){
          var json = "{ \n";
          if( rows.length > 0 ) {
            json += "\"id\": \"" + rows[0].id + "\",\n" +
                    "\"md5\": \"" + rows[0].md5 + "\",\n" +
                    "\"name\": \"" + rows[0].name + "\",\n" +
                    "\"size\": \"" + rows[0].size + "\",\n" +
                    "\"modified\": \"" + rows[0].modified + "\",\n" +
                    "\"parent\": \"" + rows[0].parentid + "\"";

            var framePath = frame_basedir + rows[0].md5;
            console.log(framePath);
            if( fs.existsSync(framePath) && fs.statSync(framePath).isDirectory() ){
              json += ",\n\"frames\" : [\n";
              var frames = fs.readdirSync(framePath);
              var dotJpg = /\.jpg$/;
              var first = true;
              for (var f in frames) {
                if (dotJpg.test(frames[f])){
                  json += (!first ? ",\n" : "") + "    { \"src\" : \"img/" + rows[0].md5 + "/" + frames[f] + "\" }";
                  first = false; 
                }
              }
              json += "    \n]"
            } else {
              console.log("no frames for file", id);
            }
          }
          return json + "\n}";
        });
      break;
    case (imgrx.test(this.request.url) ? this.request.url : false):
      if (new RegExp(/.*001.jpg$/).test(this.request.url) || new RegExp(/.*100.jpg$/).test(this.request.url)) {
          console.log(this.request.url, '...');
      }
      this.type = 'image/jpeg';
      this.body = yield fs.readFileAsync("." + this.request.url )
        .then(function(val){
            return val;
        });
      break;
    case (srchrx.test(this.request.url) ? this.request.url : false):
      console.log(this.request.url);
      var str = RegExp.$1;
      var result = {files: [], dirs: [], parents: []};

      var files = yield db.allAsync("select id, parentid from files where name like '%" + str + "%' order by id;");
      result.files = new Array(files.length);
      for(var f = 0; f < files.length; f++){
        result.files[f] = files[f].id;
        result.parents.push(files[f].parentid);
      }

      console.log('files', result.files);

      var dirs = yield db.allAsync("select id, parent from directory where name like '%" + str + "%' order by id;");
      result.dirs = new Array(dirs.length);
      for(var d = 0; d < dirs.length; d++){
        result.dirs[d] = dirs[d].id;
        result.parents.push(dirs[d].parent);
      }

      console.log('dirs', result.dirs);

      var l = 0;
      var pids = result.parents.slice();
      console.log('pids', pids, pids.join());

      do {
          var pq = yield db.allAsync("select distinct parent from directory where id in (" + pids.join() + ") and parent is not null;");
          console.log("select distinct parent from directory where id in (" + pids.join() + ") and parent is not null;");
          pids = []; console.log('pq', pq);
          for(var p = 0; p < pq.length; p++){
            pids.push(pq[p].parent);
          }
          result.parents = result.parents.concat(pids); 
          console.log('parents', result.parents, l);
          l++;
      } 
      while( pids.length > 0 );
        
      this.type = 'application/json';
      this.body = result; //yield db.allAsync("select id from files where name like '%" + str + "%' order by id;");
      break;
    case (titlrx.test(this.request.url) ? this.request.url : false):
      var str = RegExp.$1;
      var cmd = 'scrapy runspider ../files/find_titles.py -o - -t json --nolog -a search=' + str;

      console.log('before exec');
      var child = exec(cmd);

      this.type = 'application/json';

      var that = this;

      child.stdout.on('data', function (data) {
          console.log('stdout: ' + data);
          that.body += data;
      });

      yield promiseFromChildProcess(child).then(function (result) {
          console.log('promise complete: ' + result);
      }, function (err) {
          console.log('promise rejected: ' + err);
      });

      console.log('after exec');

      break;
    default:
      this.body = yield fs.readFileAsync("./catalogApp.html" , 'utf-8')
        .then(function(val){
            return val;
        });
      break;
  } //switch(url)
});

function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

app.listen(3000);  

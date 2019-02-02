//allFiles
var bpapp = bpapp || {};

bpapp.FilesCollection = Backbone.Collection.extend({

    model: bpapp.singleFile,
    url: "/files",
    level: 1,

    initialize: function(models, options){
      options || (options = {});
      if(options.level)
          this.level = options.level;
      console.log( "file coll", options.level, this.level);
    }
});

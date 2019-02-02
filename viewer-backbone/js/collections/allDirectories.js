//allDirectories
var bpapp = bpapp || {};

bpapp.DirectoriesCollection = Backbone.Collection.extend({

    model: bpapp.singleDirectory,
    url: "/directories",
    level: 1,

    initialize: function(models, options){
      options || (options = {});
      if(options.level)
          this.level = options.level;
      console.log( "dir coll", options.level, this.level);
    }
});

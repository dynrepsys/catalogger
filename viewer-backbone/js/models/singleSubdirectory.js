//singleSubdirectory
var bpapp = bpapp || {};

bpapp.singleSubdirectory = Backbone.Model.extend({

  defaults: {
      name: "default",
  },
  
  urlRoot: "/subdir",

  initialize: function(){
  }
});

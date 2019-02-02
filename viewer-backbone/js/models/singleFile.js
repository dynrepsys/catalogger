//singleFile
var bpapp = bpapp || {};

bpapp.singleFile = Backbone.Model.extend({

  defaults: {
      name: "default",
      level: 1
  },
  
  urlRoot: "/file",

  initialize: function(){
  }
});

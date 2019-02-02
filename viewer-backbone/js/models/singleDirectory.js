//singleDirectory
var bpapp = bpapp || {};

bpapp.singleDirectory = Backbone.Model.extend({

  defaults: {
      name: "default",
      level: 1
  },
  
  urlRoot: "/directory",

  initialize: function(){
  }
});

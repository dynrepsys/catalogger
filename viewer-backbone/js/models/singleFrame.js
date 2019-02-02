//singleFrame
var bpapp = bpapp || {};

bpapp.singleFrame = Backbone.Model.extend({

  defaults: {
      src: "default"
  },
  urlRoot: "/frame",

  initialize: function(){
  }
});

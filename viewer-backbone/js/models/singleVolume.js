//singleVolume
var bpapp = bpapp || {};

bpapp.singleVolume = Backbone.Model.extend({

  defaults: {
      name: "default"
  },
  urlRoot: "/volume",

  initialize: function(){
  }
});

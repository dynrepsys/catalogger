//allFrames
var bpapp = bpapp || {};

bpapp.FramesCollection = Backbone.Collection.extend({

    model: bpapp.singleFrame,
    url: "/frames",

    initialize: function(models, options){
      console.log( "frame coll", options);
    }
});

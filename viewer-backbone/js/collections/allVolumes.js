//allVolumes
var bbapp = bbapp || {};

bpapp.VolumesCollection = Backbone.Collection.extend({

    model: bpapp.singleVolume,
    url: "/volumes",

    initialize: function(){
    }
});

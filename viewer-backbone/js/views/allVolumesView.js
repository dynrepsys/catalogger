//allVolumesView
var bpapp = bpapp || {};

bpapp.allVolumesView = Backbone.View.extend({

    tagName: "section",
    className: "vols",

    initialize: function(options) {
        this.filter = options.filter;
    },

    render: function() {
        this.collection.each(this.addVolume, this);
        return this;
    },

    addVolume: function(volume) {
        var volumeView = new bpapp.singleVolumeView({ model: volume, filter: this.filter });
        this.$el.append(volumeView.render().el);
    }
});

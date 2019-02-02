//allDirectoriesView
var bpapp = bpapp || {};

bpapp.allDirectoriesView = Backbone.View.extend({

    tagName: "div",
    className: "dirs",

    initialize: function(options) {
        this.filter = options.filter;
    },

    render: function() {
        this.collection.each(this.addDirectory, this);
        return this;
    },

    addDirectory: function(directory) {
        directory.set("level", this.collection.level);
        var directoryView = new bpapp.singleDirectoryView({ model: directory, filter: this.filter });
        this.$el.append(directoryView.render().el);
    }
});

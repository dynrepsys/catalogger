//allFilesView
var bpapp = bpapp || {};

bpapp.allFilesView = Backbone.View.extend({

    tagName: "div",
    className: "files",

    initialize: function(options) {
        this.filter = options.filter;
    },

    render: function() {
        this.collection.each(this.addFile, this);
        return this;
    },

    addFile: function(file) {
        file.set("level", this.collection.level);
        var fileView = new bpapp.singleFileView({ model: file, filter: this.filter });
        this.$el.append(fileView.render().el);
    }
});

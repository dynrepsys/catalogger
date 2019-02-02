//singleVolumeView
var bpapp = bpapp || {};

bpapp.singleVolumeView = Backbone.View.extend({
    tagName: "article",
    className: "vol",

    initialize: function(options) {
        this.filter = options.filter;
        this.listenTo(this.filter, 'change', this.render);
    },

    events: {
        "click": "toggle",
        "focusin": "showStatus"
    },

    template: _.template( $("#volumeElement").html() ),

    render: function() {
        if (this.$el.html() == '') {
            var volumeTemplate = this.template(this.model.toJSON());
            this.$el.html(volumeTemplate);
        }

        //this.$el.show();
        this.$el.css("color", "");

        var found = this.filter.get('found');
        var id = Number(this.model.id);

        if(found && !found.parents.includes(id)) {
            console.log(id, found, found.parents.includes(id));
            //this.$el.hide();
            this.$el.css("color", 'silver');
        }

        return this;
    },

    toggle: function(e) {
        console.log("toggle");
        var view = this;
        if(!this.model.get("subdirs")){
            this.model.fetch({ success: function(model, res){
                var subdirColl = new bpapp.DirectoriesCollection(res.subdirs, { level : 1 } );
                model.set("subdirs", subdirColl);

                var directoriesView = new bpapp.allDirectoriesView({ collection: subdirColl, filter: this.filter });

                var filesColl = new bpapp.FilesCollection(res.files, { level: model.get("level") + 1 });
                model.set("files", filesColl);

                var filesView = new bpapp.allFilesView({ collection: filesColl, filter: this.filter });

                view.$el.append(directoriesView.render().$el);

                view.$el.append(filesView.render().$el);
            }});
        }
        else {
            this.$el.children(".dirs").toggle();
            this.$el.children(".files").toggle();
        }
    },

    showStatus: function(e) {
        $("#status").html("id: "+this.model.id + " name: " + this.model.get('name'));    
    }
});

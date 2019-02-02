//singleDirectoryView
var bpapp = bpapp || {};

bpapp.singleDirectoryView = Backbone.View.extend({
    tagName: "article",
    className: "dir",

    events: {
        "click": "toggle",
        "focusin": "showStatus"
    },

    template: _.template( $("#directoryElement").html() ),

    initialize: function(options) {
        this.filter = options.filter;
        this.listenTo(this.filter, 'change', this.render);
    },

    render: function() {
        console.log(this.model.id, this.filter);
        if (this.$el.html() == '') {
            var directoryTemplate = this.template(this.model.toJSON());
            this.$el.html(directoryTemplate);
            this.$el.css("margin-left", this.model.get("level") * 10);
        }

        var dirName = this.model.get('name');

        // orphaned clip dirs .. also frame dirs
        if((dirName.charAt(dirName.length-4)=='.' || dirName.substr(-5)=='.mpeg') && !this.model.get('fid')) {
            this.$el.css('color', 'blue');
        }

        this.$el.show();

        if(!this.filter.get('showFrames') && (dirName == 'thumbs' || dirName == 'frames')) {
            this.$el.hide();
        }

        if(!this.filter.get('showOldSubs') && (dirName == 'star' || dirName == 'img' || dirName == 'dry' ||
            dirName == 'les' || dirName == 'quiet' || dirName == 'misc' || dirName == 'clad' ||
            dirName == 'toon' || dirName == 'dup' || dirName == 'part' || dirName == 'play' || dirName == 'err')) {
            this.$el.hide();
        }

        var found = this.filter.get('found');
        var id = Number(this.model.id);

        if(found && !found.dirs.includes(id) && !found.parents.includes(id)) {
            console.log(id, found, found.dirs.includes(id), found.parents.includes(id));
            this.$el.hide();
        }

        return this;
    },

    toggle: function(e) {
        //console.log("dir toggle");
        e.stopPropagation();
        var view = this;
        if(!this.model.get("subdirs")){
            this.model.fetch({ success: function(model, res){
                var subdirColl = new bpapp.DirectoriesCollection(res.subdirs, { level: model.get("level") + 1 });
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
        return false; //??? prevents navigation on click?
    },

    showStatus: function(e) {
        $("#status").html("id: "+this.model.id + " name: " + this.model.get('name'));
        e.stopPropagation();    
    }
});

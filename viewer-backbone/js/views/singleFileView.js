//singleFileView
var bpapp = bpapp || {};

bpapp.singleFileView = Backbone.View.extend({
    tagName: "article",
    className: "file",

    events: {
        "hover": "showFrames",
        "mouseover": "showFrames",
        "click": "toggleFrames",
        "focusin": "showStatus"
    },

    template: _.template( $("#fileElement").html() ),

    initialize: function(options) {
        this.filter = options.filter;
        this.listenTo(this.filter, 'change', this.render);
    },

    render: function() {
        console.log(this.model.id, this.filter.get('showDeleted'));
        if (this.$el.html() == '') {
            var fileTemplate = this.template(this.model.toJSON());
            this.$el.html(fileTemplate);
            this.$el.css("margin-left", this.model.get("level") * 10);
        }

        this.$el.show();

        if(this.model.attributes.size == 'null' || this.model.attributes.size == null ||
            this.model.attributes.size == 0 || this.model.attributes.size == 1){
            this.$el.css('color', 'red');
            if(!this.filter.get('showDeleted')){
                this.$el.hide();
            }
        }

        var found = this.filter.get('found');
        var id = Number(this.model.id);

        if(found && !found.files.includes(id)) {
            console.log(id, found, found.files.includes(id));
            this.$el.hide();
        }

        return this;
    },

    showFrames: function(e){
        console.log(e.type + " - show frames for " + this.model.get("name"));
    },

    toggleFrames: function(e){
        console.log("frame toggle");
        e.stopPropagation();
        var view = this;
        if(!this.model.get("frames")){
            this.model.fetch({ success: function(model, res){
                var frameColl = new bpapp.FramesCollection(res.frames);
                model.set("frames", frameColl);

                var framesView = new bpapp.allFramesView({ collection: frameColl });

                view.$el.append(framesView.render().$el);
            }});
        }
        else {
            this.$el.children(".frames").toggle();
        }
    },

    showStatus: function(e) {
        $("#status").html("id: " + this.model.id + " name: " + this.model.get('name') + " md5: " + this.model.get('md5'));
        e.stopPropagation();    
    }
});

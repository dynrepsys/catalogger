//allFramesView
var bpapp = bpapp || {};

bpapp.allFramesView = Backbone.View.extend({

    tagName: "div",
    className: "frames",

    initialize: function(){
        this.inner = new InnerView();
    },

    render: function() {
        this.$el.css("margin-left", "10px");
        this.$el.css("overflow-x", "scroll");
        this.inner.$el.css("width", (this.collection.length * 228) + "px");

        var view = this;
        var image = new Image();
        image.onload = function() {
            console.log('naturalWidth', this.naturalWidth, this.width);
            view.inner.$el.css("width", (view.collection.length * this.naturalWidth) + "px");
        }
        image.src = this.collection.models[0].get('src');

        this.$el.append(this.inner.$el);
        this.inner.render();
        this.collection.each(this.addFrame, this);
        return this;
    },

    addFrame: function(frame) {
        var frameView = new bpapp.singleFrameView({ model: frame });
        this.inner.$el.append(frameView.render().el);
    }
});

var InnerView = Backbone.View.extend({
    tagName: "div",
    className: "framesInner",
    render: function() {
        this.delegateEvents();
    }
});

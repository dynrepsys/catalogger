//singleFrameView
var bpapp = bpapp || {};

bpapp.singleFrameView = Backbone.View.extend({
    tagName: "article",
    className: "frame",

    events: {
    },

    template: _.template( $("#frameElement").html() ),

    initialize: function(){
        this.model.on('change', this.render, this);
    },

    render: function() {
        var frameTemplate = this.template(this.model.toJSON());
        this.$el.html(frameTemplate);
        return this;
    }
});

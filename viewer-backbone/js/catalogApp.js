//catalogApp
var Filter = Backbone.Model.extend({
    defaults: {
        showDeleted: true,
        showFrames: true,
        showOldSubs: true,
        searchText: ''
    },

    initialize: function(opts) {
        this.on('change:searchText', this.findMatches, this);
    },

    findMatches: function() {
        var searchText = this.get('searchText');

        if(!searchText || searchText == '' || searchText.length < 2) {
            this.unset('found');
            return;
        }

        console.log('searching...', "/search/" + searchText);

        var filter = this;

        $.get("/search/" + searchText)
            .done(function(data) {
                console.log('findMatches', data);
                if(data.dirs || data.files) {
                    filter.set('found', data);
                }
            });
    }
});

var filter = new Filter();

var FormView = Backbone.View.extend({
    events: {
        'click input[id="show-deleted"]': function(e) {
            console.log('toggle del', e.currentTarget.value, $(e.currentTarget).val(), $(e.currentTarget).is(':checked'), e, filter);
            filter.set('showDeleted', $(e.currentTarget).is(':checked'));
        },
        'click input[id="show-frames"]': function(e) {
            filter.set('showFrames', $(e.currentTarget).is(':checked'));
        },
        'click input[id="show-oldsubs"]': function(e) {
            filter.set('showOldSubs', $(e.currentTarget).is(':checked'));
        },
        'keyup input[id="search-text"]': _.throttle(function(e) {
             filter.set('searchText', e.currentTarget.value);
        }, 500, {leading: false})
    }
});

var inputView = new FormView({
    el: 'form',
    model: filter
});

var allVolumes = new bpapp.VolumesCollection();

allVolumes.fetch({ success: function(){

    var volumesView = new bpapp.allVolumesView({ collection: allVolumes, filter: filter });

    $("#allVolumes").append(volumesView.render().el);

}});                        

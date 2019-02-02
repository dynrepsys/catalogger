Vue.component('file-nav', {
    template: templates["file-nav"],
    data: function() { 
        return { 
            mode: 'vol',
            showDefault: true,
            showTitled: true, 
            showStarred: true, 
            showTagged: true, 
            showDeleted: false, 
            showClips: false, 
            showSubd: false,
            filterText: ""
        } 
    },
    created: function() {
        bus.$on('files-loaded', this.broadcast);
        bus.$on('volumes-loaded', this.broadcast);
        this.broadcast();
    },
    watch: { //~~~ look for onchange in lifecycle 
        showDefault: function(val, old) { this.broadcast() },
        showTitled: function(val, old) { this.broadcast() },
        showStarred: function(val, old) { this.broadcast() },
        showTagged: function(val, old) { this.broadcast() },
        showDeleted: function(val, old) { this.broadcast() },
        showClips: function(val, old) { this.broadcast() },
        showSubd: function(val, old) { this.broadcast() },
    },
    methods: {
        setMode: function(newMode) {
            this.mode = newMode;
            this.broadcast();
        },
        filterFiles: _.throttle(function(filterText) {
            bus.$emit('file-filter-text-changed', filterText);
        }, 500, { leading: false, trailing: true }),
        broadcast: function() { 
            console.log('broadcasting', this.mode);
            bus.$emit('file-filter-changed', {
                mode: this.mode, 
                showDefault: this.showDefault,
                showTitled: this.showTitled,
                showStarred: this.showStarred,
                showTagged: this.showTagged,
                showDeleted: this.showDeleted,
                showClips: this.showClips,
                showSubd: this.showSubd,
                filterText: this.filterText
            });
        }
    }
});

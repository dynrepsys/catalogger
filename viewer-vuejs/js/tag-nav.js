Vue.component('tag-nav', {
    template: templates["tag-nav"],
    data: function() { 
        return {
            mode: 'tags',
            titleSearch: "",
            starSearch: "",
            tagSearch: ""
        }
    },
    created: function() {
        bus.$on('table-ready', this.broadcast);
    },
    methods: {
        setMode: function(newMode) {
            this.mode = newMode;
            this.broadcast();
        },
        searchTitles: function() {
            bus.$emit('title-search-entered', this.titleSearch);
        },
        filterTitles: function() {
            bus.$emit('title-search-changed', this.titleSearch);
        },
        searchStars: function() {
            bus.$emit('star-search-entered', this.starSearch);
        },
        filterStars: function() {
            bus.$emit('star-search-changed', this.starSearch);
        },
        filterTags: function() {
            bus.$emit('tag-search-changed', this.tagSearch);
        },
        importTitles: function() {
            bus.$emit('import-ext-titles');
        },
        linkTitle: function() {
            bus.$emit('link-title');
        },
        importStars: function() {
            bus.$emit('import-ext-stars');
        },
        linkStar: function() {
            bus.$emit('link-star');
        },
        linkTag: function() {
            bus.$emit('link-tag');
        },
        unlinkTag: function() {
            bus.$emit('unlink-tag');
        },
        broadcast: function() {
            bus.$emit('tag-mode-changed', this.mode);
        }
    }
});


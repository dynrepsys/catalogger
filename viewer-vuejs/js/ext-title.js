Vue.component('ext-title', {
    template: templates['ext-title'],
    data: function() { return { } },
    props: ['index', 'title'],
    computed: {
        extlink: function() {
            return dburl_base + this.title.url;
        }
    },
    methods: {
        select: function(id, event) {
            console.log('selecting ext title', id, this.title, event.ctrlKey);
            bus.$emit('select-ext-title', id, this.title, !event.ctrlKey );
        }
    }
});


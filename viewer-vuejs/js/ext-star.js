Vue.component('ext-star', {
    template: templates['ext-star'],
    data: function() { return { } },
    props: ['index', 'star'],
    computed: {
        extlink: function() {
            return dburl_base + this.star.url;
        }
    },
    methods: {
        select: function(index, event) {
            console.log('selecting ext star', index, this.star, event.ctrlKey);
            bus.$emit('select-ext-star', index, this.star, !event.ctrlKey );
        }
    }
});


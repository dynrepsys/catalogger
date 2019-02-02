Vue.component('int-title', {
    template: templates['int-title'],
    data: function() { return { } },
    props: ['title'],
    computed: {
        extlink: function() {
            return dburl_base + title_api + '/title=' + this.title.titleid + '/year=' + this.title.year + '/' + this.title.titleid.replace(/\+/g, '-') + '.htm';
        }
    },
    methods: {
        select: function(id, event) {
            console.log('selecting int title', id, this.title, event.ctrlKey);
            bus.$emit('select-int-title', id, this.title);
        }
    }
});


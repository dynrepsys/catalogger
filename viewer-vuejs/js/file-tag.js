Vue.component('file-tag', {
    template: templates['file-tag'],
    data: function() { return { } },
    props: ['tag'],
    methods: {
        select: function(id, event) {
            console.log('selecting tag', id, this.tag.name, event.ctrlKey);
            bus.$emit('select-file-tag', id, this.tag, !event.ctrlKey);
        }
    }
});


Vue.component('tag', {
    template: templates['tag'],
    data: function() { 
        return { 
            testtags: [],
            subtags: []
        }
    },
    props: ['tag'],
    methods: {
        select: function(id, event) {
            console.log('selecting tag', id, this.tag.name, event.ctrlKey);
            bus.$emit('select-tag', id, this.tag, !event.ctrlKey);
        }
    }
});


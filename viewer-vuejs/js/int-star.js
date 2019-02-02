Vue.component('int-star', {
    template: templates['int-star'],
    data: function() { return { } },
    props: ['star'],
    computed: {
        extlink: function() {
            return dburl_base + actor_api + '/perfid=' + this.star.i_perfid + '/gender=f/' + this.star.i_perfname + '.htm';
        }
    },
    methods: {
        select: function(id, event) {
            console.log('selecting star', id, this.star, event.ctrlKey);
            bus.$emit('select-int-star', id, this.star);
        }
    }
});


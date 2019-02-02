Vue.component('tags-venn', {
    template: templates["tags-venn"],
    data: function() {
        return { 
            show: false
        }
    },
    created: function() {
        var vm = this;
        bus.$on('tag-mode-changed', function(mode) {
            vm.show = (mode == 'tags');
            });
    },
    mounted: function() {
        //??? not sure if nextTick is needed, since div is declared in html
        Vue.nextTick(function(){
            var sets = [ 
                    {sets: ['f'], size: 22}
                ];
            var chart = venn.VennDiagram();
            d3.select("#tags-venn").datum(sets).call(chart)
        });
    }
});


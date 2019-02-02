Vue.component('tag-footer', {
    template: templates['tag-footer'],
    data: function() { 
        return { selectedIntTitle: -1, selectedIntStar: -1, selectedFileTag: -1, selectedExtTitles: [], selectedExtStars: [], selectedTags: [] } },
    created: function() {
        var vm = this;
        bus.$on('select-int-title', function(id) {
            vm.selectedIntTitle = id;
        });
        bus.$on('select-int-star', function(id) {
            vm.selectedIntStar = id;
        });
        bus.$on('select-file-tag', function(id) {
            vm.selectedFileTag = id;
        });
        bus.$on('select-ext-title', function(id, title, exclude) {
            if(exclude) 
                vm.selectedExtTitles = [];
            if(id >= 0)
                vm.selectedExtTitles.push(id);
        });
        bus.$on('select-ext-star', function(id, star, exclude) {
            if(exclude) 
                vm.selectedExtStars = [];
            if(id >= 0)
                vm.selectedExtStars.push(id);
        });
        bus.$on('select-tag', function(id, tag, exclude) {
            if(exclude) 
                vm.selectedTags = [];
            if(id >= 0)
                vm.selectedTags.push(id);
        });
    }
});


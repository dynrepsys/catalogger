Vue.component('file-tags', {
    template: templates["file-tags"],
    data: function() {
        return { 
            show: false,
            tags: [],
            tagFilter: ""
        }
    },
    created: function() {
        var vm = this;
        bus.$on('tag-mode-changed', function(mode) {
            vm.show = (mode == 'tags');
        });
        bus.$on('select-file', function(id, file, exclude) {
            vm.tags = [];
            axios.get('/filetags/' + file.md5)
                .then(function (response) {
                    vm.tags = response.data;
                    console.log('on select file', vm.tags);
                    bus.$emit('table-ready', {});
                })
                .catch(function (error) {
                    vm.tags = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
            bus.$emit('select-file-tag', {});
        });
        bus.$on('select-file-tag', function(id, tag) {
            for(let itag of vm.tags) {
                Vue.set(itag, 'isSel', (itag.id == id ? true : false));
            }
        });
        bus.$on('tag-search-changed', function(tagFilter) {
            vm.tagFilter = tagFilter;
        });
    },
    mounted: function() {
        this.loadTags();
    },
    computed: {
        filteredTags: function() {
            var result = this.tags;
            var vm = this;
            
            if(this.tagFilter != "") {
                result = result.filter(function(tag) {
                   return tag.name.toUpperCase().indexOf(vm.tagFilter.toUpperCase()) > -1;
                });
            }

            console.log('filteredTags', result.sort());
          
            return result.sort();
        }
    },
    methods: {
        loadTags: function() {
            this.tags = [{ name: "loading..." }];
            var vm = this;
            axios.get('/tags')
                .then(function (response) {
                    vm.tags = response.data;
                    console.log(vm.tags);
                    bus.$emit('table-ready', {});
                })
                .catch(function (error) {
                    vm.stars = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        }
    }
});




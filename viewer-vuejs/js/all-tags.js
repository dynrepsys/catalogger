Vue.component('all-tags', {
    template: templates["all-tags"],
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
        bus.$on('select-tag', function(id, tag) {
            for(let tag of vm.tags) {
                Vue.set(tag, 'isSel', (tag.id == id ? true : false));
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
          
            return result.sort();
        },
        sortedResults: function() {
            return this.tagsFound.sort();
        }
    },
    methods: {
        loadTags: function() {
            this.tags = [{ name: "loading..." }];
            var vm = this;
            axios.get('/tags')
                .then(function (response) {
                    vm.tags = response.data;
                    console.log('tags', vm.tags);
                    bus.$emit('table-ready', {});
                })
                .catch(function (error) {
                    vm.tags = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        },
        search: function(name) {
            var vm = this;
            this.tagsFound = [{ name: "loading..." }];
            axios.get('/findtags/' + name)
                .then(function (response) {
                    if(response.data.length > 0)
                        vm.tagsFound = response.data;
                    else
                        vm.tagsFound = [{ name: 'no results' }];

                })
                .catch(function (error) {
                    vm.tagsFound = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        }
    }
});



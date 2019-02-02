Vue.component('volume', {
    template: templates["volume"],
    data: function() { 
        return {
            clips: [],
            files: [],
            dirs: [],
            treeFiles: [],
            flatFiles: [],
            open: false,
            filter: {},
            found: {},
            containsFound: true
        } 
    },
    props: ['vol'],
    created: function() {
        console.log('vol created');
        var vm = this;
        bus.$on('file-filter-changed', function(filter) { 
            console.log('filter changed @vol', filter); 
            vm.filter = filter;
            vm.files = (vm.filter.mode == 'dir' ? vm.treeFiles : vm.flatFiles);
        });
        bus.$on('file-filter-text-changed', function(filterText) {
            console.log('filter text changed', filterText);
            if(filterText) {
                axios.get('/search/' + filterText)
                    .then(function (response) {
                        console.log('found', response.data); 
                        vm.found = response.data;
                        vm.containsFound = vm.found.parents.includes(vm.vol.id);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            }
            else {
                vm.found = {};
            }
        });
        bus.$on('select-file', function(id, file, exclude) {
            console.log('select file', id, file, exclude);
            if(exclude) {
                for(let file of vm.files) {
                    Vue.set(file, 'isSel', (file.id == id));
                }
                for(let clip of vm.clips) {
                    Vue.set(clip, 'isSel', (clip.id == id));
                }
            }
            else {
                Vue.set(file, 'isSel', true);
            }
        });
    },
    mounted: function() {
    },
    computed: {
        filteredFiles: function() {
            var result = this.files;
            if( this.filter.showClips && this.filter.mode == 'vol') {
                result = result.concat(this.clips);
            }
            var vm = this;
            result = result.filter(function(file) {
                return vm.filter.showDefault || (file.title || file.stars);
            });
            result = result.filter(function(file) {
                return vm.filter.showTitled || !file.title;
            });
            result = result.filter(function(file) {
                return vm.filter.showStarred || !file.stars;
            });
            result = result.filter(function(file) {
                return vm.filter.showDeleted || !file.isDeleted;
            });
            result = result.filter(function(file) {
                return vm.filter.showSubd || !(file.isSubd);
            });
            result = result.filter(function(file) {
                return !vm.found.files || vm.found.files.includes(file.id);
            });
            return result.sort(function(file1, file2) {
                var file1name = (file1.title != null ? file1.title : file1.name).toUpperCase();
                var file2name = (file2.title != null ? file2.title : file2.name).toUpperCase();
                return file1name.localeCompare(file2name);
            });
        }
    },
    methods: {
        loadFlat: function() {
            console.log('loading vol', this.vol.id);
            var vm = this;
            this.files = [{ name: "loading..." }];
            axios.get('/files/' + this.vol.id + '?mode=flat')
                .then(function (response) {
                    vm.flatFiles = response.data;
                    bus.$emit('files-loaded');
                })
                .catch(function (error) {
                    vm.files = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
            axios.get('/clips/' + this.vol.id + '?mode=flat')
                .then(function (response) {
                    vm.clips = response.data;
                    vm.clips.map((file) => {
                        file.isClip = true;
                    });
                    bus.$emit('files-loaded');
                })
                .catch(function (error) {
                    vm.clips = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        },
        loadTree: function() {
            var vm = this;
            this.files = [{ name: "loading..." }];
            axios.get('/dirs/' + this.vol.id)
                .then(function (response) {
                    vm.dirs = response.data;
                    bus.$emit('files-loaded');
                })
                .catch(function (error) {
                    vm.dirs = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
            axios.get('/files/' + this.vol.id)
                .then(function (response) {
                    vm.treeFiles = response.data;
                    bus.$emit('files-loaded');
                })
                .catch(function (error) {
                    vm.files = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        },
        toggle: function() {
            console.log('toggling', this.filter, this.filter.mode, this.flatFiles, this.treeFiles, this.files);
            if(this.filter.mode == 'vol' && this.flatFiles.length == 0) {
                this.loadFlat();
            }
            if(this.filter.mode == 'dir' && this.dirs.length == 0) {
                this.loadTree();
            }
            this.open = !this.open; 
        }
    }
});


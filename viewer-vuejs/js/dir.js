Vue.component('dir', {
    template: templates["dir"],
    data: function() { 
        return {
            clips: [],
            files: [],
            dirs: [],
            open: false,
            filter: {},
            found: {},
            containsFound: true
        } 
    },
    props: ['dir'],
    created: function() {
        console.log('dir created');
        var vm = this;
        bus.$on('file-filter-changed', function(filter) { 
            console.log('filter changed @dir', filter); 
            vm.filter = filter;
        });
        bus.$on('file-filter-text-changed', function(filterText) {
            console.log('filter text changed', filterText);
            if(filterText) {
                axios.get('/search/' + filterText)
                    .then(function (response) {
                        console.log('found', response.data); 
                        vm.found = response.data;
                        vm.containsFound = vm.found.parents.includes(vm.dir.id);
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
            if( this.filter.showClips) {
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
        load: function() {
            console.log('loading dir', this.dir.id);
            var vm = this;
            vm.dirs = [{ name: "loading dirs..." }];
            axios.get('/dirs/' + this.dir.id)
                .then(function (response) {
                    vm.dirs = response.data;
                    bus.$emit('files-loaded');
                })
                .catch(function (error) {
                    vm.dirs = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
            if(vm.dir.name != 'clips') {
                vm.files = [{ name: "loading files..." }];
                axios.get('/files/' + this.dir.id)
                    .then(function (response) {
                        vm.files = response.data;
                        bus.$emit('files-loaded');
                    })
                    .catch(function (error) {
                        vm.files = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                    });
            } 
            else {
                vm.clips = [{ name: "loading clips..." }];
                axios.get('/clips/' + this.dir.id)
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
            }
        },
        toggle: function() {
            console.log('toggling dir', this.filter.mode, this.dirs, this.files, this.clips);
            if(this.files.length == 0 || this.dirs.length == 0 || this.clips.length == 0) {
                this.load();
            }
            this.open = !this.open; 
            bus.$emit('select-dir', this.dir.id, this.dir);
        }
    }
});


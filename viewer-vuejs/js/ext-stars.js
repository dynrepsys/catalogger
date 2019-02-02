Vue.component('ext-stars', {
    template: templates["ext-stars"],
    data: function() {
        return { 
            show: false,
            starsFound: [],
            sortcol: 3, //cols: name, start, end, titles
            colorders: [1, -1, -1, -1] // asc = 1, desc = -1
        }
    },
    created: function() {
        var vm = this;
        bus.$on('tag-mode-changed', function(mode) {
            vm.show = (mode == 'stars');
        });
        bus.$on('star-search-entered', function(name) {
            vm.search(name);
        });
        bus.$on('select-ext-star', function(id, star, exclude) {
            console.log('select ext star', id, star, exclude);
            if(exclude) {
                for(let xstar of vm.starsFound) {
                    Vue.set(xstar, 'isSel', (xstar.id == id ? true : false));
                }
            }
            else {
                Vue.set(star, 'isSel', true);
            }
        });
    },
    mounted: function() {
        bus.$emit('table-ready', {});
    },
    computed: {
        sortedResults: function() {
            return this.starsFound.sort(this.compareStars);
        }
    },
    methods: {
        setSort: function(col, event) {
            if(this.sortcol != col) {
                this.sortcol = col;
            }
            else {
                Vue.set(this.colorders, col, this.colorders[col] * -1);
            }
        },
        sortGlyph: function(col) {
            if(this.sortcol == col) {
                return {
                    'glyphicon': true,
                    'glyphicon-triangle-top': (this.colorders[col] == 1),
                    'glyphicon-triangle-bottom': (this.colorders[col] == -1) 
                }
            }
        },
        compareStars: function(star1, star2) {
            switch(this.sortcol) {
                case 0:
                    return star1.name.toUpperCase().localeCompare(star2.name.toUpperCase()) * this.colorders[0];
                case 1:
                    return (star1.start == star2.start ? 0 : (star1.start < star2.start ? -1 : 1)) * this.colorders[1];
                case 2:
                    return (star1.end == star2.end ? 0 : (star1.end < star2.end ? -1 : 1)) * this.colorders[2];
                case 3:
                    var titles1 = Number(star1.titles), titles2 = Number(star2.titles);
                    return (titles1 == titles2 ? 0 : (titles1 < titles2 ? -1 : 1)) * this.colorders[3];
                default:
                    return 0;
            }
        },
        search: function(name) {
            var vm = this;
            this.starsFound = [{ name: "loading..." }];
            bus.$emit('select-ext-star', -1, null, true);
            axios.get('/findstars/' + name)
                .then(function (response) {
                    if(response.data.length > 0)
                        vm.starsFound = response.data;
                    else
                        vm.starsFound = [{ name: 'no results' }];

                    vm.starsFound.map((star, index) => {
                            star.id = index;
                            star.img = star.img.replace(/thumbs\/th_/,'')
                    });
                })
                .catch(function (error) {
                    vm.starsFound = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        }
    }
});



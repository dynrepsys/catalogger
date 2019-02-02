Vue.component('int-stars', {
    template: templates["int-stars"],
    data: function() {
        return { 
            show: false,
            stars: [],
            starFilter: "",
            sortcol: 1, //cols: name, start, end, titles
            colorders: [1, -1, -1, -1] // asc = 1, desc = -1
        }
    },
    created: function() {
        var vm = this;
        bus.$on('tag-mode-changed', function(mode) {
            vm.show = (mode == 'stars');
        });
        bus.$on('select-int-star', function(id, star) {
            for(let istar of vm.stars) {
                Vue.set(istar, 'isSel', (istar.id == id ? true : false));
            }
        });
        bus.$on('refresh-int-stars', this.loadStars);
        bus.$on('star-search-changed', function(starFilter) {
                vm.starFilter = starFilter;
        });
    },
    mounted: function() {
        this.loadStars();
    },
    computed: {
        filteredStars: function() {
            var result = this.stars;
            var vm = this;
            
            if(this.starFilter != "") {
                result = result.filter(function(star) {
                   return star.name.toUpperCase().indexOf(vm.starFilter.toUpperCase()) > -1;
                });
            }
          
            return result.sort(this.compareStars);
        }
    },
    methods: {
        loadStars: function() {
            this.stars = [{ name: "loading..." }];
            var vm = this;
            axios.get('/stars')
                .then(function (response) {
                    vm.stars = response.data;
                    bus.$emit('table-ready', {});
                })
                .catch(function (error) {
                    vm.stars = [{ name: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        },
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
        }
    }
});




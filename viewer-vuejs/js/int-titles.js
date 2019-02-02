Vue.component('int-titles', {
    template: templates["int-titles"],
    data: function() {
        return { 
            show: false,
            titles: [],
            titleFilter: "",
            sortcol: 1, //cols: name, start, end, titles
            colorders: [1, -1, -1, -1] // asc = 1, desc = -1
        }
    },
    created: function() {
        var vm = this;
        bus.$on('tag-mode-changed', function(mode) {
            vm.show = (mode == 'titles');
        });
        bus.$on('select-int-title', function(id, title) {
            for(let ititle of vm.titles) {
                    Vue.set(ititle, 'isSel', (ititle.id == id ? true : false));
            }
        });
        bus.$on('refresh-int-titles', this.loadTitles);
        bus.$on('title-search-changed', function(titleFilter) {
                vm.titleFilter = titleFilter;
        });
    },
    mounted: function() {
        this.loadTitles();
    },
    computed: {
        filteredTitles: function() {
            var result = this.titles;
            var vm = this;
            if(this.searchText != "") {
                result = result.filter(function(title) {
                   return title.title.toUpperCase().indexOf(vm.titleFilter.toUpperCase()) > -1;
                });
            }
            return result.sort(this.compareTitles);
        }
    },
    methods: {
        loadTitles: function() {
            this.titles = [{ title: "loading..." }];
            var vm = this;
            axios.get('/titles')
                .then(function (response) {
                    vm.titles = response.data;
                })
                .catch(function (error) {
                    vm.titles = [{ title: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
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
        compareTitles: function(title1, title2) {
            switch(this.sortcol) {
                case 0:
                    return title1.title.toUpperCase().localeCompare(title2.title.toUpperCase()) * this.colorders[0];
                case 1:
                    return (title1.year == title2.year ? title1.title.toUpperCase().localeCompare(title2.title.toUpperCase()) : (title1.year < title2.year ? -1 : 1)) * this.colorders[1];
                default:
                    return 0;
            }
        }
    }
});

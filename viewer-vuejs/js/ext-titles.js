Vue.component('ext-titles', {
    template: templates["ext-titles"],
    data: function() {
        return { 
            show: false,
            titlesFound: [],
            sortcol: 1, //cols: title, year
            colorders: [1, -1] // asc = 1, desc = -1
        }
    },
    created: function() {
        var vm = this;
        bus.$on('tag-mode-changed', function(mode) {
            vm.show = (mode == 'titles');
        });
        bus.$on('title-search-entered', function(name) {
            vm.search(name);
        });
        bus.$on('select-ext-title', function(id, title, exclude) {
            console.log('select ext title', id, title, exclude);
            if(exclude) {
                for(let xtitle of vm.titlesFound) {
                    Vue.set(xtitle, 'isSel', (xtitle.id == id ? true : false));
                }
            }
            else {
                Vue.set(title, 'isSel', true);
            }
        });
    },
    mounted: function() {
        bus.$emit('table-ready', {});
    },
    computed: {
        sortedResults: function() {
            return this.titlesFound.sort(this.compareTitles);
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
        compareTitles: function(title1, title2) {
            switch(this.sortcol) {
                case 0:
                    return title1.title.toUpperCase().localeCompare(title2.title.toUpperCase()) * this.colorders[0];
                case 1:
                    return (title1.year == title2.year ? title1.title.toUpperCase().localeCompare(title2.title.toUpperCase()) : (title1.year < title2.year ? -1 : 1)) * this.colorders[1];
                default:
                    return 0;
            }
        },
        search: function(title) {
            var vm = this;
            this.titlesFound = [{ title: "loading..." }];
            bus.$emit('select-ext-title', -1, null, true);
            axios.get('/findtitles/' + title, { timeout: 20000 })
                .then(function (response) {
                    if(response.data.length > 0)
                        vm.titlesFound = response.data;
                    else
                        vm.titlesFound = [{ title: 'no results' }];

                    vm.titlesFound.map((title, index) => {
                            title.id = index;
                    });
                })
                .catch(function (error) {
                    vm.titlesFound = [{ title: 'Error! Could not reach the API. ' + JSON.stringify(error) }];
                });
        }
    }
});

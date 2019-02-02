var bus = new Vue({
    created: function() {
        console.log('new bus');
    }
});

var app = new Vue({
    el: '#app',
    data: {
        linkFiles: [],
        importTitles: [],
        linkTitle: null,
        linkStar: null,
        linkTag: null,
        unlinkFileTag: null
    },
    created: () => {
        var vm = this;
        bus.$on('file-filter-changed', (filter) => { return console.log('filter changed @app', filter) });
        bus.$on('select-file', function(id, file, exclude) {
            if(exclude) 
                vm.linkFiles = [];
            if(file)
                vm.linkFiles.push(file);
        });
        bus.$on('select-ext-title', function(id, title, exclude) {
            if(exclude) 
                vm.importTitles = [];
            if(title)
                vm.importTitles.push(title);
        });
        bus.$on('import-ext-titles', function() {
            console.log(vm.importTitles);
            for(let t of vm.importTitles) {
                var titleid = encodeURIComponent(t.url.split('/')[1].split('=')[1]);
                var movieid = t.buymovie.split('=')[1];
                axios.post('/title?title=' + t.title + '&studio=' + t.studio + '&year=' + t.year + '&titleid=' + titleid + '&movieid=' + movieid)
                    .then(function(response) {
                        console.log('success', response);
                        //vm.loadTitles();
                        Vue.set(t, 'inDb', true);
                        console.log('imported title', t);
                        bus.$emit('refresh-int-titles');
                    })
                    .catch(function(error) {
                        console.log('error', error);
                    });
            }
            
        });
        bus.$on('select-int-title', function(id, title) {
            vm.linkTitle = title;
        });
        bus.$on('link-title', function() {
            console.log(vm.linkFiles, vm.linkTitle);
            if(vm.linkFiles.length > 0 && vm.linkTitle) {
                for(let f of vm.linkFiles) {
                    //var filemd5 = md5;
                    axios.post('/filetitle?filemd5=' + f.md5 + '&titleid=' + vm.linkTitle.id)
                        .then(function(response) {
                            //var onetitle = vm.titles.filter(function(title){ return title.id == vm.$parent.selectedTitles[0] });
                            //bus.$emit('title-linked', { md5: md5, title: onetitle[0].title });
                            f.title = linkTitle.title;
                            console.log('link success', f, vm.linkTitle, response);
                        })
                        .catch(function(error) {
                            console.log('error', error);
                        });
                }
            }
        });
        bus.$on('select-ext-star', function(id, star, exclude) {
            if(exclude) 
                vm.importStars = [];
            if(star)
                vm.importStars.push(star);
        });
        bus.$on('import-ext-stars', function() {
            console.log(vm.importStars);
            for(let s of vm.importStars) {
                //var titleid = encodeURIComponent(t.url.split('/')[1].split('=')[1]);
                //var movieid = t.buymovie.split('=')[1];
                var perfid = s.url.split('/')[2].split('=')[1];
                var perfname = s.url.split('/')[4].split('.')[0];
                axios.post('/star?name=' + encodeURIComponent(s.name) + '&perfid=' + perfid + '&perfname=' + perfname + '&start=' + s.start + '&end=' + s.end + '&titles=' + s.titles + '&imgsrc=' + encodeURIComponent(s.img))
                    .then(function(response) {
                        console.log('success', response);
                        //vm.loadTitles();
                        Vue.set(s, 'inDb', true);
                        console.log('imported star', s);
                        bus.$emit('refresh-int-stars');
                    })
                    .catch(function(error) {
                        console.log('error', error);
                    });
            }
            
        });
        bus.$on('select-int-star', function(id, star) {
            vm.linkStar = star;
        });
        bus.$on('link-star', function() {
            console.log(vm.linkFiles, vm.linkStar);
            if(vm.linkFiles.length > 0 && vm.linkStar) {
                for(let f of vm.linkFiles) {
                    axios.post('/filestar?filemd5=' + f.md5 + '&starid=' + vm.linkStar.id)
                        .then(function(response) {
                            console.log('link success', f, vm.linkStar, response);
                        })
                        .catch(function(error) {
                            console.log('error', error);
                        });
                }
            }
        });
        bus.$on('select-tag', function(id, tag) {
            vm.linkTag = tag;
        });
        bus.$on('select-file-tag', function(id, tag) {
            vm.unlinkFileTag = tag;
        });
        bus.$on('link-tag', function() {
            console.log(vm.linkFiles, vm.linkTag);
            if(vm.linkFiles.length > 0 && vm.linkTag) {
                for(let f of vm.linkFiles) {
                    axios.post('/filetag?filemd5=' + f.md5 + '&tagid=' + vm.linkTag.id)
                        .then(function(response) {
                            console.log('link success', f, vm.linkTag, response);
                            f.tags++;
                            bus.$emit('select-file', f.id, f, true);
                        })
                        .catch(function(error) {
                            console.log('error', error);
                        });
                }
            }
        });
        bus.$on('unlink-tag', function() {
            console.log(vm.linkFiles, vm.linkTag);
            if(vm.linkFiles.length > 0 && vm.unlinkFileTag) {
                for(let f of vm.linkFiles) {
                    axios.delete('/filetag?filemd5=' + f.md5 + '&tagid=' + vm.unlinkFileTag.id)
                        .then(function(response) {
                            console.log('unlink success', f, vm.unlinkFileTag, response);
                            f.tags--;
                            bus.$emit('select-file', f.id, f, true);
                        })
                        .catch(function(error) {
                            console.log('error', error);
                        });
                }
            }
        });
    }
});



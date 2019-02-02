Vue.component('file-footer', {
    template: templates['file-footer'],
    data: function() { 
        return { 
            selectedFiles: [],
            selectedDir: undefined
        } 
    },
    created: function() {
        var vm = this;
        bus.$on('select-file', function(id, file, exclude) {
            if(exclude) 
                vm.selectedFiles = [];
            if(id >= 0)
                vm.selectedFiles.push(id);
        });
        bus.$on('select-dir', function(id, dir) { // exclude not used but reserved
            if(id >= 0)
                vm.selectedDir = id;
        });
    }
});



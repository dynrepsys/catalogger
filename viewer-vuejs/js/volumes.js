Vue.component('volumes', {
    template: templates["volumes"],
    data: function() {
        return { 
            volumes: []
        }
    },
    created: function() {
    },
    mounted: function(){
        var vm = this;
        axios.get('/volumes')
            .then(function (response) {
                vm.volumes = response.data;
                vm.$nextTick(function () {
                    console.log('emitting volumes loaded');
                    bus.$emit('volumes-loaded');
                })
            })
            .catch(function (error) {
                vm.volumes = [{ name: 'Error! Could not reach the API. ' + error }];
            });
    },
    methods: {
    }
});


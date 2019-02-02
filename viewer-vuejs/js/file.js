Vue.component('file', {
    template: templates["file"],
    data: function() { 
        return {
            frames: [],
            open: false
        } 
    },
    props: ['file'],
    created: function() {
    },
    computed: {
        prefName: function() {
            return this.file.title || this.file.name;
        },
        frameImgs: function() {
            var imgs = "";
            for(var frame of this.frames) {
                imgs += '<img src="' + frame.src + '"/>';
            }
            return imgs;
        }
    },
    methods: {
        select: function(id, event) {
            bus.$emit('select-file', id, this.file, !event.ctrlKey );
        },
        toggleFrames: function() {
            if(this.frames.length == 0) {
                var vm = this;
                axios.get('/file/' + this.file.md5 + '/frames')
                    .then(function (response) {
                        vm.frames = response.data;
                    })
                    .catch(function (error) {
                        console.log('error', error);
                    });
            }
            this.open = !this.open;
        }
    }
});


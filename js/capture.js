var toolbar = new Vue({
    el: '#toolbar',
    data: {
        style: {top: 200, left: 200}
    },
    methods: {
        
    }
});

var page = (function () {
    var bgCanvas  = document.getElementById('canvas');
    var bgCTX = bgCanvas.getContext('2d');
    var _img = new Image();
    return {
        ratio: window.devicePixelRatio,
        setDimensions: function (_width, _height) {
            var width = _width / page.ratio;
            var height = _height / page.ratio;
            page.width = _width;
            page.height = _height;
            if (bgCanvas) {
                bgCanvas.width =  _width;
                bgCanvas.height =  _height;
                bgCanvas.style.width =  width+ 'px';
                bgCanvas.style.height =  height+ 'px';
            }
        },
        init: function () {
            var self = this;
            _img.onload = function () {
                self.setDimensions(_img.width, _img.height);
                bgCTX.drawImage(_img, 0, 0, self.width, self.height);
            }
            _img.src = UTILS.getBKData('lastCaptureImg');
        }
    }
})();
page.init();




//document.querySelector('#myImg').src = UTILS.getBKData('lastCaptureImg');



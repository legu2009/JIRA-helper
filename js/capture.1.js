require.config({
    packages: [{
        name: 'zrender',
        location: 'zrender',
        main: 'zrender'
    }]
});
var toolbar = new Vue({
    el: '#toolbar',
    data: {
        style: {
            top: 200, 
            left: 200
        },
        status: ''
    },
    ready: function () {
        this.onReady();
    },
    methods: {
        btnClick: function (type) {
            var map = {rect: 1, line: 1, text: 1};
            if (map[type]) {
                if (this.status == type) {
                    this.status = '';
                } else {
                    this.status = type;
                }
            }
        },
        onReady: function () {
            var self = this;
            var drag = {
                btop: 0,
                bleft: 0,
                bx: 0,
                by: 0,
                isDrag: false
            };
            var warper = this.$el;
            $(warper).on('mousedown', function (event) {
                if (event.target == warper) {
                    drag.isDrag = true;
                    drag.btop = self.style.top;
                    drag.bleft = self.style.left;
                    drag.bx = event.clientX;
                    drag.by = event.clientY;
                }  
            })
            $(document).on('mousemove', function (event) {
                if (drag.isDrag) {
                    self.style.top = drag.btop + event.clientY - drag.by;
                    self.style.left = drag.bleft + event.clientX - drag.bx;
                }
            }).on('mouseup', function () {
                drag.isDrag = false;
            });
        }
    }
});

var page = (function () {
    var bgCanvas  = document.getElementById('canvas');
    var bgMain = document.getElementById('mainCanvas');
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
                bgMain.style.width = bgCanvas.style.width =  width + 'px';
                bgMain.style.height =bgCanvas.style.height =  height + 'px';
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



require([
    'zrender',
    'zrender/graphic/shape/Circle',
    'zrender/graphic/shape/Rect',
    'zrender/container/Group',
    'zrender/graphic/Path',
    'zrender/graphic/shape/Polyline'
], function(zrender, Circle, Rect, Group, Path, Polyline){
    
    function RectG(zr, shape) {
        this.shape = shape;
        var self = this;
        var drag = this.drag = {
            state: '',
            dragend: function () {
                drag.state = '';
            },
            dragCircle: function () {
                drag.state = 'group_xy';
            },
            ondriftCircle: function (dx, dy, e) {
                var res = {dx: dx, dy: dy};
                var rect = self.rect;
                var _shape = $.extend({}, rect.shape);

                if (drag.state == 'group_move') {
                    _shape.x += res.dx;
                    _shape.y += res.dy;
                    self.setShape(_shape);
                    return false;
                }

                if (drag.state == 'group_xy' && (this.circlePos == 'b' || this.circlePos == 't')) {
                    res = {dx: 0, dy: dy};
                } else if (drag.state == 'group_xy' && this.circlePos[0] == 'c') {
                    res = {dx: dx, dy: 0};
                }
                
                if (this.circlePos[0] == 'b') {
                    _shape.height += res.dy;
                }
                if (this.circlePos[0] == 't') {
                    _shape.y += res.dy;
                    _shape.height += -1 * res.dy;
                }
                if (this.circlePos[1] == 'l') {
                    _shape.x += res.dx
                    _shape.width += -1 * res.dx
                }
                if (this.circlePos[1] == 'r') {
                    _shape.width += res.dx
                }
                self.setShape(_shape);
                return false;
            }
        }
    }
    RectG.prototype = {
        config: {
            style: {
                rect: {
                    fill: 'none',
                    stroke: '#ed5026',
                    lineWidth: 2,
                },
                circle: {
                    fill: 'white',
                    stroke: '#ed5026',
                    lineWidth: 2,
                }
            }
        },
        setShape: function (_shape) {
            var shape = $.extend(this.shape, _shape);
            this.rect.setShape(shape);

            //if (circlePos != 'tl')
                this.circles.tl.setShape({
                    cx: shape.x,
                    cy: shape.y
                });
            //if (circlePos != 't')
                this.circles.t.setShape({
                    cx: shape.x + shape.width/2,
                    cy: shape.y
                });
            //if (circlePos != 'tr')
                this.circles.tr.setShape({
                    cx: shape.x + shape.width,
                    cy: shape.y
                });
            //if (circlePos != 'cl')
                this.circles.cl.setShape({
                    cx: shape.x,
                    cy: shape.y + shape.height/2
                });
            //if (circlePos != 'cr')
                this.circles.cr.setShape({
                    cx: shape.x + shape.width,
                    cy: shape.y + shape.height/2
                });
            //if (circlePos != 'bl')
                this.circles.bl.setShape({
                    cx: shape.x,
                    cy: shape.y + shape.height
                });
            //if (circlePos != 'b')
                this.circles.b.setShape({
                    cx: shape.x + shape.width/2,
                    cy: shape.y + shape.height
                });
            //if (circlePos != 'br')
                this.circles.br.setShape({
                    cx: shape.x + shape.width,
                    cy: shape.y + shape.height
                });
        },
        draw: function () {
            var shape = this.shape;
            var style = this.config.style;
            var drag = this.drag;
    
            var group = this.group = new Group();
            this.rect = new Rect({
                shape: shape,
                style : style.rect,
                draggable: true,
                ondrift: drag.ondriftCircle,
                onmousedown: function (e) {
                    e.event.stopPropagation();
                },
                ondragstart: function () {
                    drag.state = 'group_move';
                },
                ondragend: drag.dragend
            });
            
            var circleAttr = {
                shape: {
                    r: 4
                },
                style : style.circle,
                draggable: true,
                onmousedown: function (e) {
                    e.event.stopPropagation();
                },
                ondragstart: drag.dragCircle,
                ondragend: drag.dragend,
                ondrift: drag.ondriftCircle
            };
            
            this.circles = {
                tl: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x,
                        cy: shape.y
                    },
                    cursor: 'nw-resize',
                    circlePos: 'tl'
                })),
                t: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x + shape.width/2,
                        cy: shape.y
                    },
                    cursor: 'n-resize',
                    circlePos: 't'
                })),
                tr: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x + shape.width,
                        cy: shape.y
                    },
                    cursor: 'ne-resize',
                    circlePos: 'tr'
                })),
                cl: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x,
                        cy: shape.y + shape.height/2
                    },
                    cursor: 'w-resize',
                    circlePos: 'cl'
                })),
                cr: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x + shape.width,
                        cy: shape.y + shape.height/2
                    },
                    cursor: 'e-resize',
                    circlePos: 'cr'
                })),
                bl: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x,
                        cy: shape.y + shape.height
                    },
                    cursor: 'sw-resize',
                    circlePos: 'bl'
                })),
                b: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x + shape.width/2,
                        cy: shape.y + shape.height
                    },
                    cursor: 's-resize',
                    circlePos: 'b'
                })),
                br: new Circle($.extend(true, {}, circleAttr, {
                    shape: {
                        cx: shape.x + shape.width,
                        cy: shape.y + shape.height
                    },
                    cursor: 'se-resize',
                    circlePos: 'br'
                }))
            }
            group.add(this.rect);
            for (var key in this.circles) {
                group.add(this.circles[key]);
            }
            zr.add(group);
            return this;
        },
        cMove: function (event) {
            this.setShape({
                width : event.clientX - this.shape.x,
                height: event.clientY - this.shape.y,
            });
        }
    };

    
    
    function LineG(zr, shape) {
        this.shape = shape;
    }
    LineG.prototype = {
        config: {
            style: {
                stroke: '#ed5026',
                lineWidth: 2
            }
        },
        lineTo: function (point) {
            this.shape.points.push(point);
            this.line.setShape(this.shape);
        },
        draw: function () {
            var shape = this.shape;
            var style = this.config.style;
            var group = this.group = new Group();
            this.line = new Polyline({
                shape: this.shape,
                style: style,
                draggable: true,
                onmousedown: function (e) {
                    e.event.stopPropagation();
                }
            })
            group.add(this.line);
            zr.add(group);
            return this;
        },
        cMove: function (event) {
            this.lineTo([event.clientX, event.clientY]);
        }
    };

    

    var hideInput = (function () {
        var $hideInput = $('<div class="hide-div-input" contenteditable="true"></div>').appendTo('body');
        $hideInput.on('keydown', function () {
            if (hideInput.proxy) {
                hideInput.proxy.reWidth(this.clientWidth + 10);
            }
        }).on('blur', function () {
            if (hideInput.proxy) {
                hideInput.proxy.blur();
            }
        })
        return {
            $elm: $hideInput,
            focus: function (top, left, proxy) {
                if (this.proxy) return;

                proxy.showBorder();
                this.proxy = proxy;
                this.val(proxy.text);
                proxy.html('');
                this.$elm.css({top: top, left: left}).show();
                setTimeout(function() {
                    hideInput.$elm.focus();
                }, 100);
            },
            val: function (text) {
                if (text !== void 0) {
                    return $hideInput.html(text);
                } else {
                    return $hideInput.html();
                }
            }
        }
    })();

    function InputG(zr, shape, text) {
        this.zr = zr;
        shape.width = 30;
        shape.height = 32;
        shape.y -= 32/2;
        shape.x -= 6;
        this.text = text || '';
        this.shape = shape;
    }
    InputG.prototype = {
        reWidth: function (width) {
            if (width < 30) {
                width = 30;
            }
            this.setShape({width : width});
        },
        config: {
            style: {
                fill: 'transparent',
                stroke: '#ed5026',
                lineWidth: 1,
                text : '',
                textPosition : 'insideLeft'
            }
        },
        setShape: function (_shape) {
            var shape = $.extend(this.shape, _shape);
            this.rect.setShape(shape);
        },
        draw: function () {
            var self = this;
            var shape = this.shape;
            var style = this.config.style;
            style.text = this.text;
            var group = this.group = new Group();

            var _ondrift = function (dx, dy, e) {
                var res = {dx: dx, dy: dy};
                var rect = self.rect;
                var _shape = $.extend({}, self.shape);
                _shape.x += res.dx;
                _shape.y += res.dy;
                self.setShape(_shape);
                return false;
            };
            this.rect = new Rect({
                shape: shape,
                style : style,
                draggable: true,
                ondrift: _ondrift,
                onmousedown: function (e) {
                    e.event.stopPropagation();
                },
                onclick: function (e) {
                    e.event.stopPropagation();
                },
                ondblclick: function () {
                    hideInput.focus(shape.y, shape.x, self);
                }
            });
            group.add(this.rect);
            zr.add(group);

            hideInput.focus(shape.y, shape.x, this);
            return this;
        },
        html: function (text) {
            this.rect.setStyle({
                text: text
            })
        },
        hideBorder: function (){
            this.rect.setStyle({
                stroke: 'transparent'
            })
        },
        showBorder: function (){
            this.rect.setStyle({
                stroke: '#ed5026'
            })
        },
        blur: function () {
            this.text = hideInput.val();
            if (this.text == '') {
                this.remove();
            } else {
                this.html(this.text);
            }
            hideInput.$elm.hide();
            hideInput.val('');
            this.hideBorder();
            hideInput.proxy = null;

        },
        remove: function () {
            this.zr.remove(this.group);
        },
        cMove: function (event) {
            
        }
    }

    var zr = zrender.init(document.getElementById("mainCanvas"));
    var _addShap;
    $('#mainCanvas').on('mousedown', function (event) {
        console.log(toolbar.status)
        if (toolbar.status === 'rect') {
            _addShap = new RectG(zr, {
                x : event.clientX,
                y : event.clientY,
                width : 1,
                height: 1
            }).draw();
        } else if (toolbar.status === 'line') {
            _addShap = new LineG(zr, {
                points: [[event.clientX, event.clientY]]
            }).draw();
        } else if (toolbar.status === 'text') {
            if (hideInput.proxy) {
                _addShap = null;
            } else {
                _addShap = new InputG(zr, {
                    x : event.clientX + document.body.scrollLeft,
                    y : event.clientY + document.body.scrollTop,
                }).draw();
            }
        }        
    }).on('mousemove', function (event) {
        if (_addShap) {
            _addShap.cMove(event);
        }
    }).on('mouseup', function () {
        _addShap = null;
    });
})



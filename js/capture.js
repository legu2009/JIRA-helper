require.config({
    packages: [{
        name: 'zrender',
        location: 'zrender',
        main: 'zrender'
    }]
});

require([
    'zrender',
    'zrender/graphic/shape/Circle',
    'zrender/graphic/shape/Rect',
    'zrender/container/Group',
    'zrender/graphic/Path',
    'zrender/graphic/shape/Polyline'
], function(zrender, Circle, Rect, Group, Path, Polyline){
    var doc = document, $doc = $(doc), body = doc.body;
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
                $doc.on('mousemove', function (event) {
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

    var __stopMousedown =  function (e) {
        e.event.stopPropagation();
    };
 
    function RectG(board, shape) {
        this.board = board;
        this.shape = shape;
        var self = this;
        var drag = this.drag = {
            state: '',
            dragend: function () {
                drag.state = '';
                self.board.addRecord();
            },
            dragCir: function () {
                drag.state = 'group_xy';
            },
            ondriftCir: function (dx, dy, e) {
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
        };
        this._draw();
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
        focus: function () {
            for (var key in this.circles) {
                this.circles[key].setStyle({
                    stroke: '#ed5026',
                    fill: 'white'
                });
            }
        },
        toRecord: function () {
            return $.extend(true, {}, {shape: this.shape});
        },
        blur: function () {
            for (var key in this.circles) {
                this.circles[key].setStyle({
                    stroke: 'transparent',
                    fill: 'transparent'
                });
            }
        },
        getCirShape: function (type, shape) {
            var res = {};
            if (type[0] == 't') {
                res.cy = shape.y;
            }
            if (type[0] == 'c') {
                res.cy = shape.y + shape.height/2;
            }
            if (type[0] == 'b') {
                res.cy = shape.y + shape.height;
            }
            if (type[1] == 'l') {
                res.cx = shape.x;
            }
            if (type[1] == 'r') {
                res.cx = shape.x + shape.width;
            }
            if (!type[1]) {
                res.cx = shape.x + shape.width/2;
            }
            return res;
        },
        getCirCursor: function (type) {
            var res = '';
            if (type[0] == 't') {
                res += 'n';
            } 
            if (type[0] == 'b'){
                res += 's';
            }
            if (type[1] == 'l') {
                res += 'w';
            }
            if (type[0] == 'r') {
                res += 'e';
            }
            return res + '-resize';
        },
        setShape: function (_shape) {
            var shape = $.extend(this.shape, _shape);
            var getCirShape = this.getCirShape;
            this.rect.setShape(shape);
            for (var key in this.circles) {
                this.circles[key].setShape(getCirShape(key, shape));
            }
            
        },
        _draw: function () {
            var self = this;
            var shape = this.shape;
            var style = this.config.style;
            var drag = this.drag;
            var group = this.group = new Group();
            var getCirCursor = this.getCirCursor;
            var getCirShape = this.getCirShape;
            var _stopMousedown = this.board.getMousedown(this);

            this.id = group.id;
            var circleAttr = {
                shape: {
                    r: 4
                },
                style : style.circle,
                draggable: true,
                onmousedown: _stopMousedown,
                ondragstart: drag.dragCir,
                ondragend: drag.dragend,
                ondrift: drag.ondriftCir
            };

            this.rect = new Rect({
                shape: shape,
                style : style.rect,
                draggable: true,
                ondrift: drag.ondriftCir,
                onmousedown: _stopMousedown,
                ondragstart: function () {
                    drag.state = 'group_move';
                },
                ondragend: drag.dragend
            });
            group.add(this.rect);
            var circles = this.circles = {};
            _.forEach('tl,t,tr,cl,cr,bl,b,br'.split(','), function (key) {
                circles[key] = new Circle($.extend(true, {}, circleAttr, {
                    shape: getCirShape(key, shape),
                    cursor: getCirCursor(key),
                    circlePos: key
                }));
                group.add(circles[key]);
            })
            this.board.add(this);
        },
        drawMove: function (event) {
            this.setShape({
                width : event.x - this.shape.x,
                height: event.y - this.shape.y,
            });
        }
    };

    function LineG(board, shape) {
        this.board = board;
        this.shape = shape;
        this.position = [0, 0];
        this._draw()
    }
    LineG.prototype = {
        config: {
            style: {
                stroke: '#ed5026',
                lineWidth: 2
            }
        },
        focus: _.noop,
        blur: _.noop,
        lineTo: function (point) {
            this.shape.points.push(point);
            this.line.setShape(this.shape);
        },
        toRecord: function () {
            return $.extend(true, {}, {shape: this.shape, position: this.position});
        },
        _draw: function () {
            var style = this.config.style;
            var group = this.group = new Group();
            var _stopMousedown = this.board.getMousedown(this);
            var self = this;
            this.id = group.id;
            var line = this.line = new Polyline({
                shape: this.shape,
                style: style,
                draggable: true,
                onmousedown: _stopMousedown,
                ondragend: function () {
                    self.position = line.position;
                    self.board.addRecord();
                }
            })
            group.add(this.line);
            this.board.add(this);
        },
        drawMove: function (event) {
            this.lineTo([event.x, event.y]);
        }
    };



    var hideInput = (function () {
        var $hideInput = $('<div class="hide-div-input" contenteditable="true"></div>').appendTo('body');
        $hideInput.on('keydown', function () {
            if (hideInput.proxy) {
                hideInput.proxy.reWidth(this.clientWidth + 10);
            }
        }).on('keyup', function () {
            if (hideInput.proxy) {
                hideInput.proxy.reText(this.innerText);
            }
        })
        return {
            $elm: $hideInput,
            focus: function (top, left, proxy) {
                //if (this.proxy) return false;
                this.proxy = proxy;
                this.val(proxy.text);
                this.$elm.css({top: top, left: left}).show();
                $hideInput.focus();
                return true;
            },
            blur: function () {
                $hideInput.hide();
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

    function InputG(board, shape, text) {
        shape.width = 30;
        shape.height = 32;
        shape.y -= 32/2;
        shape.x -= 6;
        this.firstCreate = true;
        this.board = board;
        this.shape = shape;
        this.text = text || '';
        this._draw()
    }
    InputG.prototype = {
        reWidth: function (width) {
            if (width < 30) {
                width = 30;
            }
            this.setShape({width : width});
        },
        reText: function (text) {
            this.text = text;
        },
        toRecord: function () {
            return $.extend(true, {text: this.text}, {shape: this.shape})
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
        _draw: function () {
            var self = this;
            var shape = this.shape;
            var style = this.config.style;
            var group = this.group = new Group();
            this.id = group.id;
            var _ondrift = function (dx, dy, e) {
                var res = {dx: dx, dy: dy};
                var rect = self.rect;
                var _shape = $.extend({}, self.shape);
                _shape.x += res.dx;
                _shape.y += res.dy;
                self.setShape(_shape);
                return false;
            };
            var _stopMousedown = this.board.getMousedown(this);
            
            
            style.text = this.text;
            this.rect = new Rect({
                shape: shape,
                style : style,
                draggable: true,
                ondrift: _ondrift,
                onmousedown: _stopMousedown,
                onclick: __stopMousedown,
                ondblclick: function () {
                    hideInput.focus(shape.y, shape.x, self);
                    self.rect.setStyle({
                        text: ''
                    })
                },
                ondragend: function () {
                    self.board.addRecord();
                }
            });
            group.add(this.rect);
            this.board.add(this);

            this.focus();
            hideInput.focus(shape.y, shape.x, this);
        },
        focus: function () {
            var shape = this.shape;
            this.rect.setStyle({
                stroke: '#ed5026'
            })
            //hideInput.focus(shape.y, shape.x, this);
        },
        blur: function () {
            var text = this.text;
            console.log(this.firstCreate);
            this.firstCreate = false;
            if (text == '') {
                this.remove();
            } else {
                this.rect.setStyle({
                    stroke: 'transparent',
                    text: text
                })
                hideInput.blur();
            }
            if (hideInput.proxy == this) {
                hideInput.proxy = null;
            }
        },
        remove: function () {
            this.board.remove(this);
        },
        drawMove: function (event) {
            
        }
    };



    var drawBoard = (function () {
        var frontCanvas = document.getElementById('frontCanvas');
        var zr = zrender.init(frontCanvas);
        var _activeGElm = null;
        var GMaps = {};
        var showGMaps = {};
        return {
            records: [],
            recordIndex: -1,
            addRecord: function () {
                var record = {};
                for (var id in showGMaps) {
                    record[id] =  showGMaps[id].toRecord();
                }
                this.records.push(record);
                this.recordIndex = this.records.length - 1;
                console.log(this.records);
            },
            toolbar: toolbar,
            getMousedown: function (gELm) {
                return function (e) {
                    if (_activeGElm) {
                        _activeGElm.blur();
                        _activeGElm = null;
                    }
                    gELm.focus();
                    _activeGElm = gELm;
                    e.event.stopPropagation();
                };
            },
            resize: function (width, height) {
                frontCanvas.style.width = width + 'px';
                frontCanvas.style.height = height + 'px';
                zr.resize(width, height);
            },
            add: function (gELm) {
                showGMaps[gELm.id] = GMaps[gELm.id] = gELm;
                zr.add(gELm.group);
            },
            remove: function (gELm) {
                zr.remove(gELm.group);
                showGMaps[gELm.id] = null;
                this.addRecord();
            },
            creatGroup: function (status, event) {
                var x = event.clientX + body.scrollLeft;
                var y = event.clientY + body.scrollTop;
                if (status === 'rect') {
                    return new RectG(this, {
                        x : x,
                        y : y,
                        width : 1,
                        height: 1
                    });
                } else if (status === 'line') {
                    return new LineG(this, {
                        points: [[x, y]]
                    });
                } else if (status === 'text') {
                    if (hideInput.proxy) {
                        return null;
                    } else {
                        return new InputG(this, {
                            x : x,
                            y : y,
                        });
                    }
                }
            },
            init: function () {
                var _addShap;
                var self = this;
                $(frontCanvas).on('mousedown', function (event) {
                    _addShap = self.creatGroup(toolbar.status, event);
                    if (_activeGElm) {
                        _activeGElm.blur();
                        _activeGElm = null;
                    }
                    if (_addShap) {
                        _activeGElm = _addShap;
                    }
                    return false;
                }).on('mousemove', function (event) {
                    if (_addShap) {
                        _addShap.drawMove({
                            x: event.clientX + body.scrollLeft,
                            y: event.clientY + body.scrollTop
                        });
                    }
                }).on('mouseup', function () {
                    if (_addShap) {
                        self.addRecord();
                        _addShap = null;
                    }
                });
                $doc.on('mousedown', function (event) {
                    if (_activeGElm) {
                        _activeGElm.blur();
                        _activeGElm = null;
                    }
                }).on('keydown', function (event) {
                    if (event.target == body && event.which === 8 ) {
                        if (_activeGElm) {
                            self.remove(_activeGElm);
                        }
                    }
                })
            }
        }
    })();


    var page = (function () {
        var bgCanvas  = document.getElementById('bgCanvas');
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
                    bgCanvas.style.width =  width + 'px';
                    bgCanvas.style.height =  height + 'px';
                    drawBoard.resize(width, height);
                }
            },
            init: function () {
                var self = this;
                _img.onload = function () {
                    self.setDimensions(_img.width, _img.height);
                    bgCTX.drawImage(_img, 0, 0, self.width, self.height);
                }
                _img.src = UTILS.getBKData('lastCaptureImg');
                drawBoard.init();
            }
        }
    })();
    page.init();
})



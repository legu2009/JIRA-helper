require.config({
    packages: [{
        name: 'zrender',
        location: 'zrender',
        main: 'zrender'
    }]
});

var base64decode = (function () {
    function c(d) {
        return d > 64 && d < 91 ? d - 65 : d > 96 && d < 123 ? d - 71 : d > 47 && d < 58 ? d + 4 : d === 43 ? 62 : d === 47 ? 63 : 0
    }
    var b = function(f) {
        var m = f.replace(/[^A-Za-z0-9\+\/]/g, "")
          , g = m.length
          , d = g * 3 + 1 >> 2
          , k = new Uint8Array(d);
        for (var j, h, i = 0, e = 0, l = 0; l < g; l++) {
            h = l & 3;
            i |= c(m.charCodeAt(l)) << 18 - 6 * h;
            if (h === 3 || g - l === 1) {
                for (j = 0; j < 3 && e < d; j++,
                e++) {
                    k[e] = i >>> (16 >>> j & 24) & 255
                }
                i = 0
            }
        }
        return k
    };
    return {
        base64decode: b,
        decodeBase64DataUri: function(e) {
            var g = ";base64,"
              , f = e.slice(0, e.indexOf(g)) + g
              , d = e.substring(f.length);
            return b(d)
        }
    }
})();


require([
    'zrender',
    'zrender/graphic/shape/Circle',
    'zrender/graphic/shape/Rect',
    'zrender/container/Group',
    'zrender/graphic/Path',
    'zrender/graphic/shape/Polyline'
], function (zrender, Circle, Rect, Group, Path, Polyline) {
    var doc = document,
        $doc = $(doc),
        rightBody = doc.querySelector('.right-body');
    var body = doc.body;
    var frontBoxs = doc.getElementById('frontBoxs');


    var toolbar = new Vue({
        el: '#toolbar',
        data: {
            style: {
                top: 200,
                left: 200
            },
            status: '',
            showList: true
        },
        ready: function () {
            this.onReady();
        },
        watch: {
            showList: function (flag) {
                imgList.isShow = flag;
                rightBody.classList[flag ? 'add' : 'remove']('show-left')
            }
        },
        methods: {
            btnClick: function (type) {
                var map = {
                    rect: 1,
                    line: 1,
                    text: 1
                };
                if (map[type]) {
                    if (this.status == type) {
                        this.status = '';
                    } else {
                        this.status = type;
                    }
                } else {
                    drawBoard[type]();
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
                        var top = drag.btop + event.clientY - drag.by;
                        var left = drag.bleft + event.clientX - drag.bx;
                        if (top < 0) {
                            top = 0;
                        }
                        if (left < 0) {
                            left = 0;
                        }
                        self.style.top = top;
                        self.style.left = left;
                    }
                }).on('mouseup', function () {
                    drag.isDrag = false;
                });
            }
        }
    });


    var imgList = new Vue({
        el: '#imgList',
        data: {
            list: [],
            isShow: true
        },
        created: function () {
            this.onCreated();
        },
        methods: {
            onCreated: function () {
                var self = this;
                IMG_DB.getList(function (list) {
                    self.list = list;
                })
            }
        }
    });

    var __stopMousedown = function (e) {
        e.event.stopPropagation();
    };

    function RectG(board, shape) {
        this.board = board;
        this.shape = shape;
        var self = this;
        var drag = this.drag = {
            state: '',
            ondriftCir: function (dx, dy, e) {
                var res = {
                    dx: dx,
                    dy: dy
                };
                var rect = self.rect;
                var _shape = $.extend({}, rect.shape);

                if (drag.state == 'group_move') {
                    _shape.x += res.dx;
                    _shape.y += res.dy;
                    self.setShape(_shape);
                    return false;
                }

                if (drag.state == 'group_xy' && (this.circlePos == 'b' || this.circlePos == 't')) {
                    res = {
                        dx: 0,
                        dy: dy
                    };
                } else if (drag.state == 'group_xy' && this.circlePos[0] == 'c') {
                    res = {
                        dx: dx,
                        dy: 0
                    };
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
            return $.extend(true, {}, {
                shape: this.shape
            });
        },
        formRecord: function (record) {
            this.setShape(record.shape);
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
                res.cy = shape.y + shape.height / 2;
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
                res.cx = shape.x + shape.width / 2;
            }
            return res;
        },
        getCirCursor: function (type) {
            var res = '';
            if (type[0] == 't') {
                res += 'n';
            }
            if (type[0] == 'b') {
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
            var _shape;

            var _dragend = function () {
                drag.state = '';
                var shape = self.shape;
                var isSame = true;
                for (var key in shape) {
                    if (shape[key] != _shape[key]) {
                        isSame = false;
                        break;
                    }
                }
                if (!isSame)
                    self.board.addRecord();
            };

            var circleAttr = {
                shape: {
                    r: 4
                },
                style: style.circle,
                draggable: true,
                onmousedown: _stopMousedown,
                ondragstart: function () {
                    _shape = $.extend({}, self.shape);
                    drag.state = 'group_xy';
                },
                ondragend: _dragend,
                ondrift: drag.ondriftCir
            };

            this.rect = new Rect({
                shape: shape,
                style: style.rect,
                draggable: true,
                ondrift: drag.ondriftCir,
                onmousedown: _stopMousedown,
                ondragstart: function () {
                    _shape = $.extend({}, self.shape);
                    drag.state = 'group_move';
                },
                ondragend: _dragend
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
                width: event.x - this.shape.x,
                height: event.y - this.shape.y,
            });
        }
    };

    function LineG(board, shape) {
        this.board = board;
        this.shape = shape;
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
            return $.extend(true, {}, {
                shape: this.shape
            });
        },
        formRecord: function (record) {
            this.setShape(record.shape);
        },
        _draw: function () {
            var style = this.config.style;
            var group = this.group = new Group();
            var _stopMousedown = this.board.getMousedown(this);
            var self = this;
            var _shape;
            this.id = group.id;
            var line = this.line = new Polyline({
                shape: this.shape,
                style: style,
                draggable: true,
                onmousedown: _stopMousedown,
                ondrift: function (dx, dy, e) {
                    _.forEach(line.shape.points, function (item) {
                        item[0] += dx;
                        item[1] += dy;
                    })
                    this.shape = line.shape;
                    self.setShape(line.shape);
                    return false;
                },
                ondragstart: function () {
                    _points0 = self.shape.points[0][0];
                },
                ondragend: function () {
                    if (_points0 != self.shape.points[0][0])
                        self.board.addRecord();
                }
            })
            group.add(this.line);
            this.board.add(this);
        },
        setShape: function (_shape) {
            var shape = $.extend(this.shape, _shape);
            this.line.setShape(shape);
        },
        drawMove: function (event) {
            this.lineTo([event.x, event.y]);
        }
    };



    var hideInput = (function () {
        var $hideInput = $('<div class="hide-div-input" contenteditable="true"></div>').appendTo(rightBody);
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
                this.$elm.css({
                    top: top,
                    left: left
                }).show();
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
        shape.y -= 32 / 2;
        shape.x -= 6;
        this.board = board;
        this.shape = shape;
        this.preText = this.text = text || '';
        this._draw()
    }
    InputG.prototype = {
        reWidth: function (width) {
            if (width < 30) {
                width = 30;
            }
            this.setShape({
                width: width
            });
        },
        reText: function (text) {
            this.text = text;
        },
        toRecord: function () {
            return $.extend(true, {
                text: this.text
            }, {
                shape: this.shape
            })
        },
        formRecord: function (record) {
            this.rect.setStyle({
                text: record.text
            })
            this.setShape(record.shape);
        },
        config: {
            style: {
                fill: 'transparent',
                stroke: '#ed5026',
                lineWidth: 1,
                text: '',
                textPosition: 'insideLeft'
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
            var _shape;
            var _ondrift = function (dx, dy, e) {
                var res = {
                    dx: dx,
                    dy: dy
                };
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
                style: style,
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
                ondragstart: function () {
                    _shape = $.extend({}, self.shape);
                },
                ondragend: function () {
                    var shape = self.shape;
                    var isSame = true;
                    for (var key in shape) {
                        if (shape[key] != _shape[key]) {
                            isSame = false;
                            break;
                        }
                    }
                    if (!isSame)
                        self.board.addRecord();
                }
            });
            group.add(this.rect);
            this.board.add(this);
            this.focus();
            hideInput.focus(shape.y, shape.x, this);
        },
        focus: function () {
            this.preText = this.text;
            var shape = this.shape;
            this.rect.setStyle({
                stroke: '#ed5026'
            })
            //hideInput.focus(shape.y, shape.x, this);
        },
        blur: function () {
            var text = this.text;
            if (text == '') {
                this.remove(this.preText === '' ? false : true);
            } else {
                this.rect.setStyle({
                    stroke: 'transparent',
                    text: text
                })
                hideInput.blur();
                if (this.preText != text) {
                    this.board.addRecord();
                }
            }
            if (hideInput.proxy == this) {
                hideInput.proxy = null;
            }
            this.preText = text;
        },
        remove: function (flag) {
            this.board.remove(this, flag);
        },
        drawMove: function (event) {

        }
    };

    var drawBoard = (function () {

        var zr = zrender.init(frontBoxs);

        var bgCanvas = doc.getElementById('bgCanvas');
        var saveCanvas = doc.getElementById('saveCanvas');
        var bgCTX = bgCanvas.getContext('2d');
        var saveCTX = saveCanvas.getContext('2d');

        var _activeGElm = null;
        var GMaps = {};
        var showGMaps = {};
        var _img = new Image();

        var _fixType = function (type) {
            type = type.toLowerCase().replace(/jpg/i, 'jpeg');
            return 'image/' + type.match(/png|jpeg|bmp|gif/)[0];
        };

        return {
            records: [],
            recordIndex: -1,
            addRecord: function () {
                var record = {};
                for (var id in showGMaps) {
                    record[id] = showGMaps[id].toRecord();
                }
                this.records.push(record);
                this.recordIndex = this.records.length - 1;
            },
            toolbar: toolbar,
            redo: function () {
                if (this.recordIndex == -1) return;
                this.recordIndex--;
                this.records.length = this.recordIndex + 1;
                if (this.recordIndex == -1) {
                    this.records = [];
                    for (var key in showGMaps) {
                        this.remove(showGMaps[key], false);
                    }
                    showGMaps = {};
                    GMaps = {};
                } else {
                    var record = this.records[this.recordIndex];
                    for (var key in showGMaps) {
                        if (!record[key]) {
                            this.remove(showGMaps[key], false);
                        }
                    }
                    for (var key in record) {
                        GMaps[key].formRecord(record[key]);
                        if (!showGMaps[key]) {
                            this.add(GMaps[key]);
                        }
                    }
                }
            },
            save: function () {
                var frontCanvas = zr.dom.querySelector('canvas');
                saveCTX.drawImage(bgCanvas, 0, 0, this.width, this.height);
                if (frontCanvas)
                    saveCTX.drawImage(frontCanvas, 0, 0, this.width, this.height);

                var type = 'png';
                var imgData = saveCanvas.toDataURL(type);
                imgData = imgData.replace(_fixType(type), 'image/octet-stream');

                var filename = UTILS.getBKData('lastCaptureTitle') + '_' + (new Date()).getTime() + '.' + type;
                var saveLink = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a');
                saveLink.href = imgData;
                saveLink.download = filename;

                var event = document.createEvent("MouseEvents");
                event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                saveLink.dispatchEvent(event);
            },
            savedb: function () {
                var frontCanvas = zr.dom.querySelector('canvas');
                saveCTX.drawImage(bgCanvas, 0, 0, this.width, this.height);
                if (frontCanvas)
                    saveCTX.drawImage(frontCanvas, 0, 0, this.width, this.height);
                var imgData = saveCanvas.toDataURL('png');
                IMG_DB.insert({
                    title: UTILS.getBKData('lastCaptureTitle'),
                    url: UTILS.getBKData('lastCaptureUrl'),
                    imgData: imgData
                }, function () {
                    imgList.onCreated();
                });
            },
            createIssue: function () {
                APIS.getCreatConfig().then(function (res) {

                    function convertBase64UrlToBlob(urlData,type){
                        var bytes=window.atob(urlData.split(',')[1]);        //去掉url的头，并转换为byte
                        //处理异常,将ascii码小于0的转换为大于0
                        var ab = new ArrayBuffer(bytes.length);
                        var ia = new Uint8Array(ab);
                        for (var i = 0; i < bytes.length; i++) {
                            ia[i] = bytes.charCodeAt(i);
                        }
                        return new Blob( [ab] , {type : 'image/'+type});
                    }
                    var file = convertBase64UrlToBlob(imgList.list[0].imgData, 'png');
                    var xhr = new XMLHttpRequest();
                    var url = `${APIS.host}/rest/internal/2/AttachTemporaryFile?filename=wgu.png&size=${file.size}&atl_token=${encodeURIComponent(res.atl_token)}&formToken=${encodeURIComponent(res.formToken)}&projectId=10100`;
                    xhr.open("POST", url, true);
                    xhr.setRequestHeader("Content-Type", "image/png");
                    xhr.send(file)

                    var html = [];
                    _.forEach(res.fields, function (item) {
                        html.push(item.editHtml.replace('<label for="issuelinks-issues">', '</div><div class="field-group" ><label for="issuelinks-issues">'));
                    })
                    $('#createIssueModal .modal-body').html(html.join(''));
                    $('#createIssueModal .modal-body input,#createIssueModal .modal-body select,#createIssueModal .modal-body textarea')
                        .removeClass('hidden').addClass('form-control')

                    var template = function (state) {
                        if (!state.id) {
                            return state.text;
                        }
                        return $(
                            `<span><img src="${state.icon}" class="aui-ss-entity-icon" />${state.text}</span>`
                        );
                    };

                    var data = JSON.parse($('#project-options').attr('data-suggestions'));
                    data = _.map(data, function (item) {
                        return {
                            text: item.label,
                            children: _.map(item.items, function (x) {
                                x.id = x.value;
                                x.text = x.label;
                                return x
                            })
                        }
                    });
                    $('#project').after(`<select class="form-control form-control-select" id="projectSel2" ></select>`);
                    $('#projectSel2').select2({
                        placeholder: '选择一个项目',
                        width: 500,
                        data: data,
                        templateSelection: template,
                        templateResult: template
                    });

                    var data = JSON.parse($('#issuetype-options').attr('data-suggestions'));
                    data = _.map(_.filter(data, function (item) {
                        return item.label == "10502"
                    })[0].items, function (x) {
                        x.id = x.value;
                        x.text = x.label;
                        return x
                    })
                    $('#issuetype').after(`<select class="form-control form-control-select" id="issuetypeSel2" ></select>`);
                    $('#issuetypeSel2').select2({
                        placeholder: '选择一个问题类型',
                        width: 500,
                        data: data,
                        templateSelection: template,
                        templateResult: template
                    });

                    //$('#reporter').after(`<select class="form-control form-control-select" id="reporterSel2" ></select>`);
                    ;(function () {
                        var _data = [];
                        $('#reporter').find('option').each(function () {
                            _data.push({
                                id: this.getAttribute('value'),
                                text: this.getAttribute('data-field-text'),
                                icon: this.getAttribute('data-icon')
                            })
                        });
                        $('#reporter').select2({
                            placeholder: '选择一个报告人',
                            width: 500,
                            templateSelection: template,
                            templateResult: template,
                            ajax: {
                                url: APIS.host + "/rest/api/1.0/users/picker?showAvatar=true",
                                dataType: 'json',
                                delay: 250,
                                data: function (params) {
                                    return {
                                        query: params.term, // search term
                                        page: params.page
                                    };
                                },
                                processResults: function (data, params) {
                                    params.page = params.page || 1;
                                    if (data.totle == 0 || !params.term) {
                                        return {
                                            results: _data
                                        };
                                    } else {
                                        return {
                                            results: _.map(data.users, function (item) {
                                                return {
                                                    id: item.name,
                                                    text: item.displayName,
                                                    icon: item.avatarUrl
                                                }
                                            })
                                        };
                                    }
                                },
                                cache: true
                            }
                        });
                    })();

                    $('#components').select2({
                        multiple: true,
                        placeholder: '选择一个模块',
                        width: 500,
                    });

                    $('#fixVersions').select2({
                        multiple: true,
                        placeholder: '选择一个解决版本',
                        width: 500,
                    });

                    $('#duedate').datetimepicker({
                        format: 'yyyy-mm-dd',
                        minView: 2,
                        maxView: 2,
                        autoclose: true
                    });

                    //$('#priority').after(`<select class="form-control form-control-select" id="prioritySel2" ></select>`);
                    var data = [];
                    $('#priority').find('option').each(function () {
                        data.push({
                            id: this.getAttribute('value'),
                            text: this.innerText,
                            icon: APIS.host + this.getAttribute('data-icon'),
                        })
                    })
                    $('#priority').select2({
                        placeholder: '选择一个报告人',
                        width: 500,
                        data: data,
                        templateSelection: template,
                        templateResult: template
                    });

                    (function () {
                        var _data = [];
                        $('#assignee').find('option').each(function () {
                            _data.push({
                                id: this.getAttribute('value'),
                                text: this.getAttribute('data-field-label'),
                                icon: this.getAttribute('data-icon')
                            })
                        })

                        $('#assignee').select2({
                            placeholder: '选择一个经办人',
                            width: 500,
                            templateSelection: template,
                            templateResult: template,
                            ajax: {
                                url: APIS.host + "/rest/api/latest/user/assignable/multiProjectSearch?projectKeys=SPM&maxResults=50&startAt=0",
                                dataType: 'json',
                                delay: 250,
                                data: function (params) {
                                    return {
                                        username: params.term, // search term
                                        page: params.page
                                    };
                                },
                                processResults: function (data, params) {
                                    params.page = params.page || 1;
                                    if (!params.term) {
                                        return {
                                            results: _data,
                                        }
                                    }
                                    return {
                                        results: _.map(data, function (item) {
                                            return {
                                                id: item.key,
                                                text: item.emailAddress,
                                                icon: item.avatarUrls['48x48']
                                            }
                                        })
                                    };
                                },
                                cache: true
                            }
                        })
                    })();

                    $.ajax({
                        method: "GET",
                        url: APIS.host + "/rest/api/1.0/labels/suggest?query=",
                        dataType: "json"
                    }).then(function (data) {
                        $('#labels').select2({
                            data: data.suggestions.map(function (item) {
                                return {
                                    id: item.label,
                                    text: item.label
                                }
                            }),
                            multiple: true,
                            placeholder: '选择一个标签',
                            width: 500,
                        })
                    })

                    $.get(APIS.host + '/rest/greenhopper/1.0/epics?searchQuery=&projectKey=SPM&maxResults=100&hideDone=true')
                        .then(function (data) {
                            data = _.map(data.epicLists, function (item) {
                                return {
                                    text: item.listDescriptor,
                                    children: _.map(item.epicNames, function (x) {
                                        x.id = 'key:' + x.key;
                                        x.text = x.name + ' - (' + x.key + ')';
                                        return x
                                    })
                                }
                            });
                            $('#customfield_10000').select2({
                                data: data,
                                placeholder: '选择一个issue',
                                width: 500,
                            })
                        })
                    
                    $.get(APIS.host + '/rest/tempo-teams/2/picker/team?expand=projects&query=')
                        .then(function (data) {
                            $('#customfield_10308').select2({
                                data: data.map(function (item) {
                                    return {
                                        id: item.id,
                                        text: item.name
                                    }
                                }),
                                placeholder: '选择一个Team',
                                width: 500,
                            })
                        })
                    
                    $('#issuelinks-linktype').select2({
                        placeholder: '选择一个问题',
                        width: 500,
                    })
                    

                    $('#issuelinks-issues').select2({
                        placeholder: '选择一个问题',
                        width: 500,
                        templateSelection: template,
                        templateResult: template,
                        ajax: {
                            url: APIS.host + '/rest/api/2/issue/picker?currentIssueKey=&showSubTasks=true&showSubTaskParent=true&currentProjectId=',
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                return {
                                    query: params.term, // search term
                                    page: params.page
                                };
                            },
                            processResults: function (data, params) {
                                params.page = params.page || 1;
                                return {
                                    results: _.map(data.sections, function (item) {
                                        return {
                                            text: item.sub,
                                            children: _.map(item.issues, function (x) {
                                                x.id = x.key;
                                                x.text = x.key + ' -- ' + x.summary;
                                                x.icon = APIS.host + x.img
                                                return x
                                            })
                                        }
                                    })
                                };
                            },
                            cache: false
                        }
                    })
                    
                    $('#customfield_10004').select2({
                        placeholder: '选择一个Sprint',
                        width: 500,
                        templateSelection: template,
                        templateResult: template,
                        ajax: {
                            url: APIS.host + '/rest/greenhopper/1.0/sprint/picker',
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                return {
                                    query: params.term, // search term
                                    page: params.page
                                };
                            },
                            processResults: function (data, params) {
                                params.page = params.page || 1;
                                return {
                                    results: [{
                                        text: '建议',
                                        children: _.map(data.suggestions, function (x) {
                                            x.id = x.id;
                                            x.text = x.name;
                                            return x
                                        })
                                    },{
                                        text: '全部Sprint',
                                        children: _.map(data.allMatches, function (x) {
                                            x.id = x.id;
                                            x.text = x.name;
                                            return x
                                        })
                                    }]
                                };
                            },
                            cache: false
                        }
                    })

                    $('#versions').select2({
                        placeholder: '选择一个版本',
                        width: 500,
                    })
                    $('#createIssueModal').modal();
                })
            },
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
                frontBoxs.style.width = width + 'px';
                frontBoxs.style.height = height + 'px';
                zr.resize(width, height);
            },
            add: function (gELm) {
                showGMaps[gELm.id] = GMaps[gELm.id] = gELm;
                zr.add(gELm.group);
            },
            remove: function (gELm, isRecord) {
                zr.remove(gELm.group);
                showGMaps[gELm.id] = null;
                delete showGMaps[gELm.id];
                if (isRecord !== false)
                    this.addRecord();
            },
            creatGroup: function (status, event) {
                var x = event.clientX + rightBody.scrollLeft - rightBody.offsetLeft;
                var y = event.clientY + rightBody.scrollTop - rightBody.offsetTop;
                if (status === 'rect') {
                    return new RectG(this, {
                        x: x,
                        y: y,
                        width: 1,
                        height: 1
                    });
                } else if (status === 'line') {
                    return new LineG(this, {
                        points: [
                            [x, y]
                        ]
                    });
                } else if (status === 'text') {
                    if (hideInput.proxy) {
                        return null;
                    } else {
                        return new InputG(this, {
                            x: x,
                            y: y,
                        });
                    }
                }
            },
            ratio: window.devicePixelRatio,
            setDimensions: function (_width, _height) {
                var width = _width / drawBoard.ratio;
                var height = _height / drawBoard.ratio;
                drawBoard.width = _width;
                drawBoard.height = _height;
                if (bgCanvas) {
                    saveCanvas.width = bgCanvas.width = _width;
                    saveCanvas.height = bgCanvas.height = _height;
                    saveCanvas.style.width = bgCanvas.style.width = width + 'px';
                    saveCanvas.style.height = bgCanvas.style.height = height + 'px';
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

                var _addShap;
                $(frontBoxs).on('mousedown', function (event) {
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
                            x: event.clientX + rightBody.scrollLeft - rightBody.offsetLeft,
                            y: event.clientY + rightBody.scrollTop - rightBody.offsetTop
                        });
                    }
                }).on('mouseup', function () {
                    if (_addShap) {
                        self.addRecord();
                        _addShap = null;
                    }
                });
                $doc.on('mousedown', function (event) {
                    if ($(event.target).hasClass('hide-div-input')) {
                        return;
                    }
                    if (_activeGElm) {
                        _activeGElm.blur();
                        _activeGElm = null;
                    }
                }).on('keydown', function (event) {
                    if (event.target == body && event.which === 8) {
                        if (_activeGElm) {
                            self.remove(_activeGElm);
                        }
                    }
                });
                
                
                $('#createIssueBtn').on('click', function () { 
                    var postData = {};
                    postData.pid = $('#projectSel2').val();
                    postData.issuetype = $('#issuetypeSel2').val();
                    postData.summary = $('#summary').val();
                    postData.reporter = $('#reporter').val();
                    postData.components = $('#components').val();
                    postData.description = $('#description').html();

                    postData.duedate = $('#duedate').val();
                    postData.priority = $('#priority').val();
                    postData.assignee = $('#assignee').val();
                    postData.labels = $('#labels').val();
                    postData.timetracking_originalestimate = $('#timetracking_originalestimate').val();
                    postData.timetracking_remainingestimate = $('#timetracking_remainingestimate').val();
                    postData.isCreateIssue = true;
                    postData.hasWorkStarted = '';
                    postData['dnd-dropzone'] = '';

                    postData.customfield_10000 = $('#customfield_10000').val();
                    postData.customfield_10308 = $('#customfield_10308').val();
                    postData.customfield_10004 = $('#customfield_10004').val();
                    postData.versions = $('#versions').val();
                    postData.issuelinks = 'issuelinks';
                    postData['issuelinks-issues'] = $('#issuelinks-issues').val();
                    postData['issuelinks-linktype'] = $('#issuelinks-linktype').val();
                    postData.fixVersions = $('#fixVersions').val();

                    postData.filetoconvert = [];

                    fieldsToRetain = [
                        'project','issuetype','reporter','components','fixVersions',
                        'duedate','priority','assignee','labels','customfield_10000',
                        'issuelinks','customfield_10308','customfield_10004','versions','filetoconvert-temp'
                    ]

                })

                
            }
        }
    })();

    drawBoard.init();
})
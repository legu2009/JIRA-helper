var page = (function () {
    
    var bugsBody = {
        $body: $('#bugsBody'), 
        getHtml: function (list) {
            var tab = ['<ol class="issue-list">'];
            _.each(list, function (item) {
                tab.push(`<li>
                    <div class="fr">
                        <select class="form-control select done-sel">
                            <option value="-1" selected="selected">请选择</option>
                            <option value="10000">完成</option>
                            <option value="10001">Won't Do</option>
                            <option value="10002">重复提交</option>
                            <option value="10003">无法再次复现</option>
                            <option value="10100">Declined</option>
                            <option value="10101">Rejected</option>
                        </select>
                        <button type="button" class="btn btn-default btn-xs fr done-btn" data-id="${item.id}" data-key="${item.key}">解决</button>
                    </div>
                    <div class="issue-link-key" data-key="${item.key}"><img height="16" width="16" src="images/bug.svg">${item.key}</div>
                    <div class="issue-link-summary">${item.title}</div>
                </li>`)
            });
            tab.push('</ol>');
            return tab.join('');
        },
        onShow: function () {
            var self = this;
            APIS.getbugs().then(function (bugList) {
                var bgWin = chrome.extension.getBackgroundPage();
                if (bgWin && bgWin.page) {
                    bgWin.page.rushBugs(false, bugList.length);
                }
                if (bugList.length > 0) {
                    $('.menu-bugs .badge').html(bugList.length);
                }
                self.$body.html(self.getHtml(bugList)); 
            })
        },
        init: function () {
            this.$body.on('click', '.issue-link-key', function () {
                var key = this.getAttribute('data-key');
                var optionUrl = APIS.host + '/browse/' + key;
                var likeUrl = APIS.host + '/browse/' + key.replace(/-\d+/, '') + '-';
                console.log(likeUrl);
                chrome.tabs.getAllInWindow(null,function(tabs){
                    var optionTab = tabs.filter(function(t) {console.log(t.url); return t.url.indexOf(likeUrl) !== -1 });
                    if (optionTab.length) {
                        chrome.tabs.update(optionTab[0].id, {url: optionUrl, selected: true});
                    } else {
                        chrome.tabs.create({url: optionUrl, selected: true})
                    }
                });
            }).on('click', '.done-btn', function () {
                var $elm = $(this);
                var result = $elm.siblings('.done-sel').val();
                if (result === -1) return;
                var $elm = $(this);
                APIS.fixBug({
                    key: $elm.attr('data-key'),
                    id: $elm.attr('data-id')
                }, result).then(function () {
                    var $item = $elm.parent().parent().fadeTo("slow", 0.01, function() {
                        $item.slideUp("slow", function() {
                            $item.remove();
                            var bgWin = chrome.extension.getBackgroundPage();
                            if (bgWin && bgWin.page) {
                                bgWin.page.rushBugs(false, $('.issue-list li').length);
                            }
                        });
                    });
                });
            })
        }
    };
    var configBody = {
        $body: $('#configBody'), 
        onShow: function () {
            this.$body.find('.form-control').each(function () {
                var keyfor = this.getAttribute('for');
                this.value = localStorage[keyfor] || '';
                if (keyfor === 'config_host') {
                    APIS.host = localStorage.config_host;
                }
            });
        },
        init: function () {
            var self = this;
            this.$body.find('.form-control').on('change', function () {
                var keyfor = this.getAttribute('for');
                if (keyfor === 'config_host') {
                    localStorage[keyfor] = this.value.replace(/\/$/, '');
                } else {
                    localStorage[keyfor] = this.value;
                }
            });
            var $listBox = $('#projectListBox').on('click', 'input', function () {
                var result = [];
                $listBox.find('input:checked').each(function () {
                    result.push(this.value);
                })
                localStorage.config_project = result.join(',')
            });
            $('.getList-btn').on('click', function () {
                APIS.getProjectList().then(function (list) {
                    localStorage.config_project_list = JSON.stringify(list);
                    self.setProjectHtml(list)
                });
            })

            if (localStorage.config_project_list) {
                var list = JSON.parse(localStorage.config_project_list);
                self.setProjectHtml(list)
            }
        },
        setProjectHtml: function (list) {
            var html = [];
            var project = ',' + localStorage.config_project + ',';
            _.forEach(list, function(item) {
                var ischeck = project.indexOf(',' + item.key + ',') != -1;
                html.push(`<label><input type="checkbox" ${ischeck?'checked':''} value="${item.key}">${item.name}</label>`);
            });
            $('#projectListBox').html(html.join(''));
        }
    }

    var timeLineBody = (function() {
        var $body = $('#timeLineBody');
        var $timeList = $('#timelineList');
        return {
            onShow: function () {
                var height = document.body.clientHeight;
                $timeList.height(height-120).scrollTop(999999999);
                this.rushTipNum();
            },
            getWeekHtml: function () {
                var mot = moment();
                var day = mot.day();
                var step = 0;
                if (day === 0) {
                    step = -7;
                }
                var html = [];
                var days = [];
                for (var i = 1; i<= day && i < 6; i++) {
                    var txt = mot.day(i + step).format('YYYY-MM-DD');
                    days.push(mot.day(i + step).format('DDMMYYYY'));
                    html.push(`<option value="${txt}" ${i==day?' selected="selected" ':''} >${txt}</option>`);
                }
                $('#timeLineSel').html(html.join(''));
                return days;
            },
            getTimeLine: function (day) {
                var self = this;
                TIME_DB.getTimeLine(day, function (res) {
                    $timeList.html(self._getHtml(res)).scrollTop(999999999);
                })
            },
            _getHtml(res) {
                var html = [], txt = [];
                var map = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                var _hour = '';
                var copyText = [];
                _.forEach(res, function (item) {
                    if (_hour != item.hour) {
                        if (_hour) {
                            html.push(txt.join('</li><li class="content-item">') + '</li></ul></li>');
                            txt = [];
                        }
                        _hour = item.hour;
                        html.push('<li class="content-box-warper content-box-' + _hour + '"><div class="clock light"><div class="digits">');
                        html.push('<div class="' + map[_hour[0]] + '"><span class="d1"></span><span class="d2"></span><span class="d3"></span><span class="d4"></span><span class="d5"></span><span class="d6"></span><span class="d7"></span></div>');
                        html.push('<div class="' + map[_hour[1]] + '"><span class="d1"></span><span class="d2"></span><span class="d3"></span><span class="d4"></span><span class="d5"></span><span class="d6"></span><span class="d7"></span></div>');
                        html.push('</div></div><div class="content-box"><ul class="content"><li class="content-item">')
                    }
                    copyText.push(item.log);
                    txt.push(`<span class="glyphicon glyphicon-remove" data-id="${item.id}"></span>` + item.log);
                })
                if (txt.length > 0) {
                    html.push(txt.join('</li><li class="content-item">') + '</li></ul></li>');
                }
                this.copyText = copyText.join('\n');
                return html.join('');
            },
            init: function () {
                var self = this;
                $('#timelineText').keypress(function(e) {
                    if (e.ctrlKey && e.which == 13) {
                        var insertId = TIME_DB.insert(this.value);
                        var mot = moment();
                        var hour = mot.format('HH');
                        var $elm = $timeList.find('.content-box-' + hour);
                        if ($elm.length > 0) {
                            $elm.find('.content').append(`<li class="content-item"><span class="glyphicon glyphicon-remove" data-id="${insertId}"></span>` + this.value + '</li>');
                        } else {
                            $timeList.append(self._getHtml([{hour: hour, log: this.value, id: insertId}]))
                        }
                        this.value = '';
                        $timeList.scrollTop(999999999);
                    }
                })
                $timeList.on('scroll', function () {
                    var _scrollTop = this.scrollTop;
                    var _clientHeight = this.clientHeight;
                    $timeList.find('.content-box-warper').each(function () {
                        var offsetTop = this.offsetTop ;
                        var clientHeight = this.clientHeight;
                        if (offsetTop < _scrollTop) { //在滚动外面
                            if (offsetTop + clientHeight > _scrollTop) { //在可视区域
                                $(this).find('.clock').css({top: _scrollTop - offsetTop});
                                return;
                            }
                        }
                        $(this).find('.clock').css({top: 0});
                    })
                });
                $timeList.on('click', '.glyphicon-remove', function () {
                    console.log(this.getAttribute('data-id'));
                    TIME_DB.delTimeLineId(this.getAttribute('data-id'));
                    var $elm = $(this);
                    var $item = $elm.parents('.content-box-warper');
                    if ($item.find('.content-item').length > 1) {
                        $item = $elm.parent().removeClass('content-item');
                    }
                    $item.fadeTo("slow", 0.01, function() {
                        $item.slideUp("slow", function() {
                            $item.remove();
                        });
                    });
                });
                $('#timeLineSel').on('change', function () {
                    self.showDayTimeLine(this.value);
                });
                $('#timeLineClear').on('click', function () {
                    TIME_DB.delTimeLine($('#timeLineSel').val());
                    $timeList.html('');
                });
                $('#timeLineEdit').on('change', function () {
                    if (this.checked) {
                        $timeList.addClass('timeLine-edit')
                    } else {
                        $timeList.removeClass('timeLine-edit')
                    }
                })
            
                $('#timeLineLog').on('click', function () {
                    document.oncopy = function(event) {
                        event.clipboardData.setData("Text", self.copyText);
                        event.preventDefault();
                    };
                    document.execCommand("Copy");
                    document.oncopy = undefined;
                    var optionUrl = APIS.host + '/secure/TempoUserBoard!timesheet.jspa';
                    chrome.tabs.getAllInWindow(null,function(tabs){
                        var optionTab = tabs.filter(function(t) { return t.url === optionUrl });
                        if (optionTab.length) {
                            chrome.tabs.update(optionTab[0].id, {selected: true});
                        } else {
                            chrome.tabs.create({url: optionUrl, selected: true})
                        }
                    });
                })                
                this.daylist = this.getWeekHtml();
                self.showDayTimeLine(moment().format('YYYY-MM-DD'));
                this.rushTipNum();
            },
            copyText: '',
            timeLineDatas: {},
            showDayTimeLine: function (day) {
                this.getTimeLine(day);
                var mt = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (this.timeLineDatas[`${mt[3]}${mt[2]}${mt[1]}`] == 100) {
                    $('#timeLineStatus').addClass('timeLine-status-done');
                } else {
                    $('#timeLineStatus').removeClass('timeLine-status-done');
                }
                if (moment().format('YYYY-MM-DD') === day) {
                    $('#timelineText').attr('disabled', false);
                } else {
                    $('#timelineText').attr('disabled', true);
                }
            },
            rushTipNum: function () {
                var daylist = this.daylist;
                var self = this;
                APIS.getTimeLines().then(function (res) {
                    self.timeLineDatas = res;
                    var count = 0;
                    for (var i = 0, len = daylist.length; i< len; i++) {
                        if (res[daylist[i]] != 100) {
                            count++;
                        }
                    }
                    if (count) {
                        $('.menu-timeLine .badge').html(count);
                    }
                });
            }
        }
    })();

    var models = {
        'bugsBody': bugsBody,
        'configBody': configBody,
        'timeLineBody': timeLineBody
    };


    var tabMenus = (function () {
        var $menus = $('.nav-menu>li');
        var $planes = $('.right-plane>div');
        return {
            showPlane: function (key) {
                var $elm = $(key);
                $menus.removeClass('active');
                $elm.addClass('active');
                var forAttr = $elm.attr('for')
                if (forAttr) {
                    $planes.hide();
                    $('#' + forAttr).show();
                    models[forAttr].onShow();
                }
            },
            init: function () {
                $menus.on('click', function() {
                    tabMenus.showPlane(this);
                })
            }
        }
    })();

    return {
        init: function () {
            tabMenus.init();
            APIS.login().then(function (headUrl) {
                if (headUrl) {
                    $('.left-head-pic').css('background-image', `url(${headUrl.replace('small', 'big')})`);
                }
            });
            for (var key in models) {
                models[key].init();
            }  
            /*.then(function (bugs) {
                if (bugs) {
                    <ol class="issue-list">
                        <li title="资源因素历史页面点击返回键后资源因素公式报错" data-key="SPM-946" class="focused">
                            <a class="splitview-issue-link" href="/browse/SPM-946"><span class="issue-link-key">
                                <img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-946</span><span class="issue-link-summary">资源因素历史页面点击返回键后资源因素公式报错</span></a></li><li title="测试问题" data-key="SPM-945"><a class="splitview-issue-link" href="/browse/SPM-945"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-945</span><span class="issue-link-summary">测试问题</span></a></li><li title="组织指标设定删除指标显示成功但实际没有删除成功" data-key="SPM-934"><a class="splitview-issue-link" href="/browse/SPM-934"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-934</span><span class="issue-link-summary">组织指标设定删除指标显示成功但实际没有删除成功</span></a></li><li title="组织规则设置后点击保存无提示（spm库 luckybird）" data-key="SPM-893"><a class="splitview-issue-link" href="/browse/SPM-893"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-893</span><span class="issue-link-summary">组织规则设置后点击保存无提示（spm库 luckybird）</span></a></li><li title="权限管理不勾选用户管理角色权限，在权限管理中不应该看到用户管理页面" data-key="SPM-889"><a class="splitview-issue-link" href="/browse/SPM-889"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-889</span><span class="issue-link-summary">权限管理不勾选用户管理角色权限，在权限管理中不应该看到用户管理页面</span></a></li><li title="个人指标设定表头设计不合理" data-key="SPM-764"><a class="splitview-issue-link" href="/browse/SPM-764"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-764</span><span class="issue-link-summary">个人指标设定表头设计不合理</span></a></li><li title="个人指标设置点击设置功能页面显示不合理" data-key="SPM-765"><a class="splitview-issue-link" href="/browse/SPM-765"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-765</span><span class="issue-link-summary">个人指标设置点击设置功能页面显示不合理</span></a></li><li title="IE11上调整列宽筛选图标参差不齐" data-key="SPM-404"><a class="splitview-issue-link" href="/browse/SPM-404"><span class="issue-link-key"><img height="16" width="16" alt="Bug" title="Bug - A problem which impairs or prevents the functions of the product." src="/secure/viewavatar?size=xsmall&amp;avatarId=10303&amp;avatarType=issuetype">&nbsp;SPM-404</span><span class="issue-link-summary">IE11上调整列宽筛选图标参差不齐</span></a></li></ol>
                }
            });*/
            tabMenus.showPlane('.menu-timeLine');
            bugsBody.onShow();
            
        }
    }
})();
page.init();


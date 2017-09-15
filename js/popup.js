Vue.component('bugs-plane', {
    template:
`<ul class="issue-list">
    <li v-for="(index, item) in lists" transition="bounce" track-by="id">
        <div class="fr">
            <select class="form-control" v-model="item.result">
                <option v-for="option in options" :value="option.value">
                    {{ option.text }}
                </option>
            </select>
            <button type="button" class="btn btn-default btn-xs fr" @click="fixBug(item)">解决</button>
        </div>
        <div class="issue-link-key" @click="linkBug(item)"><img height="16" width="16" src="images/bug.svg">{{item.key}}</div>
        <div class="issue-link-summary">{{item.title}}</div>
    </li>
</ul>`,
    data: function () {
        return { 
            lists: [],
            options: [
                {value: '-1', text: '请选择'},
                {value: '10000', text: '完成'},
                {value: '10001', text: 'Won\'t Do'},
                {value: '10002', text: '重复提交'},
                {value: '10003', text: '无法再次复现'},
                {value: '10100', text: 'Declined'},
                {value: '10101', text: 'Rejected'}
            ]
        }
    },
    props: ['isShow'],
    watch: {
        isShow: function (flag) {
            if (flag) {
                this.onShow();
            }
        }
    },
    created: function () {
        this.onShow();
    },
    methods: {
        onShow: function () {
            var self = this;
            APIS.getbugs().then(function (bugList) {
                _.forEach(bugList, function(item) {
                    item.result = -1;
                });
                self.lists = bugList;
                self.$dispatch('updateNum', 'bugs', self.lists.length)
            })
        },
        fixBug: function (item, index) {
            var self = this;
            if (item.result === -1) return;
            LOADING.show();
            APIS.fixBug({
                key: item.key,
                id: item.id
            }, item.result).then(function () {
                self.lists.splice(index, 1);
                self.$dispatch('updateNum', 'bugs', this.lists.length);
                LOADING.hide();
            });
        },
        linkBug: function (item) {
            var optionUrl = APIS.host + '/browse/' + item.key;
            var likeUrl = APIS.host + '/browse/' + item.key.replace(/-\d+/, '') + '-';
            UTILS.openUrl(optionUrl, function (tab) {
                return tab.url.indexOf(likeUrl) !== -1;
            })
        }
    }
});

Vue.component('config-plane', {
    template:
`<div class="input-group input-group-sm">
    <span class="input-group-addon">域名</span>
    <input type="text" class="form-control" v-model="config.host" placeholder="{{placeholder.host}}" >
</div>
<div class="input-group input-group-sm">
    <span class="input-group-addon">用户</span>
    <input type="text" class="form-control" v-model="config.userName" placeholder="{{placeholder.用户名}}" >
</div>
<div class="input-group input-group-sm">
    <span class="input-group-addon">密码</span>
    <input type="text" class="form-control" v-model="config.password" placeholder="{{placeholder.密码}}" >
</div>
<button type="button" class="btn btn-default btn-xs" @click="getProjects">刷新项目列表</button>
<div class="input-group input-group-sm">
    <label v-for="item in projectList" ><input type="checkbox" v-model="config.project" value="{{item.key}}">{{item.name}}</label>
</div>`,
    data: function () {
        return { 
            config: {
                host: localStorage['config_host'] || '',
                userName: localStorage['config_userName'] || '',
                password: localStorage['config_password'] || '',
                project: (localStorage['config_project']|| '').split(',')
            },
            projectList: JSON.parse(localStorage['config_project_list']|| '[]'),
            placeholder: {
                host: 'http://58.210.193.194:8089/',
                userName: '用户名',
                password: '密码'
            }
        }
    },
    props: ['isShow'],
    watch: {
        isShow: function (flag) {
            if (flag) {
                this.onShow();
            }
        }
    },
    created: function () {
        this.onCreated();
    },
    methods: {
        onCreated: function () {
            for (var key in this.config) {
                this.$watch('config.' + key, function (val) {
                    localStorage['config_' + key] = val;
                    APIS[key] = val;
                })
            }
            this.onShow();
        },
        onShow: function () {
            this.config.host = localStorage['config_host'] || '';
            this.config.userName = localStorage['config_userName'] || '';
            this.config.password = localStorage['config_password'] || '';
            this.config.projectList = JSON.parse(localStorage['config_project_list']|| '[]');
            this.config.projects = (localStorage['config_project']|| '').split(',');
        },
        getProjects: function () {
            var self = this;
            APIS.getProjectList().then(function (list) {
                localStorage.config_project_list = JSON.stringify(list);
                self.projectList = list;
            });
        }
    }
});

Vue.component('timeline-list', {
    template:
`<ul class="timeline-list" :class="{'timeLine-edit': isEdit}" :style="{ height: listHeight + 'px' }" @scroll="scrollShow">
    <li class="content-box-warper" v-for="(index, item) in dbList" transition="bounce" track-by="hour">
        <div class="clock light">
            <div class="digits">
                <div :class="map[item.hour.substr(0, 1)]"><span v-for="item in tab" :class="'d' + item"></span></div>
                <div :class="map[item.hour.substr(1, 1)]"><span v-for="item in tab" :class="'d' + item"></span></div>
            </div>
        </div>
        <div class="content-box" >
            <ul class="content">
                <li class="content-item" v-for="obj in item.items" transition="bounce" track-by="id"><span class="glyphicon glyphicon-remove" @click="delOneLog(obj.id)"></span>{{obj.log}}</li>
            </ul>
        </div>
    </li>
</ul>`,
    data: function () {
        return {
            map: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
            tab: [1,2,3,4,5,6,7]
        }
    },
    props: ['listHeight', 'dbList', 'isEdit'],
    methods: {
        delOneLog: function (id) {
            this.$dispatch('delOneLog', id)
        },
        scrollShow: function (event) {
            var target = event.target;
            var _scrollTop = target.scrollTop;
            var _clientHeight = target.clientHeight;
            _.forEach(target.querySelectorAll('.content-box-warper'), function (elm) {
                var offsetTop = elm.offsetTop ;
                var clientHeight = elm.clientHeight;
                if (offsetTop < _scrollTop) { //在滚动外面
                    if (offsetTop + clientHeight > _scrollTop) { //在可视区域
                        elm.querySelector('.clock').style.top = (_scrollTop - offsetTop) + 'px';
                        return;
                    }
                }
            })
        },
        onCreated: function () {
            this.$watch('dbList', function () {
                var self = this;
                Vue.nextTick(function () {
                    self.$el.scrollTop = 999999;
                })
            }, {
                deep: true
            })
        }
    },
    created: function () {
        this.onCreated();
    }
});




Vue.component('timeline-plane', {
    template:
`<div style="height: 30px;">
    <div class="timeLine-status" :class="{'timeLine-status-done': doneMap[selDay] >= 100}"> </div>
    <select class="form-control" v-model="selDay">
        <option v-for="text in options" :value="text">{{text}}</option>
    </select>
    <label>
        <input type="checkbox" v-model="isEdit" > edit
    </label>
    <button type="button" class="btn btn-default btn-xs" @click="delAllDay">清空</button>
    <button type="button" class="btn btn-default btn-xs" @click="openLog">记录工时</button>
</div>
<timeline-list :list-height="listHeight" :db-list="dbList" :is-edit="isEdit"></timeline-list>
<textarea class="form-control" placeholder="ctr+enter" v-model="text" v-el:write-text />`,
    data: function () {
        return { 
            selDay: '',
            today: '',
            options: [],
            doneMap: {},
            dbList: [],
            listHeight: '20',
            isEdit: false,
            text: localStorage.tmp_timelist_text || ''
        }
    },
    props: ['isShow'],
    watch: {
        isShow: function (flag) {
            if (flag) {
                this.onShow();
            }
        },
        selDay: function (flag) {
            if (flag) {
                this.onShow();
            }
        },
        text: function (flag) {
            this.saveText(flag);
        }
    },
    created: function () {
        this.onCreated();
        this.saveText = _.debounce(function(text) {
            localStorage.tmp_timelist_text = text;
        }, 300)
    },
    events: {
        delOneLog: function (id) {
            TIME_DB.delTimeLineId(id);
            var flag = false;
            var dbList = this.dbList;
            _.forEach(dbList, function (hour, j) {
                _.forEach(hour.items, function (item, i) {
                    if (item.id == id) {
                        if (hour.items.length == 1) {
                            dbList.splice(i, 1);
                            flag = true;
                            return true;
                        } else {
                            hour.items.splice(i, 1);
                            flag = true;
                            return true;
                        }
                    }
                })
                return flag;
            })
        }
    },
    methods: {
        openLog: function () {
            var copyText = [];
            _.forEach(this.dbList, function (hour) {
                _.forEach(hour.items, function (item) {
                    copyText.push(item.log)
                })
            })
            document.oncopy = function(event) {
                event.clipboardData.setData("Text", copyText.join('\n'));
                event.preventDefault();
            };
            document.execCommand("Copy");
            document.oncopy = undefined;
            var url = APIS.host + '/secure/TempoUserBoard!timesheet.jspa';
            UTILS.openUrl(url, function (tab) {
                return tab.url === url
            })
        },
        addTimeline: function () {
            var insertId = TIME_DB.insert(this.text, this.selDay);
            var hour = moment().format('HH');
            var dbList = this.dbList;
            var f = _.find(dbList, function (item) { return item.hour == hour});
            if (f) {
                f.items.push({hour: hour, id: insertId, log: this.text})
            } else {
                dbList.push({hour: hour, items: [{hour: hour, id: insertId, log: this.text}]})
            }
            this.text = '';
        },
        delAllDay: function () {
            TIME_DB.delTimeLine(this.selDay);
            this.dbList = [];
        },
        onCreated: function () {
            this._getWeekDays();
            this.onShow();
            var self = this;
            Vue.nextTick(function () {
                $(self.$els.writeText).keypress(function(e) {
                    if (e.ctrlKey && e.which == 13) {
                        self.addTimeline()
                    }
                });
            })
        },
        onShow: function () {
            var self = this;
            this.listHeight = document.body.clientHeight -120;
            TIME_DB.getTimeLine(this.selDay, function (res) {
                self.dbList = res;
            })
            var options = this.options;
            APIS.getTimeLines().then(function (doneMap) {
                self.doneMap = doneMap;
                var count = 0;
                for (var i = 0, len = options.length; i< len; i++) {
                    if (doneMap[options[i]] != 100) {
                        count++;
                    }
                }
                self.$dispatch('updateNum', 'timeline', count)
            });
        },
        _getWeekDays: function () {
            var mot = moment();
            var day = mot.day();
            var step = 0;
            if (day === 0) {
                step = -7;
            }
            var days = [];
            for (var i = 1; i<= day && i < 6; i++) {
                days.push(mot.day(i + step).format('YYYY-MM-DD'));
                if (day == i) {
                    this.today = this.selDay = mot.day(i + step).format('YYYY-MM-DD');
                }
            }
            this.options = days;
        }
    }
});

var page = new Vue({
    el: '#mainPage',
    data: {
        activePlane: 'bugs',
        timelineNum: 0,
        bugNum: 0,
        headPic: ''
    },
    methods: {
        changPlane: function (plane) {
            if (plane == 'add') {
                chrome.tabs.captureVisibleTab(null, {
                    format: "png"
                }, function (data) {
                    if (chrome.extension.lastError) {}
                    UTILS.setBKData('lastCaptureImg', data);
                    chrome.tabs.create({
                        url: 'capture.html'
                    });
                });
                return;
            }
            this.activePlane = plane;
        }
    },
    events: {
        updateNum: function (type, len) {
            if (type === 'bugs') {
                var bgWin = chrome.extension.getBackgroundPage();
                if (bgWin && bgWin.page) {
                    bgWin.page.rushBugs(false, len);
                }
                this.bugNum = len;
            } else if (type === 'timeline') {
                this.timelineNum = len;
            }
        }
    }
});
APIS.login().then(function (headUrl) {
    if (headUrl) {
        page.headPic = headUrl.replace('small', 'big');
    }
});
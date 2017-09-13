var LOADING = {
    $elm : $('#loadingPlane'),
    show: function () {
        this.$elm.show();
    },
    hide: function () {
        this.$elm.hide();
    }
};

var APIS = (function () {
    var isLogin = false;
    return {
        host: localStorage.config_host,
        _reject: $.Deferred().reject(),
        login: function () {
            if (!APIS.host || !localStorage.config_userName) {
                return this._reject;
            }
            if (isLogin) {
                return $.Deferred().resolve(isLogin);
            }
            return $.post(`${this.host}/login.jsp`, {
                os_username: localStorage.config_userName,
                os_password: localStorage.config_password,
                os_destination: '',
                user_role: '',
                atl_token: '',
                login: 'Log In'
            }).then(function (data) {
                var match = data.match(/\/secure\/useravatar\?[^"]+/);
                if (match) {
                    isLogin = APIS.host + match[0];
                    return APIS.host + match[0];
                }
                return null;
            })
        },
        getbugs: function () {
            var self = this;
            return this.login().then(function (data) {
                var config_project = localStorage.config_project || '';
                if (!config_project) return self._reject;
                return $.get(`${self.host}/browse/SPM-1`, {
                    jql: `project in ("${localStorage.config_project.split(',').join('", "')}") AND issuetype = Bug AND status in (Open, "In Progress", Reopened) AND assignee in (currentUser()) ORDER BY priority DESC, updated DESC`
                }).then(function (data) {
                    var reg = /<ol class="issue-list">(.*)<\/ol>/;
                    var match = data.match(reg);
                    if (match) {
                        var matchs = match[1].match(/<li[^>]+/g);
                        if (matchs) {
                            return _.map(matchs, function (text) {
                                var idm = text.match(/data-id="([^"]+)/);
                                var keym = text.match(/data-key="([^"]+)/);
                                var titlem = text.match(/title="([^"]+)/);
                                return {
                                    id: idm?idm[1]: '',
                                    key: keym?keym[1]: '',
                                    title: titlem?titlem[1]: ''
                                }
                            })
                        }
                    }
                    return null;
                })
            });
        },
        _openBug: function (item, result) {
            var self = this;
            return $.get(`${self.host}/browse/${item.key}`)
                .then(function (data) {
                    var match = data.match(/"atlassian-token"\s+?content="([^"]+)/);
                    if (match) {
                        return match[1];
                    }
                }).then(function (atl_token) {
                    chrome.cookies.set({
                        url: self.host,
                        name: 'atlassian.xsrf.token',
                        value: atl_token
                    });
                    return $.get(`${self.host}/secure/WorkflowUIDispatcher.jspa`, {
                        decorator: 'dialog',
                        inline: true,
                        id: item.id,
                        atl_token: atl_token,
                        action: 4
                    })
            })
        },
        _fixBug: function (item, result) {
            var self = this;
            return $.get(`${self.host}/browse/${item.key}`)
                .then(function (data) {
                    var match = data.match(/"atlassian-token"\s+?content="([^"]+)/);
                    if (match) {
                        return match[1];
                    }
                }).then(function (atl_token) {
                    chrome.cookies.set({
                        url: self.host,
                        name: 'atlassian.xsrf.token',
                        value: atl_token
                    });
                    return $.get(`${self.host}/secure/WorkflowUIDispatcher.jspa`, {
                        decorator: 'dialog',
                        inline: true,
                        id: item.id,
                        atl_token: atl_token,
                        action: 5
                    }).then(function(data) {
                        var time = data.match(/name="worklog_startDate".*?value="([^"]+)/);
                        return $.post(`${self.host}/secure/CommentAssignIssue.jspa?atl_token=${atl_token}`, {
                            inline: true,
                            decorator: 'dialog',
                            action: 5,
                            id: item.id,
                            viewIssueKey: '',
                            resolution: result,
                            //fixVersions: 10101,
                            worklog_activate: true,
                            worklog_timeLogged: '',
                            worklog_startDate: time? time[1]: '',
                            worklog_adjustEstimate: 'auto',
                            isCreateIssue: false,
                            isEditIssue: false,
                            comment: '',
                            commentLevel: '',
                            atl_token: atl_token
                        }).then(function () {
                            LOADING.hide();
                        })
                    })
                })
        },
        fixBug: function (item, result) {
            var self = this;
            LOADING.show();
            return this.login().then(function (data) {
                return self._openBug(item, result)
            }).then(function (data) {
                var def = $.Deferred();
                setTimeout(function () {
                    self._fixBug(item, result).then(function () {
                        def.resolve();
                    })
                }, 1000)
                return def;
            })
        },
        getProjectList: function () {
            var self = this;
            return this.login().then(function (data) {
                return $.get(`${self.host}/secure/BrowseProjects.jspa?selectedCategory=all&selectedProjectType=all`)
                        .then(function (data) {
                            var reg = /WRM\._unparsedData\["com\.atlassian\.jira\.project\.browse:projects"\]="(.*?\}])";/
                            var match = data.match(reg);
                            if (match) {
                                return _.map(JSON.parse(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')), function (item) {
                                    return {
                                        key: item.key,
                                        name: item.name
                                    }
                                });
                            }
                        })
            })
        },
        getTimeLines: function () {
            var self = this;
            return this.login().then(function () {
                return $.get(`${self.host}/secure/TempoUserBoard!timesheet.jspa`)
                    .then(function (data) {
                        var tr = data.match(/<tr .+? log-activity [\d\D]+?<\/tr>/)[0];
                        var tds = tr.match(/class="day [\d\D]+?<\/span>/g);
                        var reg = /abbr="(\d+)[\d\D]+class="p(\d+)/;
                        var res  = {};
                        _.forEach(tds, function (td) {
                            var m = td.match(reg);
                            var mt = m[1].match(/^(\d{2})(\d{2})(\d{4})$/);
                            res[`${mt[3]}-${mt[2]}-${mt[1]}`] = m[2];
                        })
                        return res;
                    })
                })
        }
    };
})();

var UTILS = (function () {
    return {
        openUrl: function (optionUrl, filter) {
            chrome.tabs.getAllInWindow(null, function(tabs) {
                var optionTab = tabs.filter(filter);
                if (optionTab.length) {
                    chrome.tabs.update(optionTab[0].id, {url: optionUrl, selected: true});
                } else {
                    chrome.tabs.create({url: optionUrl, selected: true})
                }
            });
        },
        setBKData: function (key, val) {
            var bgWin = chrome.extension.getBackgroundPage();
            if (bgWin && bgWin.page) {
                bgWin.page[key] = val;
            }
        },
        getBKData: function (key, val) {
            var bgWin = chrome.extension.getBackgroundPage();
            if (bgWin && bgWin.page) {
                return bgWin.page[key] || ''
            }
            return '';
        },
    }
})()
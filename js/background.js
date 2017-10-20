var page = (function () {
    var headImage =  new Image();
    var canvas = document.getElementById('canvas');
    var canvasContext = canvas.getContext('2d');
    var hasPic = false;
    return {
        setHeadPic: function () {
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            canvasContext.drawImage(headImage, 0, 0 , canvas.width, canvas.height);
            canvasContext.restore();
            chrome.browserAction.setIcon({
                imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height)
            });
        },
        init: function () {
            var self = this;
            headImage.onload = this.setHeadPic;
            this.rushBugs(true);
            window.setInterval(function () {
                //self.rushBugs(true);
            }, 5 * 1000);
        },
        rushBugs: function (isAjax, len) {
            if (isAjax) {
                APIS.login().then(function (headUrl) {
                    if (headUrl && !hasPic) {
                        hasPic = true;
                        chrome.browserAction.setBadgeBackgroundColor({color: [190, 190, 190, 230]});
                        chrome.browserAction.setBadgeText({text: "?"});
                        headImage.src = headUrl;
                        return APIS.getbugs();
                    }
                }).then(function (bugs) {
                    if (bugs) {
                        chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
                        chrome.browserAction.setBadgeText({text: "" + bugs.length});
                    } else {
                        chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
                        chrome.browserAction.setBadgeText({text: ""});
                    }
                });
            } else {
                if (len) {
                    chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
                    chrome.browserAction.setBadgeText({text: "" + len});
                } else {
                    chrome.browserAction.setBadgeText({text: ""});
                }
            }
        }
    }
})();
page.init();

jsonRpc._send = function (obj) {
    if (obj._tabId == 'all') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: 'jira-help-jsonRpc', obj: obj});
        });
    } else {
        chrome.tabs.sendMessage(obj._tabId, {type: 'jira-help-jsonRpc', obj: obj});
    }
}
chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request.type == 'jira-help-jsonRpc') {
        request.obj._tabId = sender.tab.id;
        jsonRpc.onMessage(request.obj);
    }
});

jsonRpc.addCommand('getTimelist', function (k) {
    var dtd = $.Deferred(); 
    IMG_DB.getList(function (list) {
        dtd.resolve(list);
    })
    return dtd;
});


jsonRpc.addCommand('getJiraHost', function (k) {
    return localStorage.config_host;
});
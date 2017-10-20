jsonRpc._send = function (obj) {
    chrome.extension.sendMessage({
        type : 'jira-help-jsonRpc',
        obj: obj
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request.type == 'jira-help-jsonRpc') {
        jsonRpc.onMessage(request.obj);
    }
});

var $list;
jsonRpc.exec('getJiraHost', [], function (host) {
    if (location.href.indexOf(host) !== -1) {
        $('#create_link').on('click', function () {
            jsonRpc.exec('getTimelist', [], function (res) {
                if (!$list) {
                    var $list = $(`<div class="img-box">
                        <style>
                        .img-box { 
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 230px;
                            height: 100vh;
                            background: #535353;
                            z-index: 999999;
                            overflow: auto;
                        }
                        .img-warper{height : 100%;}
                        .img-warper img {
                            display: block;
                            max-width: 200px;
                            margin: 10px auto 0 auto;
                        }
                        .img-warper .img-item-title {
                            color: white;
                            text-align: center;
                            height: 20px;
                            overflow: hidden;
                        }
                        </style>
                        <div class="img-warper"></div>
                    </div>`).appendTo('body');
                }
                var html = [];
                $.each(res, function () {
                    html.push(`<div class="img-item">
                        <img src="${this.imgData}" title="${this.url}">
                        <div class="img-item-title">${this.title}</div>
                    </div>`)
                })
                $list.find('.img-warper').html(html.join(''))
            })
        });
    }
})

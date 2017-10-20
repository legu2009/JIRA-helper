var jsonRpc = (function (undefined) {

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) === 'object Function';
    }

    function guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    var command = (function () {
        var map = {};
        return {
            exec: function (method, params, success, fail) {
                if (!map[method])
                    return fail(ERROR_MAP.Method_not_found);
                var res = map[method].apply(null, [params, success, fail]);
                if (res !== undefined) {
                    if (res.then) {
                        res.then(success, function (m) {
                            fail({
                                "code": -32001,
                                "message": m
                            })
                        })
                    } else {
                        success(res)
                    }
                }
            },
            remove: function (method) {
                map[method] = null;
            },
            add: function (method, fun) {
                map[method] = fun;
            }
        }
    })();

    var ERROR_MAP = {
        'Invalid_Request': {
            "code": -32600,
            "message": "Invalid Request"
        },
        'Method_not_found': {
            "code": -32601,
            "message": "Method not found"
        },
        'Parse_Error': {
            "code": -32700,
            "message": "Parse error"
        }
    }

    var noop = function () {};
    var _callback = {};
    var _getId = function () {
        return id++;
    };
    var _guid = guid();
    var id = 1;

    return {
        _send: function (obj) {
            this.onMessage(obj);
        },
        fail: function (res, mess) {
            this.sendMessage({
                error: res
            }, mess);
        },
        success: function (res, mess) {
            this.sendMessage({
                result: res
            }, mess);
        },
        result: function (mess, isError) {
            var _ck = _callback[mess.id];
            if (_ck) {
                if (!isError) {
                    _ck(mess.result);
                }
                _callback[mess.id] = null;
            }
        },
        onMessage: function (mess) {
            if (mess.jsonrpc !== "2.0")
                return this.fail(ERROR_MAP.Invalid_Request, mess);
            if (!mess.id && mess.id !== 0)
                return false;

            if (mess.result || mess.error) {
                if (mess._guid && mess._guid != _guid) {
                    return;
                }
                this.result(mess, !!mess.error);
            } else if (mess.method) {
                if (mess.hasCallBack) {
                    command.exec(mess.method, mess.params, function (res) {
                        jsonRpc.success(res, mess);
                    }, function (res) {
                        jsonRpc.fail(res, mess);
                    })
                } else {
                    command.exec(mess.method, mess.params, noop, noop);
                }
            }
        },
        exec: function (method, params, callback) {
            if (params === undefined && callback === undefined) {
                params = [];
                callback = false;
            } else if (callback === undefined) {
                if (isFunction(params)) {
                    callback = params;
                    params = [];
                } else {
                    callback = false;
                }
            }
            var id = _getId();
            if (callback)
                _callback[id] = callback;
            this.sendMessage({
                method: method,
                params: params
            }, {
                hasCallBack: !!callback,
                _guid: _guid,
                id: id
            });
        },
        sendMessage: function (obj, mess) {
            obj.jsonrpc = '2.0';
            obj.id = mess.id;
            obj._guid = mess._guid;
            obj._tabId = mess._tabId || 'all';
            obj.hasCallBack = mess.hasCallBack;
            this._send(obj);
        },
        addCommand: command.add,
        removeCommand: command.remove
    };
})();
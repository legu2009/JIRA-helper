var IMG_DB = (function () {
    var db = openDatabase('jiradb', '2.0', 'jiradb', 2 * 1024 * 1024);
    db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS IMGLOG (id unique, title, url, imgData)');
    });
    return {
        insert: function (obj, callback) {
            var id = +new Date();
            db.transaction(function (tx) {
                tx.executeSql(`SELECT id FROM IMGLOG ORDER BY id desc`, [], function (tx, results) { 
                    var len = results.rows.length;
                    var item;
                    var res = [];
                    for (var i = 9; i< len; i++) {
                        res.push(results.rows.item(i).id);
                    }
                    if (res.length > 0) {
                        tx.executeSql(`DELETE FROM IMGLOG where id in (${res.join(',')})`);
                    }
                    tx.executeSql(`INSERT INTO IMGLOG (id, title, url, imgData) VALUES (${id}, "${obj.title}", "${obj.url}", "${obj.imgData}")`, [], function (tx, results) { 
                        callback && callback(id);
                    });
                })
            });
            
        },
        getList: function (callback) {
            db.transaction(function (tx) { 
                tx.executeSql(`SELECT id, title, url, imgData FROM IMGLOG ORDER BY id desc`, [], function (tx, results) { 
                    var res = [], item;
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){
                        item = results.rows.item(i);
                        res.push({
                            imgData: item.imgData,
                            url: decodeURIComponent(item.url),
                            title: item.title,
                            id: item.id
                        });
                    }
                    callback(res);
                }, null);
            });
        },
        delItemId: function (id) {
            db.transaction(function (tx) {
                tx.executeSql(`DELETE FROM IMGLOG where id = ${id}`);
            });
        },
        update: function (id) {
            var _id = +new Date();
            db.transaction(function (tx) {
                tx.executeSql(`UPDATE IMGLOG SET id = ${_id} WHERE id = ${id}`);
            });
        }
    }
})();

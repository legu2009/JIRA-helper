var TIME_DB = (function () {
    var db = openDatabase('jiradb', '2.0', 'jiradb', 2 * 1024 * 1024);
    
    db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS TIMELOG (id unique, day, hour, log)');
    });
    
    var _id = 0;
    db.transaction(function (tx) { 
        tx.executeSql('SELECT max(id) as id FROM TIMELOG', [], function (tx, results) {
            if (results.rows.length) {
                _id = results.rows.item(0).id
            }
       }, null);
    });

    return {
        insert: function (txt) {
            var mot = moment();
            var id = ++_id;
            db.transaction(function (tx) {
                tx.executeSql(`INSERT INTO TIMELOG (id, day, hour, log) VALUES (${id}, "${mot.format('YYYY-MM-DD')}", "${mot.format('HH')}", "${txt}")`);
            });
            return id;
        },
        getTimeLine: function (day, callback) {
            db.transaction(function (tx) { 
                tx.executeSql(`SELECT id, hour, log FROM TIMELOG where day="${day}" ORDER BY hour`, [], function (tx, results) { 
                    var res = [], item;
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){
                        item = results.rows.item(i);
                        res.push({
                            hour: item.hour,
                            log: item.log,
                            id: item.id
                        })
                    }
                    callback(res);
                }, null);
            });
        },
        delTimeLine: function (day) {
            db.transaction(function (tx) {
                tx.executeSql(`DELETE FROM TIMELOG where day="${day}"`);
            });
        },
        delTimeLineId: function (id) {
            db.transaction(function (tx) {
                tx.executeSql(`DELETE FROM TIMELOG where id=${id}`);
            });
        }
    }
})();

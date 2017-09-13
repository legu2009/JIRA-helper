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
        insert: function (txt, day, hour) {
            var mot = moment();
            var id = ++_id;
            hour = hour || mot.format('HH');
            day =  day || mot.format('YYYY-MM-DD');
            db.transaction(function (tx) {
                tx.executeSql(`INSERT INTO TIMELOG (id, day, hour, log) VALUES (${id}, "${day}", "${hour}", "${txt}")`);
            });
            return id;
        },
        getTimeLine: function (day, callback) {
            db.transaction(function (tx) { 
                tx.executeSql(`SELECT id, hour, log FROM TIMELOG where day="${day}" ORDER BY hour`, [], function (tx, results) { 
                    var res = [], item;
                    var len = results.rows.length, i;
                    var _hour = '';
                    var tmp;
                    for (i = 0; i < len; i++){
                        item = results.rows.item(i);
                        if (_hour != item.hour) {
                            tmp = [];
                            res.push({hour: item.hour, items: tmp});
                            _hour = item.hour;
                        }
                        tmp.push({
                            hour: item.hour,
                            log: item.log,
                            id: item.id
                        });
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

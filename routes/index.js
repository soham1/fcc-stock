var express = require('express');
var fs = require('fs');
var moment = require('moment');
var async = require('async');
var jsonfile = require('jsonfile');
var util = require('util');
var rp = require('request-promise');
var router = express.Router();
var allDataAll = [];

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

function getExistingData(word) {
    for (var i = 0; i < allDataAll.length; i++) {
        if (word === allDataAll[i].Elements[0].Symbol) {
            return allDataAll[i];
        }
    }
    try {
        var fileInfo = fs.statSync('data/' + word + '.json');
        console.log("Got info of file");
        var currTime = moment();
        //console.log("Current time", currTime);
        if (fileInfo) {
            var startDate = moment(fileInfo.ctime);
            //console.log("Start Date", startDate);
            var daysDiff = currTime.diff(startDate, 'days');
            console.log("Date difference", daysDiff);
            if (daysDiff > 1) {
                return false;
            }
            else {
                return jsonfile.readFileSync('data/' + word + '.json');
            }
        }
    }
    catch (e) {
        console.log("Read error", e);
    }
}

router.get('/api/getData', function(req, res) {
    console.log("Word array", req.wordArray);
    var allData = [];
    async.each(req.wordArray, function(word, callback) {
        var url = 'http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/json?parameters={"Normalized":false,"NumberOfDays":365,"DataPeriod":"Day","Elements":[{"Symbol":"' + word + '","Type":"price","Params":["c"]}]}';
        console.log(word);
        console.log("URL", url);
        var wordObject = getExistingData(word);
        if (wordObject) {
            console.log("Getting from cache");
            allData.push(wordObject);
            callback();
        }
        else {
            rp(url)
                .then(function(data) {
                    //console.log("Got data", data);
                    var json = JSON.parse(data);
                    allData.push(json);
                    console.log("Element", json.Elements[0].Symbol);
                    allDataAll.push(json);

                    var file = 'data/' + json.Elements[0].Symbol + '.json';
                    jsonfile.writeFileSync(file, json, {
                        spaces: 2
                    });

                    callback();
                })
                .catch(function(err) {
                    console.log("Got error from server");
                    callback("error");
                    res.json({
                        error: "server-error",
                        word: word
                    });
                });
        }

    }, function(err) {
        if (err) {
            console.log('Failed to process');
        }
        else {
            console.log('All done');
            res.json(allData);
        }
    });

});
module.exports = router;

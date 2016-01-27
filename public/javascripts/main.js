$(function() {
    var template;
    var socket;
    var syncData = [];
    var lastWord = "";
    init();

    function init() {
        initHandlebars();
        initGoogleCharts();
        initSocket();
        removeHandler();
        formSubmit();
    }

    function initHandlebars() {
        var source = $("#word-template").html();
        template = Handlebars.compile(source);
    }

    function initGoogleCharts() {
        google.charts.load('current', {
            'packages': ['line']
        });
        google.charts.setOnLoadCallback(function() {
            console.log("Libs Loaded");
        });
    }

    function drawGraph(wordsArray) {
        console.log("Data for graph", wordsArray);
        $("#progressBar").show();
        var rows = [];

        for (var i = 0; i < wordsArray[0].Dates.length; i++) {
            var oneRow = [wordsArray[0].Dates[i].substring(0, 10)];
            for (var m = 0; m < wordsArray.length; m++) {
                oneRow.push(0);
            }
            rows.push(oneRow);
        }

        console.log("Printed rows of first word", rows.length);

        //console.log("Rows first column", rows);
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Days');

        for (var j = 0; j < wordsArray.length; j++) {
            console.log("Adding " + wordsArray[j].Elements[0].Symbol);
            data.addColumn('number', wordsArray[j].Elements[0].Symbol);
            for (var z = 0; z < wordsArray[j].Elements[0].DataSeries.close.values.length; z++) {
                //console.log("Pushing", wordsArray[j].Elements[0].DataSeries.close.values[z]);
                if (z < rows.length) {
                    rows[z][j + 1] = wordsArray[j].Elements[0].DataSeries.close.values[z];
                }
                else {
                    console.log("Adding a row for", z, wordsArray[j].Elements[0].Symbol);
                    var row = [wordsArray[j].Dates[z].substring(0, 10)];
                    for (var m = 0; m < wordsArray.length; m++) {
                        row.push(wordsArray[m].Elements[0].DataSeries.close.values[z - 1]);
                    }
                    row[j + 1] = wordsArray[j].Elements[0].DataSeries.close.values[z];
                    rows.push(row);
                }
            }
        }
        console.log("rows", rows);
        data.addRows(rows);

        var options = {
            chart: {
                title: 'Stock Prices From Last Year',
                subtitle: 'In dollars (USD)'
            },
            width: 1000,
            height: 500,
            hAxis: {
                title: "Days",
                direction: -1,
                slantedText: true,
                slantedTextAngle: 90
            }
        };

        var chart = new google.charts.Line(document.getElementById('chart_div'));

        chart.draw(data, options);

        $("#progressBar").hide();
        $("#chart_div").fadeIn(2000);
    }


    function jsonReq() {
        $.ajax({
                url: "/api/getData",
                dataType: "json"
            })
            .done(function(data) {
                if (data.error === "server-error") {
                    $("#" + data.word).remove();
                    deleteWord(data.word);
                    if (lastWord === data.word) {
                        Materialize.toast('Unable to fetch stocks.', 2000);
                        console.log("Send Toastr");
                    }
                }
                else {
                    lastWord = "";
                }
                console.log("Data", data);
                $("#chart_div").hide();
                drawGraph(data);
            });
    }

    function formSubmit() {
        $("#addForm").on("submit", function(e) {
            e.preventDefault();
            if ($("#" + $("#newWord").val()).length > 0) {
                return;
            }
            else {
                addHandler($("#newWord").val());
            }
        });
    }

    function addHandler(word) {
        lastWord = word;
        socket.emit("add", {
            "word": word
        });
    }

    function deleteWord(word) {
        console.log("Asking server to delete", word);
        socket.emit("delete", {
            "word": word
        });
    }

    function removeHandler() {
        $("#wordList").on("click", "a.remove", function(e) {
            console.log("In remove handler");
            e.preventDefault();
            var id = $(e.target).data("word");
            console.log("Id", id, e.target);
            deleteWord(id);
        });
    }

    function renderWords(wordsObject) {
        //console.log("Words Object", wordsObject);
        var html = template(wordsObject);
        //console.log("HTML", html);
        $("#wordList").empty().append(html);
        jsonReq();
    }

    function initSocket() {
        socket = io.connect();
        console.log("Connecting");
        socket.on('Words Changed', function(wordsObject) {
            console.log("Got words changed");
            renderWords(wordsObject);
        });

        socket.on('Come and get new words', function() {
            console.log("Got new words");
            socket.emit("Send me");
        });
    };

});

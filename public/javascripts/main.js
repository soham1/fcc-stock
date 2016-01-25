$(function() {
    var template;
    var socket;
    var syncData = [];
    init();

    function init() {
        var source = $("#word-template").html();
        template = Handlebars.compile(source);
        google.charts.load('current', {
            'packages': ['line']
        });
        google.charts.setOnLoadCallback(function() {
            console.log("Libs Loaded");
        });
        initSocket();
        removeHandler();
        formSubmit();
    }

    function drawGraph(wordsArray) {
        console.log("Data for graph", wordsArray);
        var rows = [];
        
        for (var i = 0; i < wordsArray[0].Dates.length; i++) {
            rows.push([wordsArray[0].Dates[i].substring(0,10)]);
        }
        
        console.log("Rows first column", rows);
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Days');

        for (var j = 0; j < wordsArray.length; j++) {
            console.log("Adding " + wordsArray[j].Elements[0].Symbol);
            data.addColumn('number', wordsArray[j].Elements[0].Symbol);
            for(var z = 0; z < wordsArray[j].Elements[0].DataSeries.close.values.length; z++){
                rows[z].push(wordsArray[j].Elements[0].DataSeries.close.values[z]);
            }
        }
        console.log("rows", rows);
        data.addRows(rows);

        var options = {
            chart: {
                title: 'Stock Price From Last Year',
                subtitle: 'In dollars (USD)'
            },
            width: 1000,
            height: 500,
            hAxis: {title: "Days" , direction:-1, slantedText:true, slantedTextAngle:90 }
        };

        var chart = new google.charts.Line(document.getElementById('chart_div'));

        chart.draw(data, options);
    }


    function jsonReq() {
        $.ajax({
                url: "/api/getData",
                dataType: "json"
            })
            .done(function(data) {
                if(data.error === "server-error"){
                    $("#"+data.word).remove();
                    deleteWord(data.word);
                }
                console.log("Data", data);
                drawGraph(data);
                //syncData.push(word, data);
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
        $("#wordList").on("click", "li .remove", function(e) {
            console.log("In remove handler");
            e.preventDefault();
            var id = $(e.target).data("word");
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

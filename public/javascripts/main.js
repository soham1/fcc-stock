$(function() {
    var template;
    var socket;
    init();

    function init() {
        var source = $("#word-template").html();
        template = Handlebars.compile(source);
        initSocket();
        removeHandler();
        formSubmit();
    }
    
    function formSubmit() {
        $("#addForm").on("submit", function(e){
            e.preventDefault();
            if($("#" + $("#newWord").val()).length > 0){
                return;
            }else{
                addHandler($("#newWord").val());
            }
        });
    }
    
    function addHandler(word) {
        socket.emit("add", {"word": word});    
    }
    
    function deleteWord(word) {
        socket.emit("delete", {"word": word});
    }
    
    function removeHandler() {
        $("#wordList").on("click", "li .remove", function(e) {
            e.preventDefault();
            var id = $(e.target).data("word");
            deleteWord(id);
        });
    }

    function renderWords(wordsObject) {
        console.log(wordsObject);
        var html = template(wordsObject);
        console.log("HTML", html);
        $("#wordList").empty().append(html);
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

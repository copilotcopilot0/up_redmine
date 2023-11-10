window.loadingInterval = '';
window.isLoadDone = 1;

function getTaskIDByStrURL(strUrl){
    taskId = strUrl.match(/^https:\/\/project\.lampart\-vn\.com\/issues\/\d+/g);
    if(taskId !== null && typeof taskId !== "undefined"){
        taskId = taskId[0].split("/issues/");
        taskId = parseInt(taskId[1]);
        if(typeof taskId == "number"){
            return taskId;
        }
    }
    return false;
}

function removeLoading(){
    $("#up_redmine_loading").hide();
    clearInterval(window.loadingInterval);
}


function loading() {
    window.isLoadDone = 0;
    $("#up_redmine_loading").show();
    $("#up_redmine_loading").html("loading.");
    window.loadingInterval = setInterval(function () {
        if(window.isLoadDone == 1){
            removeLoading();
        }else {
            var text = $("#up_redmine_loading").html();
            var dot = text.split("loading")[1];
            if(dot.length == 10){
                $("#up_redmine_loading").html("loading.");
            }else{
                $("#up_redmine_loading").html(text + ".");
            }
        }
    }, 80);
}
// var bkg = chrome.extension.getBackgroundPage();
//
// function hello() {
// 	  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     if(!tabs[0].url.includes('https://www.chatwork.com')) {
//       alert('please go to https://www.chatwork.com')
//       return
//     }
//
//     chrome.tabs.sendMessage(tabs[0].id, {abc:"zzz"});
//   });
// }




$( document ).ready(function() {
    chrome.runtime.getBackgroundPage(function (bkg) {

        //read data
        readData();

        $(".show_pass").on('click', function(e){
            var x = $(this).parents( ".form-group" ).find("input")[0];
            if (x.type === "password") {
                x.type = "text";
            } else {
                x.type = "password";
            }
        });

        $(".btn[type=submit]").on('click', function(e){
            e.preventDefault();
            loading();
            var data = getDataFromGui();
            setTimeout(function () {
                bkg.saveInfoFromStore(data).then(function (value) {
                    setDataIntoGui(value[6]);
                    var ms = '';
                    var a = bkg.checkLoginRedmine();
                    if(typeof a == 'undefined'){
                        ms += '\nLogin REDMINE failed ';
                    }
                    var a = bkg.checkLoginHito();
                    if(a == false){
                        ms += '\nLogin HITO failed ';
                    }
                    if (ms == ''){
                        ms = 'Success !';
                    }
                    window.isLoadDone = 1;
                    alert(ms);
                });
            }, 800);


        });

        function readData(){
            bkg.loadInfoFromStore().then(function (value) {
                setDataIntoGui(value);
            })
        }

        function setDataIntoGui(data){
            $("[name=user_hito]").val(data.HITO[0]);
            $("[name=pass_hito]").val(data.HITO[1]);
            $("[name=user_redmine]").val(data.REDMINE[0]);
            $("[name=pass_redmine]").val(data.REDMINE[1]);
            $("[name=o_position][value="+data.O_POSITION[0]+"]").prop("checked", true);
            $("[name=link_filter]").val(data.link_filter);
        }
        


        function getDataFromGui(){
            var user_hito    = $("[name=user_hito]").val();
            var pass_hito    = $("[name=pass_hito]").val();
            var user_redmine = $("[name=user_redmine]").val();
            var pass_redmine = $("[name=pass_redmine]").val();
            var o_position   = $("[name=o_position]:checked").val();
            var link_filter  = $("[name=link_filter]").val();

            return {
                HITO : [
                    user_hito,
                    pass_hito
                ],
                REDMINE : [
                    user_redmine,
                    pass_redmine
                ],
                O_POSITION : [
                    o_position
                ],
                link_filter : link_filter
            };
        }
    });
});




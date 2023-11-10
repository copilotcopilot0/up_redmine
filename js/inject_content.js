Date.prototype.toStringDate = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
};
// receive message from content
document.addEventListener('load_template', function (e)
{
    var data=e.detail;
	//load content on menu top
	var content_top = '<div id="ext_menu_top"></div>';
	var content_btn_close = '<span></span>';
	$('#top-menu').append(content_top);
	$('#ext_menu_top').load(data.template_content);
	$("#for_ext").load(data.template_modal);
	if($("#content div.contextual").length > 0){
		$($("#content div.contextual")[0]).append(content_btn_close);
		$($("#content div.contextual span")[0]).load(data.template_btn_close);
	}
});
	$(window).on('click', function (e) {
		if ($(e.target).is('.modal-ext')) {
		  $('.modal-ext').hide();
		}
	});

$( document ).ready(function() {

    $( "body" ).on( "click",".modal-ext .close", function( event ) {
		$('.modal-ext').hide();
	});

	$( "body" ).on( "click",".close_task", function( event ) {
		event.preventDefault();
		if (confirm("Press a button!") == true) {
			setTimeout(function (){
				// send to content js
				window.postMessage({
					type    : "btn_close_task",
					task_id : window.location.href
				});
			}, "35");
		}
	});
	
    $( "body" ).on( "click",".ext_btn", function( event ) {
		event.preventDefault();
		$('.modal-ext').show();
	});
	
    $( "body" ).on( "click","#btn_ext_month", function( event ) {
    	$('.ext_time_img_loading').show();

		// clear 
		$(".modal-ext .timelog-content").empty();
		// load history today
		let month = $('[name=ext_month]').val();
		let dateNow = new Date();
		if(month != ''){
			dateNow = new Date(dateNow.getFullYear(), month-1, 1);
		}

		setTimeout(function (){
			// send to content js
			window.postMessage({
				type: "btn_ext_month",
				date:dateNow.toStringDate()
			});
		}, "35");

	});
    $( "body" ).on( "click",".btn_auto_fill", function( event ) {
		clearInputLogTime(this);
		let timeLeft = parseFloat( getTimeHito(this)) - getSumInputDisableLog(this);
		let inputTime = getListInputTime(this, 2);
		let timeBlock = timeLeft/0.25;
		let val = 0;
		while(timeBlock>0){
			$.each(inputTime, function(k,v){
				val = $(v).val().length > 0  ? $(v).val() : 0;
				val = parseFloat(val);
				val = val + 0.25;
				$(v).val(val);
				timeBlock = timeBlock - 1;
				if(timeBlock == 0){
					return false;
				}
			});
		}
		setTimeLeft(this);
	});
	
	$("body").on('keyup','[name=time_log]',function(e){
		setTimeLeft(this);
	});
	
    $( "body" ).on( "click",".btn_clear", function( event ) {
		clearInputLogTime(this);
	});
	

    $( "body" ).on( "click",".btn_update_time_log", function( event ) {
    	$(this).addClass('disabled');
		var me = this;
		var parent = $(me).parents('div.one_day');
		setTimeout(function(){
	 		let timeData = getObjTimeLog(me);
			// send to content js
			window.postMessage({
				type      : "btn_update_time_log",
				timeData  : timeData
			});
			// find  first h2 of parent
			let h2 = parent.find('h2:first');
			// fill background color red
			h2.css('background-color', 'red');

		}, "35");

	});
	
    $( "body" ).on( "change",'[name=block]', function( event ) {
        if(this.checked) {
            getInputByChild(this).prop('disabled', true);
        }else{
			getInputByChild(this).prop('disabled', false);
		}
	});

	
	function getInputByChild(child){
		return getItemByChild(child).find('[name=time_log],[name=time_log]:disabled');
	}
	
	function getItemByChild(child){
		return $(child).parents('tr.task_item');
	}
	
	function setTimeLeft(elementChild){
		let timeHito = getTimeHito(elementChild);
		let timeTotalInput = getSumInputLog(elementChild);
		$(elementChild).parents("div.one_day").find("b.total_time_left").html(timeHito - timeTotalInput);
	}
	
	function getTimeHito(elementChild){
		let rf = $(elementChild).parents("div.one_day").find("b.total_time_hito").html();
		rf = parseFloat(rf);
		return rf;
	}

    function getTimeWorking(elementChild){
        let rf = $(elementChild).parents("div.one_day").find("b.total_time_work").html();
        rf = parseFloat(rf);
        return rf;
    }

    function getTimeRedmine(elementChild){
        let rf = $(elementChild).parents("div.one_day").find("b.total_time_redmine").html();
        rf = parseFloat(rf);
        return rf;
    }
	
	function getSumInputDisableLog(elementChild){
		let sum = parseFloat(0);
		let inputs = $(elementChild).parents("div.one_day").find('[name=time_log]:disabled');
		let i = 0
		$.each(inputs, function(k, v){
			i = parseFloat($(v).val());
			sum = sum + i;
		});
		return sum;
	}
	
	function getSumInputLog(elementChild){
		let sum = parseFloat(0);
		let inputs = $(elementChild).parents("div.one_day").find('[name=time_log],[name=time_log]:disabled');
		let i = 0
		$.each(inputs, function(k, v){
			i = parseFloat($(v).val());
			sum = sum + i;
		});
		return sum;
	}
	
	function clearInputLogTime(elementChild){
		$(elementChild).parents("div.one_day").find('[name=time_log]:not(:disabled)').val(0);
		setTimeLeft(elementChild);
	}
	
	function getObjTimeLog(elementChild){
        let data = [];
		let divDate = $(elementChild).parents("div.one_day");
		let ulTasks = divDate.find("div.tasks");
		let listTagLi = ulTasks.find('tr.task_item');
		let date = getDate(elementChild);
		let task = 0;
		let time = 0;
		let tracker = '';
		let activity = 0;
		let comment = "";
		$.each(listTagLi, function(k,v){
			task = $(v).attr('taskid');
			time = $(v).find('input[name=time_log],input[name=time_log]:disabled').val();
			tracker = $(v).find('input[name=tracker]').val();
			activity = $(v).find('[name=activity]').val();
			comment = $(v).find('[name=comment]').val();
			if(time.length == 0){
				time = 0;
			}
			data.push({
				date:date,
				task:task,
				time:time,
				tracker:tracker,
				activity:activity,
				comment:comment,
			});
		});
		return data;
	}
	function getDate(elementChild){
		let date = $(elementChild).parents("div.one_day").attr('date');
		return date;
	}
	function getTimeLeft(elementChild){
		let time = $(elementChild).parents("div.one_day").find("b.total_time_left").html();
		return parseFloat(time);
	}
	
	function getListInputTime(elementChild, isGetAll = 1){
		let data = [];
		let divDate = $(elementChild).parents("div.one_day");
		let ulTasks = divDate.find("div.tasks");
		let listTagLi = ulTasks.find('tr.task_item');
		if(isGetAll == 1){
			return listTagLi.find('input[name=time_log],input[name=time_log]:disabled');
		}else{
			return listTagLi.find('input[name=time_log]:not(:disabled)');
		}
		
	}
});
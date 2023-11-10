
const REDMINEDOMAIN         = config.redmine.REDMINEDOMAIN;
const REDMINE_DOMAIN_ISSUES = config.redmine.REDMINE_DOMAIN_ISSUES;
const USER_ID = 160;
const TASK_OTHER = 634;
const TASK_SUPPORT = 20339;
var uRedmine = '';
var pRedmine = '';

// 1 PG
// 2 QC
// 3 ITC
var O_POSITION = 1;
var tracker    = [];

chrome.runtime.sendMessage({type: "get_info_login"})

Date.prototype.toStringDate = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
};
Date.prototype.toStringMonth = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  return (mm>9 ? '' : '0') + mm;
};
var lastday = function lastday(y,m){
	return  new Date(y, m +1, 0).getDate();
};
$(window).on('load', function(){
	function injectScript(file, node) {
		var th = document.getElementsByTagName(node)[0];
		var s = document.createElement('script');
		s.setAttribute('type', 'text/javascript');
		s.setAttribute('src', file);
		s.onload = function(){
			var template_content=chrome.runtime.getURL("/template/popup.html");
			var template_modal=chrome.runtime.getURL("/template/modal.html");
			var template_btn_close=chrome.runtime.getURL("/template/btn_close_task.html");
			var src_img =chrome.runtime.getURL("/img/");
			var data = {
				template_content:template_content,
				template_modal:template_modal,
				template_btn_close:template_btn_close,
				src_img: src_img
			};
			//send to injectScript
			var evt=document.createEvent("CustomEvent");
			evt.initCustomEvent("load_template", true, true, data);
			document.dispatchEvent(evt);
		};
		th.appendChild(s);
	}
	function injectCSS(file){
		var th = document.getElementsByTagName('head')[0];
		var s = document.createElement('link');
		s.setAttribute('rel', 'stylesheet');
		s.setAttribute('href', file);
		th.appendChild(s);
	}
	function injectHTML(){
		var th = document.getElementsByTagName('body')[0];
		var s = document.createElement('div');
		s.setAttribute('id', 'for_ext');
		th.appendChild(s);
	}

	function injectImg(){
		var flag = false;
		$.each($("img[class*='ext_time_img']"), function(k,v){
			var src = $(v).attr('src');
			src = chrome.runtime.getURL("/img/") + src;
			$(v).attr('src',src);
			flag=true;
		});
		return flag;
	}
	//injectScript( chrome.extension.getURL('/common.js'), 'body');
	injectScript( chrome.extension.getURL('/js/inject_content.js'), 'body');
	injectCSS(chrome.extension.getURL('/css/ext_plugin.css'));
	injectHTML();


	var targetNode = $('body')[0]
	// Options for the observer (which mutations to observe)
	const config = { attributes: true, childList: true, subtree: true };

	// Callback function to execute when mutations are observed
	const callback = function(mutationList, observer) {
	    // Use traditional 'for loops' for IE 11
	    for (const mutation of mutationList) {
	        if (mutation.type === 'childList') {
	            //console.log('A child node has been added or removed.');
	            var a = injectImg();
	            if(a == true){
	            	observer.disconnect();
	            }
	        }
	        else if (mutation.type === 'attributes') {
	            //console.log(`The ${mutation.attributeName} attribute was modified.`);
	        }
	        else if (mutation.type === 'subtree') {
	            //console.log(`The ${mutation.attributeName} attribute was modified.`);
	        }
	    }
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);

	// Later, you can stop observing
	//observer.disconnect();

});

// receive message from backgroud
chrome.runtime.onMessage.addListener(gotMessage)
function gotMessage (request, sender, sendResponse) {
	
	if(request.type == "btn_ext_month"){
  		let timeRedmin = getTimeFromRedmine(new Date(request.date));
		let timeHito   = request.timeHito;
		let times      = compareTimeRedmineHito(timeHito, timeRedmin);
		let dataHistory = request.dataHistory;
		let data           = addHistoryToTimes(times, dataHistory);
		let strHTML        = createHTMLOneMonth(data);
		$(".modal-ext .timelog-content").append(strHTML);
		$(".ext_time_img_loading").hide();
	}

    if(request.type == "get_info_login"){
        uRedmine   = request.data.REDMINE[0];
        pRedmine   = request.data.REDMINE[1];
		// string to int

		O_POSITION = request.data.O_POSITION[0];
		O_POSITION = parseInt(O_POSITION);

		switch (O_POSITION) {
			case 1: // PG
				tracker = config.redmine.staff.PG.trackers;
				break;
			case 2: // QC
				tracker = config.redmine.staff.QC.trackers;
				break;
			default:
				tracker = config.redmine.staff.PG.trackers;
				break;
		}
    }

    if(request.type == "show_alert"){//show errer
		showAlert(request.ms);
	}

    if(request.type == "check_login_redmine"){//show errer
        var a = checkLoginRedmine();
        if(typeof a == 'undefined'){
            sendResponse({type: "check_login_redmine", check_login_redmine: 0})
        }else{
            sendResponse({type: "check_login_redmine", check_login_redmine: 1})
        }
    }

}

function showAlert(string){
	$(".ext_time_img_loading").hide();
	alert(string);
}


// function filterRedmineByDateNow(time) {
//
// 	let status = [1, 2, 3, 4, 5, 6, 7, 8];
// 	let trackers = [6, 7, 18, 5, 10, 11, 1, 9, 23, 24, 25, 27,32];
// 	let date_now = new Date().toJSON().slice(0,10).replace(/-/g,'-');
//
// 	let data_filter_issue = {
// 		"status_id": status.join("|"),
// 		"assigned_to_id":  window.user_id,
// 		"tracker_id": trackers.join("|"),
// 	}
//
// 	let strParamApi = '?start_date=%3C%3D' + time + '&due_date=%3E%3D' + time;
//
// 	// let param_issue =
// 	return $.ajax({
// 		async: false,
// 		url: config.redmine.REDMINEDOMAIN + config.redmine.API_ISSUE + strParamApi,
// 		type:"GET",
// 		data: data_filter_issue,
// 		contentType:"application/x-www-form-urlencoded; charset=utf-8",
// 		headers: {
// 			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
// 		},
// 		success: function(data, status, xhr){
// 			return data;
// 		}
// 	}).responseJSON;
// }


function filterRedmineByDateNow_updateBy(time) {
	let status = [1, 2, 3, 4, 5, 6, 7, 8];

	// let param_issue =
	let data_filter_issue = {
		"updated_by":  window.user_id,
		"status_id": status.join("|"),
		"tracker_id": tracker.join("|"),
		"child_id"  : "!*", // not subtask
	}

	let strParamApi = '?start_date=%3C%3D' + time + '&due_date=%3E%3D' + time;

	// let param_issue =
	return $.ajax({
		async: false,
		url: config.redmine.REDMINEDOMAIN + config.redmine.API_ISSUE + strParamApi,
		type:"GET",
		data: data_filter_issue,
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		headers: {
			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		},
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;
}

function filterRedmineByDateNow_assignedBy(time) {
	let status = [1, 2, 3, 4, 5, 6, 7, 8];
	// let param_issue =
	let data_filter_issue = {
		"assigned_to_id":  window.user_id,
		"status_id": status.join("|"),
		"tracker_id": tracker.join("|"),
		"child_id"  : "!*", // not subtask
	}

	let strParamApi = '?start_date=%3C%3D' + time + '&due_date=%3E%3D' + time;

	// let param_issue =
	return $.ajax({
		async: false,
		url: config.redmine.REDMINEDOMAIN + config.redmine.API_ISSUE + strParamApi,
		type:"GET",
		data: data_filter_issue,
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		headers: {
			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		},
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;
}


function addHistoryToTimes(times, dataHistory){
	var dateHis;
	var taskId;
	var i = 0 ;
	if(config.genera.is_scan_history == 0){
		dataHistory = [];
	}
	$.each(times, function(k_times, v_time){

		if(v_time.time > 0){
			var tasks = {
				default : [],
				process : [],
				//history: [],
			};
			$.each(config_task_config.task_default,function(k,v){
				var task_tmp = getInfoIssues(v.task_id);
				tasks.default.push({
					id: task_tmp.id,
					subject: task_tmp.subject,
					tracker: task_tmp.tracker,
					defaultVal: v.time_default,
					activitys:v.activitys,
					lock:v.lock,
				});
			});
			$.each(dataHistory, function(k_his, v_his){
				dateHis = new Date(v_his.lastVisitTime).toStringDate();
				if(v_time.date ==  dateHis){
					taskId = v_his.url.match(/^https:\/\/project\.lampart\-vn\.com\/issues\/\d+/g);
					if(taskId !== null && typeof taskId !== "undefined"){
						taskId = taskId[0].split("/issues/");
						taskId = parseInt(taskId[1]);
						if(typeof taskId == "number"){
							var a = filterFindTask(taskId);
							tasks.history = tasks.history.concat(a);
						}
					}
				}
			});
			
			var temp = [];
			// remove duplication ==))))
			$.each(tasks.history, function(k_tem, v_tem){
				
				var i = 0;
				$.each(temp, function(k_tm, v_tm){
					if(v_tem.id == v_tm.id){
						i = 1;
						return false;
					}
				});
				if(i == 0 ){
					temp.push(v_tem);
				}
			});

			if(config.genera.is_scan_history != 0){
				tasks.history = temp;
			}
			var data_filter_assignedBy = filterRedmineByDateNow_assignedBy(v_time.date);
			data_filter_assignedBy = data_filter_assignedBy.issues;
			var data_filter_updateBy   = filterRedmineByDateNow_updateBy(v_time.date);
			data_filter_updateBy = data_filter_updateBy.issues;
			tasks.process              = data_filter_assignedBy.concat(data_filter_updateBy);

			var temp1 = [];
			// remove duplication ==))))
			$.each(tasks.process, function(k_tem, v_tem){

				var i = 0;
				$.each(temp1, function(k_tm, v_tm){
					if(v_tem.id == v_tm.id){
						i = 1;
						return false;
					}
				});
				if(i == 0 ){
					temp1.push(v_tem);
				}
			});
			tasks.process = temp1;

			this.tasks = tasks;
			i++;
			if(config.genera.debug_limit_time > 0 &&  config.genera.debug_limit_time == i){
				return false;
			}
		}
	});

	
	return times;
}


const TASK_TYPE_NO_SUBTASK    = "NO_SUBTASK";
const TASK_TYPE_NORMAL        = "NORMAL";
const TASK_TYPE_PARENT_CODING = "TASK_PARENT_CODING";
const TASK_TYPE_BUG           = "TASK_BUG";
const TASK_TYPE_FB_NO_SUBTASK = "FB_NO_SUBTASK";
const TASK_TYPE_MID           = "MID_TASK";
function detectTypeTask(jsonDataTaskID){
	if(typeof jsonDataTaskID.children == "undefined"){
		if(jsonDataTaskID.tracker.name == "Feedback")
			return  TASK_TYPE_FB_NO_SUBTASK;
		if(jsonDataTaskID.tracker.name == "Bug")
			return  TASK_TYPE_BUG;
		return TASK_TYPE_NO_SUBTASK;
	}
	if(typeof jsonDataTaskID.children !== "undefined"
	&& typeof jsonDataTaskID.parent == "undefined"){
		$.each(jsonDataTaskID.children, function( k, v ) {
		  if(v.tracker.name == "Coding" && typeof v.children !== "undefined"){
			return TASK_TYPE_NORMAL;
		  }
		});
	}
	
	if(typeof jsonDataTaskID.children !== "undefined"
	&& typeof jsonDataTaskID.parent !== "undefined"){
		$.each(jsonDataTaskID.children, function( k, v ) {
		  if(v.tracker.name == "Coding" && typeof v.children == "undefined"){
			return TASK_TYPE_PARENT_CODING;
		  }
		});
		return TASK_TYPE_MID;
	}
}



function compareTimeRedmineHito(objTimeHito, objTimeRedmine){
	var timeLogs = [];
	var timeLog = 0;
	let flag = 0;
	$.each(objTimeHito, function(k_hito, v_hito){
		flag = 0;
		$.each(objTimeRedmine, function(k_redmine, vi_redmine){
			if(v_hito.date == vi_redmine.date){
				timeLog = v_hito.time - vi_redmine.time;
				if(timeLog > 0){
					timeLogs.push({
						time: timeLog,
						date: v_hito.date,
						time_hito: v_hito.time,
						time_redmine: vi_redmine.time,
					});
					flag = 1;
				}else{
					timeLogs.push({
						time: 0,
						date: v_hito.date,
						time_hito: v_hito.time,
						time_redmine: vi_redmine.time,
					});
				}
				flag = 1;
				return false;
			}
		});
		if(flag == 0){
			timeLogs.push({
				time: v_hito.time,
				date: v_hito.date,
				time_hito: v_hito.time,
				time_redmine: 0

			});
		}
	});
	return timeLogs;
}

function createHTMLOneMonth(objTimeHito){
	let strHTML = "<div>";

	$.each(objTimeHito, function(k,v){
		strHTML += createHTMLOneDay(v);
	});
	strHTML += "</div>";
	return strHTML;
}

function createHTMLOneDay(objTask){

	let title_type = '';
	if(objTask.tasks == null || typeof objTask.tasks == 'undefined' || !objTask.tasks){
		return '';
	}

	let timeDefault = 0;
	// create ul
	let strHTMLul = '<div class="tasks">';

	$.each(objTask.tasks, (objTask_key, objTask_value) => {
		
		title_type = `<h2 style="font-weight: bold; font-size: 20px; color: orange;">${objTask_key}</h2>`;
		strHTMLul += '<table style="width:100%">';
		strHTMLul += title_type.toUpperCase();

		$.each(objTask_value, (k, v) => {
			if(v.lock !== null && typeof v.lock !== 'undefined' && v.lock == 1){
				timeDefault = timeDefault + v.defaultVal;
			}
			strHTMLul += createItemtHTML(v);
		})
		strHTMLul += '</table>';
	})
	
	strHTMLul += "</div>";

	//main;
	let strHTML = '<div class="one_day" date="'+objTask.date+'">';
	let time_hito_redmine = (objTask.time_redmine && objTask.time_hito) ? ' - Time redmine: '+ objTask.time_redmine + ' - Time hito: ' + objTask.time_hito : '';
	strHTML += '<h2 style="position: sticky; top: 0;left: 0;background: #000000bf; color: white;">' + objTask.date + ' - Cần up thêm: <b class="total_time_hito">'+objTask.time+'</b>' + ' - Giờ nhập còn lại: <b class="total_time_left">'+ (objTask.time - timeDefault) + '</b> - Time redmine: ' + '<b class="total_time_redmine">'+(objTask.time_redmine || 0)+'</b>' + ' - Time working: ' + '<b class="total_time_work">'+(objTask.time_hito || 0)+'</b>'  +'</h2>';
	
	strHTML += '<div class="groupBtnAction">';
	strHTML += '<button class="btn_clear">Clear</button>';
	strHTML += '<button class="btn_auto_fill">Auto fill</button>';
	strHTML += '<button class="btn_update_time_log">Update</button>';
	strHTML += '</div>';

	strHTML += strHTMLul;

	strHTML += '</div>';
	return strHTML;
}

function createDropdownActivityByTrackerOrActivity(strTracker, paramActivitys = []){
	
	strTracker = strTracker.toLowerCase();

	let TOneActivity = `
<b>{title}</b>
<input type="hidden" name="activity" value="{activity_id}" />
`
	let Tselect = `
<select name="activity" class="activity" style="width: 110px;">
{options}
</select>`;
	let Toptions = `
<option value="{value}" {selected}>{title}</option>`;


    let data = '';
	let strOption = '';


	if(typeof paramActivitys !== 'undefined' && paramActivitys.length > 0){
		if(paramActivitys.length > 1){
			let is_checked = 0;
			$.each(paramActivitys,function(k,v){
				strOption = Toptions;
				strOption = strOption.replace('{title}',v);
				strOption = strOption.replace('{value}',getIDActivityByString(v));
				if(is_checked == 0){
					strOption = strOption.replace('{selected}','selected');
				}else{
					strOption = strOption.replace('{selected}','');
				}
				data += strOption;
			});
			return Tselect.replace('{options}', data);
		}else{
			var b = getIDActivityByString(paramActivitys[0]);

			if(typeof b == 'undefined'){
				var a = 1;
			}
			TOneActivity = TOneActivity.replace('{title}',paramActivitys[0]);
			return TOneActivity.replace('{activity_id}',getIDActivityByString(paramActivitys[0]));
		}
	}

	let trackerActivity = getActivitysByTracker(strTracker);
	let activitys = trackerActivity.activitys;

	if(activitys.length > 1){
		let defaultCheck = getIDActivityByString(trackerActivity.default);
		$.each(activitys,function(k,v){
			strOption = Toptions;
			strOption = strOption.replace('{title}',v);
			strOption = strOption.replace('{value}',getIDActivityByString(v));
			if(defaultCheck == getIDActivityByString(v)){
				strOption = strOption.replace('{selected}','selected');
			}else{
				strOption = strOption.replace('{selected}','');
			}
			data += strOption;
		});
		return Tselect.replace('{options}', data);
	}else{
		TOneActivity = TOneActivity.replace('{title}',activitys[0]);
		return TOneActivity.replace('{activity_id}',getIDActivityByString(activitys[0]));
	}
}

function getActivitysByTracker(strTracker){
	strTracker = strTracker.toLowerCase(strTracker);
	var tracker_activity = config.redmine.tracker_activity.get(strTracker);
	if(typeof tracker_activity === 'undefined'){
		return config.redmine.tracker_activity.get('default');
	}
	return tracker_activity;
}

function getIDActivityByString(str){
	str = str.toLowerCase();
	return config.redmine.activitys.get(str);
}

function createItemtHTML(objTaskID){
	let value = 0;
	let inputLogDisable = '';
	let checked = '';
	if(objTaskID.defaultVal !== null && typeof objTaskID.defaultVal !== 'undefined'){
		value = objTaskID.defaultVal;
		
		if(objTaskID.lock == 1){
			checked = 'checked';
			inputLogDisable = 'disabled';
		}
	}
	let strHTML = "";
    let strHTMLDropdown = createDropdownActivityByTrackerOrActivity(objTaskID.tracker.name, objTaskID.activitys);
	strHTML = `
	<tr taskid="${objTaskID.id}" class="task_item">
	<td style="width: 85px;">${objTaskID.tracker.name} <a target="_blank" href="${REDMINE_DOMAIN_ISSUES}${objTaskID.id}">${objTaskID.id}</a></td>
	<td style="width: auto;">${objTaskID.subject}<br>
	<input type="comment" placeholder="comment" value="" name="comment" style="width: 100%;">
	</td>
	<td style="width: 85px;">
		<input type="number" value="${value}" name="time_log" style="width: 60px;" ${inputLogDisable}>
		<input type="checkbox" name="block" value="1" ${checked}>
	</td>
	<td style="width: 150px;">${strHTMLDropdown}</td>
	</tr>`;

	return strHTML;
}

function getUserID(){
	return $.ajax({
	  async: false,
	  url:config.redmine.REDMINEDOMAIN + config.redmine.API_MYACC,
	  type:"GET",
	  contentType:"application/x-www-form-urlencoded; charset=utf-8",
	  headers: {
	  	"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
	  },
	  dataType:"json",
	  success: function(data, status, xhr){
		return data;
	  }
	}).responseJSON.user.id;
}

function getListProject(){
	return $.ajax({
	  async: false,
	  url: config.redmine.REDMINEDOMAIN + config.redmine.API_PROJECT,
	  type:"GET",
	  contentType:"application/x-www-form-urlencoded; charset=utf-8",
	  headers: {
	  	"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
	  },
	  success: function(data, status, xhr){
		return data;
	  }
	}).responseJSON.projects;
}

function getListIDProjectByJson(jsonApiProject){
	var data = [];
	$.each(jsonApiProject, function(k,v){
		if(typeof v.parent === 'undefined'){
			data.push(v.id);	
		}
	});
	return data;
}

function getTimeFromRedmine(objDate){
	let lastDay = lastday(objDate.getFullYear(),objDate.getMonth());
	let strFromDate = objDate.getFullYear() + "-" + objDate.toStringMonth() + "-" + "01";
	let strToDate   = objDate.getFullYear() + "-" + objDate.toStringMonth() + "-" + lastDay; 
	let request_url = REDMINEDOMAIN + config.redmine.API_TIME_ENTRIES;
	let user_id = getUserID();
	let dataTimes = [];
	let limit = 100;
	let offset = 0;
	let idProjectByUser = getListIDProjectByJson(getListProject());

	window.idProjectByUser = idProjectByUser;
	window.user_id = user_id;

	let get_data = {
		project_id:"",
		user_id:user_id,
		from:strFromDate,
		to:strToDate,
		limit:limit,
		offset:offset
	};
	let timeEntries = [];
	let dataWorkingTimeRedmine;
	let total = 0;
	$.each(idProjectByUser, function(k,v){
		get_data.project_id = v;
		dataWorkingTimeRedmine = $.ajax({
		  async: false,
		  url:request_url,
		  type:"GET",
		  data:get_data,
		  contentType:"application/x-www-form-urlencoded; charset=utf-8",
		  dataType:"json",
		  headers: {
		  	"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		  },
		  success: function(data, status, xhr){
			return data;
		  }
		}).responseJSON;
		
		timeEntries = timeEntries.concat(dataWorkingTimeRedmine.time_entries);

		offset = dataWorkingTimeRedmine.offset;

		total = dataWorkingTimeRedmine.total_count;
		
		while((offset + limit) < total){
			offset = offset + limit;
			get_data.offset = offset;
			dataWorkingTimeRedmine = $.ajax({
			  async: false,
			  url:request_url,
			  type:"GET",
			  data:get_data,
			  contentType:"application/x-www-form-urlencoded; charset=utf-8",
			  dataType:"json",
			  headers: {
			  	"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
			  },
			  success: function(data, status, xhr){
				return data;
			  }
			}).responseJSON;
			if(dataWorkingTimeRedmine.time_entries.length){
				timeEntries = timeEntries.concat(dataWorkingTimeRedmine.time_entries);
			}
		}
	});

	$.each(timeEntries, function(k,v){
		dataTimes.push({
			date:v.spent_on,
			time:v.hours
		});
	});
	
	let holder = {};
	dataTimes.forEach(function(d) {
	  if (holder.hasOwnProperty(d.date)) {
		holder[d.date] = holder[d.date] + d.time;
	  } else {
		holder[d.date] = d.time;
	  }
	});
	let obj2 = [];

	for (var prop in holder) {
	  obj2.push({ date: prop, time: holder[prop] });
	}

	return obj2;
}

function filterFindTask(taskID){
	let rf = [];
	let infoTask = getInfoIssues(taskID);
	let typeTask = detectTypeTask(infoTask);
	switch(typeTask) {
	  case TASK_TYPE_FB_NO_SUBTASK:
	  case TASK_TYPE_BUG:
	  case TASK_TYPE_NO_SUBTASK:
		rf.push(
		{id: taskID,
		 subject: infoTask.subject,
		 tracker: infoTask.tracker.name
		 }
		);
		// code block
		break;
	  case TASK_TYPE_NORMAL:
		// code block
		$.each(infoTask.children, function( k, v ) {
		  if((v.tracker.name == "Coding")&& typeof v.children == "undefined"){
			  $.each(v, function( ki, vi ){
				  if((v.tracker.name == "Coding"||v.tracker.name == "Review")&& typeof v.children == "undefined"){
					  rf.push({id: vi.id,
					 subject: vi.subject,
					 tracker: vi.tracker.name
					 });
				  }
			  });
			}
		});
		break;
	   case TASK_TYPE_PARENT_CODING:
	    $.each(infoTask.children, function( k, v ) {
		  if((v.tracker.name == "Coding" || v.tracker.name == "Review" )&& typeof v.children == "undefined"){
			rf.push({id: v.id,
					 subject: v.subject,
					 tracker: v.tracker.name
					 });
		  }
		});
		break;
	  default:
		// code block
		
	}
	return rf;
}

function getInfoIssues(taskID){
	let request_url = REDMINEDOMAIN + '/issues/' + taskID +'.json';
	let get_data = {
		'include': 'children'
	};
	let a =  $.ajax({
	  async: false,
	  url:request_url,
	  type:"GET",
	  data:get_data,
	  contentType:"application/x-www-form-urlencoded; charset=utf-8",
	  dataType:"json",
	  headers: {
	  	"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
	  },
	  success: function(data, status, xhr){
		return data;
	  }
	}).responseJSON;
	
	if(typeof a.issue == 'undefined'){
		let a = 1;
	}
	return a.issue;
}

function isChildTask(taskID){
	let dataJson = getInfoIssues(taskID);
	if(typeof dataJson.issue.parent == "undefined"){
		return false;
	}else{
		return true;
	}
}

function getParentTask(taskID){
	while(1){
		let dataJson = getInfoIssues(taskID);
		if(typeof dataJson.issue.parent == "undefined"){
			return dataJson;
		}else{
			taskID = dataJson.issue.parent.id;
		}
	}
}

function IDactivity(strNameActi){
	strNameActi = strNameActi.toLowerCase();
	return config.redmine.activitys.get(strNameActi);
}

function getActivityByTask(taskID, tracker){
	// default acti coding
	let activity = IDactivity('coding');

	if(taskID == TASK_SUPPORT){
		activity = 165;
		return activity;
	}
	
	if(taskID == TASK_OTHER){
		activity = 899;
		return activity;
	}
	tracker = tracker.toLowerCase();
	switch(tracker) {
	  case 'coding':
		activity = 15;
		break;
	  case 'q&a':
		activity = 14;
		break;
	  case 'unit testing':
		activity = 18;
		break;
	  case 'bug':
		activity = 15;
		break;
	  case 'feedback':
		activity = 15;
		break;
	  case 'review':
		activity = 16;
		break;
	  case 'task':
		var info = getInfoIssues(taskID);
		var parentId =  info.parent.id;
		info = getInfoIssues(parentId);
		var trackerParent = info.tracker.name;
		switch(trackerParent) {
		  case 'spec analytic':
			activity = 13;
			break;
		  default:
			// code block
		}
	  default:
		// code block
	}
	return activity;
}

function updateTimeLogRedmine(taskID, date, time, tracker, activity, comment){
	
	let request_url = REDMINEDOMAIN + config.redmine.API_TIME_ENTRIES;
	//send to injectScript
	var post_data = {
		'time_entry[issue_id]': taskID,
		'time_entry[spent_on]': date,
		'time_entry[hours]': time,
		'time_entry[activity_id]' : activity,
		'time_entry[comments]' : comment
	};

	// Submit issue form!
	return $.ajax({
	  async: false,
	  url:request_url,
	  type:"POST",
	  data:post_data,
	  contentType:"application/x-www-form-urlencoded; charset=utf-8",
	  dataType:"json",
	  headers: {
	  	"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
	  },
	  success: function(data, status, xhr){
		return data;
	  }
	}).responseJSON;
}


function closeOneTask(taskID){
	let request_url = REDMINEDOMAIN + "/issues/" + taskID + ".json";
	var post_data = {
		"issue": {
			"status_id": 5,
			"done_ratio" : 100
		}
	};

	// Submit issue form!
	return $.ajax({
		async: false,
		url:request_url,
		type:"PUT",
		data:post_data,
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		dataType:"json",
		headers: {
			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		},
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;
}

function getTreeTaskByParentTask(dataTask, layer, results){
	var tasks = [];
	var projectId = 0;
	if( typeof dataTask.children !== "undefined"){
		$.each(dataTask.children, function(k, v){
			tasks.push(v.id);
			if(typeof v.children !== "undefined"){
				getTreeTaskByParentTask(v, layer + 1, results);
			}else{
				getTreeTaskByParentTask(v, layer, results);
			}
		});
	}
	if(typeof results[layer] !== "undefined"){
		results[layer] = results[layer].concat(tasks);
	}else{
		results[layer] = tasks
	}
	return results
}

function checkLoginRedmine(){
	return $.ajax({
		async: false,
		url:config.redmine.REDMINEDOMAIN + config.redmine.API_MYACC,
		type:"GET",
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		headers: {
			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		},
		dataType:"json",
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;
}

function ignoreStatusTask(tasks, projectid){
    const statusIgnore = ['rejected'];
    var ignoreStatus = tasks.toString();
    var url = "https://project.lampart-vn.com/issues.json?project_id=" + projectid + "&issue_id="+ignoreStatus+"&status_id=*";
    var rfTotal = [];

    var rf = $.ajax({
        async: false,
        url:url,
        type:"GET",
        contentType:"application/x-www-form-urlencoded; charset=utf-8",
        headers: {
            "Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
        },
        dataType:"json",
        success: function(data, status, xhr){
            return data;
        }
    }).responseJSON;

    if(typeof rf !== 'undefined' && rf.issues){
        $.each(rf.issues, function (k, v) {
            if(!statusIgnore.includes(v.status.name.toLowerCase())){
                rfTotal.push(v.id);
            }
        })
    }

    return rfTotal;
}

function getParentTask(taskId) {
    var url = "https://project.lampart-vn.com/issues/" + taskId;
    var rf = $.ajax({
        async: false,
        url:url,
        type:"GET",
        contentType:"application/x-www-form-urlencoded; charset=utf-8",
        headers: {
            "Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
        },
        dataType:"json",
        success: function(data, status, xhr){
            return data;
        }
    }).responseJSON;

    if (typeof rf === 'undefined'){
        return false;
    }

    var doc = $(rf).find('div.subject a').attr('href');
    if(typeof doc === 'undefined'){
        return taskId;
    }
    var parentTaskId = doc.match(/\d+/)[0];
    return parentTaskId;
}

function listChildrenToArray(childrens){
	var rf = [];
	$.each(childrens, function (k,v) {

	});
}

function getInfoByListChildrenTask(){
	var url = "https://project.lampart-vn.com/issues.json?project_id=" + projectid + "&issue_id="+ignoreStatus+"&status_id=*";
	var rf = $.ajax({
		async: false,
		url:url,
		type:"GET",
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		headers: {
			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		},
		dataType:"json",
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;

}

function getFullInfoTask(taskId){
    //debug
    // get parent task .
    var parentId = getParentTask(taskId);
    if(parentId == false)
        return false;

    var infoTask = getInfoIssues(parentId);

    if (typeof infoTask === 'undefined'){
        return false;
    }
    var treeChilTask = getTreeTaskByParentTask(infoTask, 0, {});
	var listChilTask = [];
	for(var i = Object.keys(treeChilTask).length - 1; i >= 0; i--) {
		$.each(treeTask[i], function (k,v){
			listChilTask.push(v);
		});
	}

	var url = "https://project.lampart-vn.com/issues.json?project_id=" + infoTask.project.id + "&issue_id="+listChilTask.toString()+"&status_id=*";
	var rfTotal = [];

	var rf = $.ajax({
		async: false,
		url:url,
		type:"GET",
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		headers: {
			"Authorization": "Basic " + btoa(uRedmine + ":" + pRedmine)
		},
		dataType:"json",
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;

	if (typeof rf == 'undefined' || typeof rf.issues === 'undefined'){
		return false
	}

	for(var i = Object.keys(treeChilTask).length - 1; i >= 0; i--) {
		$.each(treeChilTask[i], function (k,v){
			$.each(rf.issues, function (k1, v1) {
				if(v1.id == v){
					treeChilTask[i][k] = v1;
					return false;
				}
			})
		});
	}
}



window.addEventListener("message", function(event){
	// receive message from injectScript

	if(event.data.type
	 && (event.data.type == "btn_ext_month")
	 ){
		var a = checkLoginRedmine();
		if(typeof a === 'undefined'){
			showAlert('Login REDMINE "NOT" success');
		}

		 // send message to backgroud
		 chrome.runtime.sendMessage(
		    event.data
		 );
     }
	if(event.data.type
		&& (event.data.type == "btn_close_task")
	){
		var task_id = getTaskIDByStrURL(event.data.task_id);
		var taskInfo = getInfoIssues(task_id);
		var treeTask = getTreeTaskByParentTask(taskInfo, 0, {});

		for(var i = Object.keys(treeTask).length - 1; i >= 0; i--) {
            var iTreeTask = ignoreStatusTask(treeTask[i], taskInfo.project.id);
			$.each(iTreeTask, function (k,v){
				closeOneTask(v);
			});
		}
		closeOneTask(task_id);
		window.location.reload();
	}
	 
	if(event.data.type && event.data.type == "btn_update_time_log"){
		if(event.data.timeData.length > 0){
			$.each(event.data.timeData, function(k, v){
				if(parseFloat(v.time) > 0){
					updateTimeLogRedmine(v.task, v.date, v.time, v.tracker, v.activity, v.comment);
					$('.btn_update_time_log').removeClass('disabled');
				}
			});
		}
	}
	 }
	, false
);

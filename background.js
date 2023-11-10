// receive message from content
const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const year = day * 365;
const maxRe = 90000;

const employeeId = 189;
const urlHitoTime = config.hito.urlHitoTime;
const urlHitoLogin = config.hito.urlHitoLogin;
var USER = '';
var PASS = '';
var uRed = '';
var pRed = '';
// 1 pg, 2 itc
var O_POSITION = '';
var link_filter = '';

loadInfoFromStore().then(function (value) {
	saveUserPass(value);
});

function saveUserPass(value){
	USER         = value.HITO[0];
	PASS         = value.HITO[1];
	O_POSITION 	 = value.O_POSITION[0];
	uRed 		 = value.REDMINE[0];
	pRed 		 = value.REDMINE[1];
	LINK_FILTER  = value.link_filter;
}

Date.prototype.toStringDate = function() {
	var mm = this.getMonth() + 1; // getMonth() is zero-based
	var dd = this.getDate();

	return [this.getFullYear(),
		(mm>9 ? '' : '0') + mm,
		(dd>9 ? '' : '0') + dd
	].join('-');
};
Date.prototype.toStringDateYM = function() {
	var mm = this.getMonth() + 1; // getMonth() is zero-based
	var dd = this.getDate();

	return [this.getFullYear(),
		(mm>9 ? '' : '0') + mm
	].join('-');
};
var lastday = function lastday(y,m){
	return  new Date(y, m +1, 0).getDate();
};


// receive from content
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
	if(message.type == "btn_ext_month"){
		// send data to current tabs
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function(tabs) {
			let dateTime = new Date(message.date);
			let dayLastMonth = lastday(dateTime.getFullYear(), dateTime.getMonth())
			let dateFrom = dateTime.toStringDateYM() + "-" + "01 00:00:00";
			let dateTo   = dateTime.toStringDateYM() + "-" + dayLastMonth + " 00:00:00";
			getHistory(dateFrom, dateTo).then(function(dataHistory){
				let timeHito = getTimeHitoByMonth(new Date(message.date).toStringDateYM());
				let tab_id = tabs[0].id;
				// end chrome.history.search
				// send message to content
				chrome.tabs.sendMessage(tab_id, {
					type: "btn_ext_month",
					dataHistory: dataHistory,
					date: message.date,
					timeHito: timeHito
				}, function(response) {

				});
			});
		});
	}

	if(message.type == 'get_info_login'){
		saveDataRedmine();
	}
});

function saveDataRedmine(){
	return new Promise(function (s, r) {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function(tabs) {
			var tab_id1 = tabs[0].id;
			loadInfoFromStore().then(function (value) {
				// send message to content
				chrome.tabs.sendMessage(tab_id1, {
					type: "get_info_login",
					data: value
				}, function(response) {
					s(response);
				});
			})
		});
	});

}

var isNumber = function isNumber(value)
{
	return typeof value === 'number' && isFinite(value);
}

function checkLoginHito(){
	let info = getInfoHito(USER, PASS);
	if(typeof info === 'undefined'){
		return false;
	}
	return true;
}

function getTimeHitoByMonth(yearMonth){
	let info = getInfoHito(USER, PASS);
	if(typeof info === 'undefined'){
		sendMessageToTab('show_alert', 'Login HITO "NOT" success !');
		throw new Error('Login HITO "NOT" success !');
	}
	let objTimeLogHito = [];
	let data = {
		employee_id: info.id,
		current_month: yearMonth
	}
	let listMonth = $.ajax({
		async: false,
		url:urlHitoTime,
		type:"GET",
		data:data,
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		dataType:"json",
		headers: {
			"Authorization": "Bearer " + info.api_token
		},
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON.data.list_month;
	let strDateNow = new Date().toStringDate();
	let strDate = '';
	let tmpTime = 0;
	let timeBeLate = 0;
	$.each(listMonth, function( k, v ) {
		strDate = yearMonth + "-" + ((k>9 ? '' : '0') + k);
		tmpTime = hitoTimeToRedmineTime(v.total_time) + hitoTimeToRedmineTime(v.total_overtime);
		tmpCheckIn = v.check_in;
		timeRedmineBeLate = 8 - distanceTime("08:00", v.check_in);
		if(strDate == strDateNow && tmpTime == 0){
			objTimeLogHito.push(
				{
					date: strDate,
					time: timeRedmineBeLate
				}
			);
			let a = 1;
		}else{
			var job_type  = v.job_type.toLowerCase();
			var totalTime = '';
			switch (job_type) {
				case "paid leave":
					totalTime = '00:00';
					break;
				default:
					totalTime = v.total_time;
					break;

			}
			objTimeLogHito.push(
				{
					date: strDate,
					time: hitoTimeToRedmineTime(totalTime) + hitoTimeToRedmineTime(v.total_overtime)
				}
			);
		}

	});
	return objTimeLogHito;
}


function distanceTime(timeStart, timeEnd){
	let splitTimeStart = timeStart.split(":");
	let houseS     = parseInt(splitTimeStart[0]);
	let minS       = parseInt(splitTimeStart[1]);
	let splitTimeEnd = timeEnd.split(":");
	let houseE     = parseInt(splitTimeEnd[0]);
	let minE       = parseInt(splitTimeEnd[1]);
	let house = houseE - houseS;
	let min   = minE - minS;
	if(house < 0 ){
		return 0;
	}
	return hitoTimeToRedmineTime(house + ":" + min);
}

function hitoTimeToRedmineTime(timeHito){
	if(!timeHito || timeHito == '-'){
		return 0;
	}
	let splitTime = timeHito.split(":");
	let house     = parseInt(splitTime[0]);
	let min       = parseInt(splitTime[1]);
	if(isNumber(house) && isNumber(min)){
		if(min<= 15 && min > 0 ){
			min = 0.25;
		}else if(min<= 30 && min > 15 ){
			min = 0.5;
		}else if(min<= 45 && min > 30 ){
			min = 0.75;
		}else if(min == 0){
			min = 0;
		}
	}
	return (house + min);
}


function getInfoHito(user,pass){
	let data = {
		locale: "vi",
		password: pass,
		remember: false,
		username: user
	}
	return $.ajax({
		async: false,
		url:urlHitoLogin,
		type:"POST",
		data:data,
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		dataType:"json",
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON.data;
}




function getHistory(startDate, endDate) {

	return new Promise(function (resolve, reject) {
		let startTime = 0;
		let endTime = 0;
		let getTimezoneOffsetd = new Date().getTimezoneOffset();
		let startDateObj = new Date(startDate);
		let endDateObj = new Date(endDate);
		let nowDateObj = new Date();
		let dataHistory = [];
		if (startDate == endDate) {
			if (nowDateObj.toStringDate() == endDateObj.toStringDate()) { // now
				startTime = startDateObj.getTime();
				endTime = nowDateObj.getTime();
			} else { // != now
				startTime = startDateObj.getTime();
				endTime = startTime + day;
			}
		} else {
			startTime = startDateObj.getTime();
			endTime = endDateObj.getTime();
		}
		chrome.history.search({
				endTime: endTime,
				startTime: startTime,
				text: '- Redmine',
				maxResults: maxRe
			}, function (data) {
				var seen = {}
				data = data.filter(function (itemHistory, index, arr) {
					var taskIdData = getTaskIDByStrURL(itemHistory.url);
					if (!taskIdData) {
						return false;
					}
					if (!index) {
						seen[taskIdData] = true;
						return true;
					}
					return seen.hasOwnProperty(taskIdData) ? false : (seen[taskIdData] = true);
				});
				resolve(data);
			}// end Fn search history
		);// end chrome.history.search
	});
}

function loadInfoFromStore(){
	var phito = '';
	var uhito = '';

	var pred = '';
	var ured = '';

	const a = getStore(config.P_HITO).then(function(rf){
		return {
			[config.P_HITO] : decryptionPass(rf[config.P_HITO])
		}
	});
	const b = getStore(config.U_HITO).then(function(rf){
		return {
			[config.U_HITO] : decryptionPass(rf[config.U_HITO])
		}
	});
	const c = getStore(config.P_REDMINE).then(function(rf){
		return {
			[config.P_REDMINE] : decryptionPass(rf[config.P_REDMINE])
		}
	});
	const d = getStore(config.U_REDMINE).then(function(rf){
		return {
			[config.U_REDMINE] : decryptionPass(rf[config.U_REDMINE])
		}
	});
    const e = getStore(config.O_POSITION).then(function(rf){
        if(typeof rf[config.O_POSITION] == 'undefined' || rf[config.O_POSITION].length == 0){
            rf[config.O_POSITION] = "1";
        }
        return {
            [config.O_POSITION] : decryptionPass(rf[config.O_POSITION])
        }
    });

	const f = getStore(config.LINK_FILTER).then(function(rf) {
		return {
			[config.LINK_FILTER]: decryptionPass(rf[config.LINK_FILTER])
		}
	});

	return Promise.all([a, b, c, d, e, f]).then(function (value) {
		var data = {};
		$.each(value, function (k, v) {
			data[Object.keys(v)[0]] = v[Object.keys(v)[0]];
		});

		data = {
			HITO : [
				data[config.U_HITO],
				data[config.P_HITO],
			],
			REDMINE : [
				data[config.U_REDMINE],
				data[config.P_REDMINE],
			],
            O_POSITION : [
                data[config.O_POSITION]
            ],
			link_filter : data[config.LINK_FILTER]
		};
		saveUserPass(data);
		return data;
	});
}

function saveInfoFromStore(data){
	var uhito = encodeP(data['HITO'][0]);
	var phito = encodeP(data['HITO'][1]);

	var ured = encodeP(data['REDMINE'][0]);
	var pred = encodeP(data['REDMINE'][1]);

    var ooption     = encodeP(data['O_POSITION'][0]);
	var link_filter = encodeP(data['link_filter']);

	const a = saveStore(config.U_HITO, uhito).then(function (value) { return value; });
	const b = saveStore(config.P_HITO, phito).then(function (value) { return value; });
	const c = saveStore(config.U_REDMINE, ured).then(function (value) { return value; });
	const d = saveStore(config.P_REDMINE, pred).then(function (value) { return value; });
    const f = saveStore(config.O_POSITION, ooption).then(function (value) { return value; });
	const e = saveStore(config.LINK_FILTER, link_filter).then(function (value) { return value; });
    const g = loadInfoFromStore();
	return Promise.all([a, b, c, d, f, e, g]);
}

function getStore(key){
	return new Promise(function (resolve, reject) {
		chrome.storage.local.get([key], function(st){
			resolve(st);
		});
	});
}
function saveStore(key, val){
	return new Promise(function (resolve, reject) {
		chrome.storage.local.set({[key]: val}, function(st){
			resolve(st);
		});
	});
}

const cipher = salt => {
	const textToChars = text => text.split('').map(c => c.charCodeAt(0));
	const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
	const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);

	return text => text.split('')
		.map(textToChars)
		.map(applySaltToChar)
		.map(byteHex)
		.join('');
}

const decipher = salt => {
	const textToChars = text => text.split('').map(c => c.charCodeAt(0));
	const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
	return encoded => encoded.match(/.{1,2}/g)
		.map(hex => parseInt(hex, 16))
.map(applySaltToChar)
		.map(charCode => String.fromCharCode(charCode))
.join('');
}

function encodeP(a){
	if(typeof a === 'undefined' || a.length == 0){
		return '';
	}
	var myCipher = cipher('doc vo toi day thi thoat ra ho giup cai di bro');
	return myCipher(a);
}
function decryptionPass(a) {
	if(typeof a === 'undefined' || a.length == 0){
		return '';
	}
	var myDecipher = decipher('doc vo toi day thi thoat ra ho giup cai di bro')
	return myDecipher(a);
}

function sendMessageToTab(key, value) {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		var tab_id1 = tabs[0].id;
		chrome.tabs.sendMessage(tab_id1, {
			type: key,
			ms: value
		}, function (response) {

		});
	});
}


function checkLoginRedmine(){
	return $.ajax({
		async: false,
		url:config.redmine.REDMINEDOMAIN + config.redmine.API_MYACC,
		type:"GET",
		contentType:"application/x-www-form-urlencoded; charset=utf-8",
		headers: {
			"Authorization": "Basic " + btoa(uRed + ":" + pRed)
		},
		dataType:"json",
		success: function(data, status, xhr){
			return data;
		}
	}).responseJSON;
}

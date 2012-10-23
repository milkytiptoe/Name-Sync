// ==UserScript==
// @name          /b/ Name Sync
// @namespace     milky
// @description   Shares your name with other posters on forced anon boards. Also allows you to assign names to Anonymous posters. Requires 4chan X.
// @author        milky
// @contributor   My Name Here
// @contributor   Macil
// @contributor   ihavenoface
// @contributor   Finer
// @run-at        document-idle
// @include       http*://boards.4chan.org/b/*
// @include       http*://boards.4chan.org/soc/*
// @include       http*://boards.4chan.org/q/*
// @updateURL     https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @homepage      http://milkytiptoe.github.com/Name-Sync/
// @version       2.4.70
// @icon          http://i.imgur.com/3MFtd.png
// @require       http://code.jquery.com/jquery-1.8.2.min.js
// @grant         none
// ==/UserScript==

var $j = jQuery.noConflict();

var namespace = "NameSync.";
var version = "2.4.70";

var Set = {};

var names = null;
var onlineNames = [];
var onlinePosts = [];
var onlineEmails = [];
var onlineSubjects = [];
var onlineIDs = {};

var path = location.pathname.slice(1).split("/");
var board = path[0];
var thread = null;
if (path[1] == "res")
	thread = path[2];

var status = 0;
 
var delaySyncHandler = null;

var AutoUpdate = {
	init: function() {
		var last = Settings.get("lastcheck");
		if (last == null || Date.now() > last+86400000)
			AutoUpdate.update();
	},
	update: function() {
		var updatelink = $j("#updateLink");
		updatelink.text("Checking...");
		$j.ajax({
			headers: {"X-Requested-With":"NameSync"},
			url: "http://www.milkyis.me/namesync/uq.php"
		}).done(function(latest) {
			if (latest.length > 6)
				return updatelink.text("Error checking for update");
			Settings.set("latestversion", latest);
			Settings.set("lastcheck", Date.now());
			if (latest > version.replace(/\./g, "")) {
				updatelink.text("Update available");
				if (confirm("A new update for Name Sync is available, install now?"))
					window.location = "https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js";
			} else
				updatelink.text("No update available");
		}).fail(function() {
			updatelink.text("Error checking for update");
		});
	}
};

var Settings = {
	init: function() {
		for (set in Settings.settings) {
			var stored = Settings.get(set);
			Set[set] = stored == null ? Settings.settings[set][1] : stored == "true";
		}
		$j("<br /><a id='openSettings' href='javascript:;' title='Open settings'>Settings</a><br /><br />").prependTo("#delform");
		$j("#openSettings").on("click", Settings.show);
	},
	settings: {
		"Enable Sync": ["Share names online", true],
		"Assign Buttons": ["Show assign name button in 4chan X menus", true],
		"Hide IDs": ["Hide IDs next to names", false],
		"Show Errors": ["Show sync errors inside the quick reply box", true],
		"Automatic Updates": ["Check for updates automatically", true],
		"Override Fields": ["Share these over the quick reply fields", false]
	},
	get: function(name) {
		return localStorage.getItem(namespace + name);
	},
	set: function(name, value) {
		localStorage.setItem(namespace + name, value);
	},
	show: function() {
		$j("body").css("overflow", "hidden");
		$j("<div />").attr("id", "settingsOverlay").on("click", Settings.hide).appendTo("body");
		var wrapper = $j("<div />").attr("id", "settingsWrapper").appendTo("body");
		$j("<h1 />").text("/b/ Name Sync").appendTo(wrapper);
		$j("<label />").text(version).appendTo(wrapper);
		$j("<input />").attr("type", "button").css("right", "55px").val("Save").on("click", Settings.save).appendTo(wrapper);
		$j("<input />").attr("type", "button").val("Close").on("click", Settings.hide).appendTo(wrapper);
		$j("<h2 />").text("Settings").appendTo(wrapper);
		for (var set in Settings.settings) {
			$j("<label><input type='checkbox' name='" + set + "'" + (Set[set] ? "checked" : "") + " /> <strong>" + set + "</strong> " + Settings.settings[set][0] + "</label>").appendTo(wrapper);
		}
		$j("<input />").attr("type", "text").attr("name", "Name").attr("placeholder", "Name").val(Settings.get("Name") || "").appendTo(wrapper);
		$j("<input />").attr("type", "text").attr("name", "Email").attr("placeholder", "Email").val(Settings.get("Email") || "").appendTo(wrapper);
		$j("<input />").attr("type", "text").attr("name", "Subject").attr("placeholder", "Subject").val(Settings.get("Subject") || "").appendTo(wrapper);
		$j("<h2 />").text("More").appendTo(wrapper);
		$j("<label />").html("<a href='http://mayhemydg.github.com/4chan-x/' target='_blank'>4chan X</a>").appendTo(wrapper);
		$j("<label />").html("<a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>Changelog</a>").appendTo(wrapper);
		$j("<label />").html("<a href='http://milkytiptoe.github.com/Name-Sync/' target='_blank'>Web page</a>").appendTo(wrapper);
		$j("<label />").html("<a href='http://desktopthread.com/tripcode.php' target='_blank'>Test tripcode</a>").appendTo(wrapper);
		$j("<label />").html("<a id='updateLink' href='javascript:;'>Check for update</a>").on("click", AutoUpdate.update).appendTo(wrapper);
	},
	hide: function() {
		$j("body").css("overflow", "auto");
		$j("#settingsOverlay").remove();
		$j("#settingsWrapper").remove();
	},
	save: function() {
		$j("#settingsWrapper input[type='checkbox']").each(function() {
			Settings.set(this.name, this.checked);
		});
		$j("#settingsWrapper input[type='text']").each(function() {
			Settings.set(this.name, this.value);
		});
		location.reload(true);
	}
};

function init() {
	Settings.init();
	addStyles();
	if (Set["Automatic Updates"])
		AutoUpdate.init();
	if (Set["Enable Sync"]) {
		$j("<br /><span id='syncStatus'>Idle</span>").prependTo("#delform");
		$j(document).on("QRPostSuccessful.namesync", send);
		if (thread)
			sync();
	}
	loadNames();
	updateElements();
	if (Set["Assign Buttons"])
		addAssignButtons();
}

function addStyles() {
	var css = "\
	#settingsOverlay { z-index: 99; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5); }\
	#settingsWrapper * { margin: 0; padding: 0; }\
	#settingsWrapper { padding: 12px; width: 400px; height: 400px; z-index: 100; color: black; background: url(http://www.milkyis.me/bnamesync/bg.png) no-repeat #F0E0D6 bottom right; position: fixed; top: 50%; left: 50%; margin-top: -200px; margin-left: -200px; border: 1px solid rgba(0, 0, 0, 0.25); }\
	#settingsWrapper label { width: 100%; margin-bottom: 2px; cursor: pointer; display: block; }\
	#syncStatus { color: gray; }\
	#openSettings, #settingsWrapper a { text-decoration: none; }\
	#settingsWrapper h1 { font-size: 1.2em; text-align: left; }\
	#settingsWrapper h2 { font-size: 10pt; margin-top: 12px; margin-bottom: 12px; }\
	#settingsWrapper input[type='text'] { border: 1px solid #CCC; width: 31%; padding: 2px; }\
	#settingsWrapper input[type='button'] { width: 46px; height: 30px; position: absolute; right: 12px; top: 12px; }\
	";
	if (Set["Hide IDs"])
		css += ".posteruid { display: none; }";
	$j("<style />").text(css).appendTo("body");
}

function addAssignButtons() {
	var d = document;
	var a = d.createElement('a');
	a.href = 'javascript:;';
	a.textContent = "Assign name";

	var open = function(post) {
		var uid = $j(".posteruid", post.el).first().text();
		return uid != "(ID: Heaven)" && !onlineIDs[uid];
	};
	
	a.addEventListener('click', function() {
		assignName(d.getElementById(d.getElementById('menu').dataset.rootid).querySelector(".posteruid").textContent);
	});

	d.dispatchEvent(new CustomEvent('AddMenuEntry', {
		detail: {
			el: a,
			open: open
		}
	}));
}

function send(e) {
	var postID = e.originalEvent.detail.postID;
	var threadID = e.originalEvent.detail.threadID;
	var cName;
	var cEmail;
	var cSubject;

	if (Set["Override Fields"]) {
		cName = Settings.get("Name");
		cEmail = Settings.get("Email");
		cSubject = Settings.get("Subject");
	} else {
		var qr = $j("#qr");
		cName = $j('input[name="name"]', qr).val();
		cEmail = $j('input[name="email"]', qr).val();
		cSubject = $j('input[name="sub"]', qr).val();
	}
	
	cName = $j.trim(cName);
	cEmail = $j.trim(cEmail);
	cSubject = $j.trim(cSubject);
	
	if ((cName == "" && cEmail == "" && cSubject == "") || cEmail.toLowerCase() == "sage")
		return;
	
	uploadName(cName, cEmail, cSubject, postID, threadID);
}

function uploadName(cName, cEmail, cSubject, postID, threadID, isLateOpSend) {
	var d = "p="+postID+"&n="+encodeURIComponent(cName)+"&t="+threadID+"&b="+board+"&s="+encodeURIComponent(cSubject)+"&e="+encodeURIComponent(cEmail);

	if (isLateOpSend && !sessionStorage[board+"-namesync-tosend"])
		return;

	if (!thread) {
		isLateOpSend = true;
		sessionStorage[board+"-namesync-tosend"] = JSON.stringify({
			name: cName,
			email: cEmail,
			subject: cSubject,
			postID: postID,
			threadID: threadID,
		});
	}

	$j.ajax({
		headers: {"X-Requested-With":"NameSync"},
		type: "POST",
		url: "http://www.milkyis.me/namesync/sp.php",
		data: d
	}).fail(function() {
		setSyncStatus(1, "Offline (Error sending, retrying)");
		setTimeout(uploadName, 5000, cName, cEmail, cSubject, postID, threadID, isLateOpSend);
	}).done(function() {
		if (isLateOpSend)
			delete sessionStorage[board+"-namesync-tosend"];
	});
}

function canSync() {
	var ic = $j("#imagecount");
	if (ic.length && ic.hasClass("warning"))
		return false;
	var c = $j("#count");
	if (c.length && c.text() == "404")
		return false;
	return true;
}

function setSyncStatus(type, msg) {
	if (!thread)
		return;
	
	var colour = "green";
	
	switch (type) {
		case 1: colour = "red"; break;
		case 2: colour = "gray"; break;
	}
	
	$j("#syncStatus").html(msg).css("color", colour);
	
	if (status != type && Set["Show Errors"]) {
		$j("div.warning").html("<span style='color: "+colour+" !important;'>Sync: "+msg+"</span>");
		setTimeout(function() {
			$j("div.warning").html("");
		}, 5000);
	}
	
	status = type;
}

function sync(norepeat) {
	$j.ajax({
		headers: {"X-Requested-With":"NameSync"},
		dataType: "json",
		url: "http://www.milkyis.me/namesync/qp.php?t="+thread+"&b="+board,
		ifModified: true
	}).fail(function() {
		setSyncStatus(1, "Offline (Error retrieving)");
	}).done(function(data, status, xhr) {
		if (data == null || status == "notmodified") {
			setSyncStatus(0, "Online");
		} else {
			onlineNames = [];
			onlinePosts = [];
			onlineSubjects = [];
			onlineEmails = [];
			
			for (var i = 0, len = data.length; i < len; i++) {
				onlineNames.push(data[i].n);
				onlinePosts.push(data[i].p);
				onlineEmails.push(data[i].e);
				onlineSubjects.push(data[i].s);
			}

			setSyncStatus(0, "Online");
			updateElements();
		}
	});
	
	if (!norepeat && canSync()) {
		setTimeout(function() { sync(); }, 30000);
	}
}

function updateElements() {
	$j(".thread .post", document).each(function() {
		updatePost(this);
	});
	
	storeNames();
}

function updatePost(posttag) {
	var postinfotag = $j(posttag).children(".postInfo").children(".userInfo, .nameBlock")
			.add( $j(posttag).children(".postInfoM").children(".userInfo, .nameBlock") );

	var id = $j(".posteruid", postinfotag).first().text();

	if (id == "(ID: Heaven)")
		return;
	
	var postnumspan = $j(posttag).children(".postInfo, .postInfoM").children(".postNum");
	var subjectspan = $j(".subject", postinfotag).add( $j(posttag).children(".postInfo").children(".subject") );

	var postnum = $j("a[title='Quote this post']", postnumspan).first().text();
	var name = null;
	var tripcode = null;
	var email = null;
	var subject = null;
	
	if (Set["Enable Sync"]) {
		var info = getOnlineInfo(postnum);
		if (info != null && info[0] != null && info[0] != "") {
			names[id] = info[0];
			email = info[1];
			subject = info[2];
			onlineIDs[id] = true;
		}
	}
	
	if (names[id] != null) {
		name = names[id];
		tripcode = "";
		
		name = name.split("#");
		
		if (typeof name[1] != "undefined")
			tripcode = " !" + name[1];

		name = name[0];
		
		if (subject != null && subject != "" && subjectspan.first().text() != subject)
			subjectspan.text(subject);

		var nametag = $j(".name", postinfotag);
		var triptag = $j(".postertrip", postinfotag);

		if (nametag.first().text() != name)
			nametag.text(name);

		if (email != null && email != "") {
			var emailtag = $j(".useremail", postinfotag);
			if (emailtag.length == 0) {
				emailtag = $j("<a/>")
				.addClass("useremail")
				.insertBefore(nametag);

				nametag.first().appendTo(emailtag);
				nametag.slice(1).remove();
				nametag = $j(".name", postinfotag);

				triptag.remove();
				triptag = $j(".postertrip", postinfotag);
			}
			emailtag.attr("href", "mailto:"+email);
		}

		if (tripcode != null || triptag.length != 0) {
			if (triptag.length == 0) {
				triptag = $j("<span/>").addClass("postertrip");
				nametag.after(triptag);
				triptag = $j(".postertrip", postinfotag);
			}
			if (triptag.first().text() != tripcode) {
				triptag.text(tripcode);
			}
		}
	}
}

function getOnlineInfo(postnum) {
	var index = onlinePosts.indexOf(postnum);
	return index > -1 ? [onlineNames[index], onlineEmails[index], onlineSubjects[index]] : null;
}

function assignName(id) {
	var name = prompt("What would you like this poster to be named?", "");
	
	if (name != null && name != "")	{
		names[id] = name;
		updateElements();
	}
}

function storeNames() {
	sessionStorage[board+"-names"] = JSON.stringify(names);
}

function loadNames() {
	if (sessionStorage[board+"-names"] != null)
		names = JSON.parse(sessionStorage[board+"-names"]);

	if (names == null)
		names = {};
}

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.OMutationObserver || window.MozMutationObserver;
var observer = new MutationObserver(function(mutations) {
	for (var i = 0, len = mutations.length; i < len; i++) {
		var nodes = mutations[i].addedNodes;
		for (var j = 0, _len = nodes.length; j < _len; j++) {
			var node = nodes[j];
			if (/\breplyContainer\b/.test(node.className) && !$j(node).parent().is(".inline, #qp")) {
				updatePost($j(".reply", node));
				if (Set["Enable Sync"]) {
					clearTimeout(delaySyncHandler);
					delaySyncHandler = setTimeout(sync, 4500, true);
				}
			}
		}
	}
});
observer.observe($j(".thread").get(0), {
	childList: true,
	subtree: true
});

if (sessionStorage[board+"-namesync-tosend"]) {
	var r = JSON.parse(sessionStorage[board+"-namesync-tosend"]);
	uploadName(r.name, r.email, r.subject, r.postID, r.threadID, true);
}

init();

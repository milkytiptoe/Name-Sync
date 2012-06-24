// ==UserScript==
// @namespace     milky
// @name          /b/ Name Sync
// @description   Shares your name with other posters on /b/. Also allows you to assign names to Anonymous posters.
// @author        milky
// @contributor   My Name Here
// @contributor   Macil
// @contributor   ihavenoface
// @contributor   Finer
// @include       http*://boards.4chan.org/b/res/*
// @updateURL     https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @homepage      http://milkytiptoe.github.com/Name-Sync/
// @version       2.1.61
// @icon          http://i.imgur.com/12a0D.jpg
// ==/UserScript==

function addjQuery(a)
{
	var script = document.createElement("script");
	script.setAttribute("src", "https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js");
	script.addEventListener('load', function() {
	var script = document.createElement("script");
	script.textContent = "(" + a.toString() + ")();";
	document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

function NameSync()
{
	var optionPre = "NameSync.";
	var optionsNames = ["Enable Sync", "Hide IDs", "Show Assign Button", "Cross-thread Links", "Append Errors", "Automatic Updates", "Override Fields"];
	var optionsDescriptions = ["Share names online", "Hide IDs next to names", "Show assign button next to names", "Add >>>/b/ to cross-thread links on paste", "Show sync errors inside the quick reply box", "Notify about updates automatically", "Share these instead of the quick reply fields"];
	var optionsDefaults = ["true", "false", "true", "false", "true", "true", "false"];
		
	var $jq = jQuery.noConflict();
	var ver = "2.1.61";
	
	var uv = ver.replace(/\./g, "");
	var ut = new Date().getTime();
	var ulv = optionsGet("latestversion");
	var ulc = optionsGet("lastcheck");
	if (ulv == "") lv = uv;
	if (ulc == "") lc = ut;	
	
	var names = null;

	var onlineNames = [];
	var onlinePosts = [];
	var onlineEmails = [];
	var onlineSubjects = [];
	
	var t = document.URL;
	t = t.replace(/^.*\/|\.[^.]*$/g, '');
	t = t.substring(0, 9);
	
	var status = 0;
	
	$jq('form[name="delform"]').prepend("<span id='syncStatus' style='color: gray;'>Loading</span><br /><a id='optionsPopUp' href='javascript:;'' style='text-decoration: none;' title='Open options'>Options</a><br /><br />");
	$jq("#optionsPopUp").click(function() { optionsShow(); });
	
	var dstyle = document.createElement('style');
	document.body.appendChild(dstyle);
	var sstyle = document.createElement('style');
	sstyle.textContent = "#optionsScreen ul li { margin-bottom: 2px; } #optionsScreen a#closeBtn { float: right; } #optionsScreen input[type='text'] { border: 1px solid #ccc; padding: 2px; width: 30%; margin-right: 2px; } #optionsScreen a { text-decoration: none; } #optionsOverlay { background-color: black; opacity: 0.5; z-index: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; } #optionsScreen h1 { font-size: 1.2em; text-align: left; } #optionsScreen h2 { font-size: 10pt; margin-top: 12px; margin-bottom: 12px; } #optionsScreen * { margin: 0; padding: 0; } #optionsScreen ul { list-style-type: none; } #optionsScreen { color: black; width: 400px; height: 400px; display: none; z-index: 1; background: url(http://nassign.heliohost.org/s/best_small.png?i="+new Date().getTime()+") no-repeat #f0e0d6; background-color: #f0e0d6; background-position: bottom right; padding: 12px; border: 1px solid rgba(0, 0, 0, 0.25); position: absolute; top: 50%; left: 50%; margin-top:-200px; margin-left:-200px; } .assignbutton { font-weight: bold; text-decoration: none; } .inline .post .assignbutton, #qp .assignbutton { display: none; }";
	document.body.appendChild(sstyle);
	
	function update() {
		var ul = $jq("#updateLink");
		ul.html("Checking...");
		$jq.ajax({
			headers: {"X-Requested-With":"Ajax"},
			url: 'http://nassign.heliohost.org/s/uq.php'
		}).done(function(lv) {
			optionsSet("latestversion", lv);
			optionsSet("lastcheck", ut);
			if (lv > uv) {
				ul.html("Update available");
				if (confirm("A new update for /b/ Name Sync is available, install now?"))
					window.location = "https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js";
			} else
				ul.html("No update available");
		}).fail(function() {
			ul.html("Error checking for update");
		});
	}
	
	if (optionsGetB("Automatic Updates")) {
		if (ut > ulc+86400000 && ulv <= uv) {
			update();
		}
		if (ulv > uv) {
			$jq("#syncStatus").before("A new update for /b/ Name Sync is available. \
			<a href='javascript:;' onclick='window.location = \"https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js\";' https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js' target='_blank' onclick='javascript: this.innerHTML =\"\"'>Install now</a><br />After installing update, <a href='javascript:;' onclick='javascript:location.reload(true);'>refresh</a> to apply changes<br /><br />");
		}
	}
	
	function optionsShow()
	{
		$jq("body").css("overflow", "hidden");
		$jq(window).scrollTop(0);
		var overlayDiv = document.createElement("div");
		overlayDiv.setAttribute("id", "optionsOverlay");
		document.body.appendChild(overlayDiv);

		var optionsDiv = document.createElement("div");
		optionsDiv.setAttribute("id", "optionsScreen");
		optionsDiv.innerHTML = "<h1>/b/ Name Sync<a href='javascript:;'' id='closeBtn' title='Close options'>X</a></h1>"+ver+"<h2>Options</h2>";
		
		var optionsList = document.createElement("ul");
		
		for (var i = 0, len = optionsNames.length; i < len; i++)
		{
			var checked = optionsGetB(optionsNames[i]) ? 'checked' : '';
			optionsList.innerHTML += "<li><input type='checkbox' name='"+optionsNames[i]+"' "+checked+" /> <strong>"+optionsNames[i]+"</strong> "+optionsDescriptions[i]+"</li>";
		}
		
		optionsList.innerHTML += "<li><input type='text' id='bName' placeholder='Name' value='"+optionsGet("Name")+"' /> <input type='text' id='bEmail' placeholder='Email' value='"+optionsGet("Email")+"' /> <input type='text' id='bSubject' placeholder='Subject' value='"+optionsGet("Subject")+"' />";
		optionsDiv.appendChild(optionsList);
		
		optionsDiv.innerHTML += "<h2>More</h2><ul><li><a href='http://mayhemydg.github.com/4chan-x/' target='_blank'>4chan X</a></li><li><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>Changelog</a></li><li><a href='http://milkytiptoe.github.com/Name-Sync/' target='_blank'>Website</a></li><li><a href='http://desktopthread.com/tripcode.php' target='_blank'>Test tripcode</a></li><li id='updateLink'><a href='javascript:;''>Check for update</a></li></ul><br />";
		
		$jq('input[type="checkbox"]').live("click", function() { optionsSet($jq(this).attr("name"), String($jq(this).is(":checked"))); });
		
		$jq("#closeBtn").live("click", function() { optionsHide(); });
		overlayDiv.onclick = function() { optionsHide(); };
		document.body.appendChild(optionsDiv);
		
		$jq("#bName").change(function() { optionsSet("Name", $jq(this).val()); });
		$jq("#bEmail").change(function() { optionsSet("Email", $jq(this).val()); });
		$jq("#bSubject").change(function() { optionsSet("Subject", $jq(this).val()); });
		$jq("#updateLink").click(function() { update(); $jq(this).unbind("click"); });
		
		$jq("#optionsScreen").fadeIn("fast");
	}
	
	function optionsHide()
	{
		$jq("#optionsScreen").remove();
		$jq("#optionsOverlay").remove();
		$jq("body").css("overflow", "visible");
	}
	
	function changeStyle() {
		dstyle.textContent = ".posteruid { display: " + (optionsGetB("Hide IDs") ? "none" : "inline") + "; }\
		.assignbutton { display: " + (optionsGetB("Show Assign Button") ? "inline" : "none") + "; }";
	}
	
	$jq(document).ready(function() {
		if (!optionsGetB("Has Run")) {
			optionsShow();
			optionsSet("Has Run", "true");
		}
		
		if ($jq("#qr").length)
			QRListen();
		sync();
	});
	
	function send(e) {
		if (!optionsGetB("Enable Sync")) return;
		
		var qr = $jq("#qr");
		var postID = e.detail.postID;
		var threadID = e.detail.threadID;
		var cName;
		var cEmail;
		var cSubject;
		
		if (optionsGetB("Override Fields")) {
			cName = optionsGet("Name");
			cEmail = optionsGet("Email");
			cSubject = optionsGet("Subject");
		} else {
			cName = $jq('input[name="name"]', qr).val();
			cEmail = $jq('input[name="email"]', qr).val();
			cSubject = $jq('input[name="sub"]', qr).val();
		}
			
		if ($jq.trim(cName) == "" || cEmail == "sage") return;
			
		var d = "p="+postID+"&n="+encodeURIComponent(cName)+"&t="+threadID+"&s="+encodeURIComponent(cSubject)+"&e="+encodeURIComponent(cEmail);
		$jq.ajax({
			headers: {"X-Requested-With":"Ajax"},
			type: "POST",
			url: "http://nassign.heliohost.org/s/sp.php",
			data: d
		}).fail(function() {
			setSyncStatus(1, "Offline (Error sending)");
		});
	}
	
	function QRListen() {
		var qr = $jq("#qr")[0];
		qr.removeEventListener("QRPostSuccessful", send, true);
		qr.addEventListener("QRPostSuccessful", send, true);
	}
	
	if (optionsGetB("Cross-thread Links")) {
		var commentBox = $jq('#qr textarea[name="com"]');
		commentBox.on("paste", function() {
			setTimeout(function() {
				commentBox.val(commentBox.val().replace(/>>(\d\d\d\d\d\d\d\d\d)/g, ">>>/b/$1"));
				$jq(".thread .post", document).each(function() {
					var id = this.id.substring(1);
					commentBox.val(commentBox.val().replace(new RegExp(">>>/b/"+id, "g"), ">>"+id));
				});
			}, 100);
		});
	}
	
	function canSync()
	{
		var ic = $jq("#imagecount");
		if (ic.length && ic.hasClass("warning")) return false;
		var c = $jq("#count");
		if (c.length == 0 || c.text() == "404") return false;
		return true;
	}
	
	function setSyncStatus(type, msg)
	{
		var colour = "green";
		
		switch (type)
		{
			case 1: colour = "red"; break;
			case 2: colour = "gray"; break;
		}
		
		$jq("#syncStatus").html(msg).css("color", colour);
		
		if (status != type && optionsGetB("Append Errors"))
		{
			$jq("div.warning").html("<span style='color: "+colour+" !important;'>Sync is "+msg+"</span>");
			setTimeout(function() { $jq("div.warning").html(""); }, 5000);
		}
		
		status = type;
	}
	
	function sync() {
		if (optionsGetB("Enable Sync"))	{
			$jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				dataType: "json",
				url: 'http://nassign.heliohost.org/s/qp.php?t='+t,
			}).fail(function() {
				setSyncStatus(1, "Offline (Error retrieving)");
			}).done(function(data) {
				if (data == null) {
					setSyncStatus(0, "Online");
				} else {
					onlineNames = [];
					onlinePosts = [];
					onlineSubjects = [];
					onlineEmails = [];
					
					for (var i = 0, len = data.length; i < len; i++)
					{
						onlineNames.push(data[i].n);
						onlinePosts.push(data[i].p);
						onlineEmails.push(data[i].e);
						onlineSubjects.push(data[i].s);
					}

					setSyncStatus(0, "Online");
					updateElements();
				}
			});
		} else {
			setSyncStatus(2, "Disabled");
		}
		
		if (canSync()) {
			setTimeout(function() { sync(); }, 30000);
		}
	}
	
	function updateElements()
	{
		$jq(".thread .post", document).each(function() {
			updatePost(this);
		});
		
		storeNames();
	}

	function updatePost(posttag) {
		var postinfotag = $jq(posttag).children(".postInfo").children(".userInfo")
				.add( $jq(posttag).children(".postInfoM").children(".nameBlock") );

		var id = $jq(".posteruid", postinfotag).first().text();

		if(id == "(ID: Heaven)")
			return;
		
		var postnumspan = $jq(posttag).children(".postInfo").find(".postNum");
		var subjectspan = $jq(".subject", postinfotag);

		var postnum = null;
		var name = null;
		var tripcode = null;
		var email = null;
		var subject = null;
		
		var assignbutton = $jq(".assignbutton", postinfotag);

		if (optionsGetB("Enable Sync")
			&& !postnumspan.parents("div.postContainer").hasClass("inline")) {
			postnum = $jq("a[title='Quote this post']", postnumspan).text();
			var info = getOnlineInfo(postnum);
			if(info != null && info[0] != null && info[0] != "") {
				names[id] = info[0];
				email = info[1];
				subject = info[2];
			}
		}
		
		if (names[id] == null || onlineNames.indexOf(names[id]) == -1)
		{
			if(assignbutton.length == 0) {
				assignbutton = $jq("<a/>")
				.attr("href", "javascript:;")
				.attr("title", "Assign a name to this poster")
				.addClass("assignbutton")
				.text("+")
				.click(function() {
					assignName(id);
					return false;
				})
				.insertBefore(subjectspan);
			}
		}
		else
		{
			assignbutton.css("display", "none");
		}
		
		if(names[id] != null) {
			name = names[id];
			tripcode = "";
			
			name = name.split("#");
			
			if (typeof name[1] != "undefined")
				tripcode = " !" + name[1];

			name = name[0];
			
			if (subject != null && subject != "" && subjectspan.first().text() != subject)
				subjectspan.text(subject);

			var nametag = $jq(".name", postinfotag);
			var triptag = $jq(".postertrip", postinfotag);

			if(nametag.first().text() != name)
				nametag.text(name);

			if(email != null && email != "") {
				var emailtag = $jq(".useremail", postinfotag);
				if(emailtag.length == 0) {
					emailtag = $jq("<a/>")
					.addClass("useremail")
					.insertBefore(nametag);

					nametag.first().appendTo(emailtag);
					nametag.slice(1).remove();
					nametag = $jq(".name", postinfotag);

					triptag.remove();
					triptag = $jq(".postertrip", postinfotag);
				}
				emailtag.attr("href", "mailto:"+email);
			}

			if(tripcode != null || triptag.length != 0) {
				if(triptag.length == 0) {
					triptag = $jq("<span/>").addClass("postertrip");
					nametag.after(triptag);
					triptag = $jq(".postertrip", postinfotag);
				}
				if(triptag.first().text() != tripcode) {
					triptag.text(tripcode);
				}
			}
		}
	}
	
	function getOnlineInfo(postnum)
	{
		var index = onlinePosts.indexOf(postnum);
		
		if (index > -1)
		{
			return [onlineNames[index], onlineEmails[index], onlineSubjects[index]];
		}
		else
		{
			return null;
		}
	}
	
	function assignName(id)
	{
		var name = prompt("What would you like this poster to be named?","");
		
		if (name != null && name != "")
		{
			names[id] = name;
			updateElements();
		}
	}
	
	function optionsSet(name, value)
	{
		localStorage.setItem(optionPre + name, value);
		
		if (name == "Hide IDs" || name == "Show Assign Button")
			changeStyle();
	}
	
	function optionsGetB(name)
	{
		return optionsGet(name) == "true";
	}
	
	function optionsGet(name)
	{
		var value = localStorage.getItem(optionPre + name);

		if (value == null || typeof value == "undefined")
		{
			if (typeof optionsDefaults[optionsNames.indexOf(name)] != "undefined")
			{
				return optionsDefaults[optionsNames.indexOf(name)];
			}
			else
			{
				return "";
			}
		}
		else
		{
			return value;
		}
	}
	
	function storeNames()
	{
		sessionStorage["names"] = JSON.stringify(names);
	}

	function loadNames()
	{
		if(sessionStorage["names"] != null)
			names = JSON.parse(sessionStorage["names"]);

		if(names == null)
			names = {};
	}
	
	loadNames();
	changeStyle();
	updateElements();
	
	document.body.addEventListener('DOMNodeInserted', function(e) {
		if (e.target.nodeName=='DIV') {
			if ($jq(e.target).hasClass("replyContainer") && !$jq(e.target).hasClass("inline"))
				updatePost($jq(".reply", e.target));
				
			if (e.target.id == "qr")
				QRListen();
		}
	}, true);
}

addjQuery(NameSync);
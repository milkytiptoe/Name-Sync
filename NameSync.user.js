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
// @version       2.1.58
// @icon          http://i.imgur.com/12a0D.jpg
// ==/UserScript==

function addJQuery(a)
{
	var script = document.createElement("script");
	script.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js");
	script.addEventListener('load', function() {
	var script = document.createElement("script");
	script.textContent = "(" + a.toString() + ")();";
	document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

function setUp()
{
	var optionPre = "NameSync.";
	var optionsNames = ["Enable Sync", "Hide IDs", "Show Poster Options", "Cross-thread Links", "Append Errors", "Automatic Updates", "Override Fields"];
	var optionsDescriptions = ["Share names online", "Hide IDs next to names", "Show poster options next to names", "Add >>>/b/ to cross-thread links on paste", "Show sync errors inside the quick reply box", "Notify about updates automatically", "Share these instead of the quick reply fields"];
	var optionsDefaults = ["true", "false", "true", "true", "true", "true", "false"];
		
	var $jq = jQuery.noConflict();
	var ver = "2.1.58";
	
	var names = null;

	var onlineNames = [];
	var onlineFiles = [];
	var onlineEmails = [];
	var onlineSubjects = [];
	
	var usedFilenames = [];
	
	var t = document.URL;
	t = t.replace(/^.*\/|\.[^.]*$/g, '');
	t = t.substring(0, 9);
		
	var lastFile = "";
	var canPost = true;
	var status = 0;
	
	$jq('form[name="delform"]').prepend("<span id='syncStatus' style='color: gray;'>Loading</span><br /><a id='optionsPopUp' href='javascript:;'' style='text-decoration: none;' title='Open options'>Options</a><br /><br />");
	$jq("#optionsPopUp").click(function() { optionsShow(); });
	
	var asheet = document.createElement('style');
	document.body.appendChild(asheet);
	var bsheet = document.createElement('style');
	document.body.appendChild(bsheet);
	var csheet = document.createElement('style');
	csheet.innerHTML = "#optionsScreen ul li { margin-bottom: 2px; } #optionsScreen a#closeBtn { float: right; } #optionsScreen input[type='text'] { border: 1px solid #ccc; padding: 2px; width: 30%; margin-right: 2px; } #optionsScreen a { text-decoration: none; } #optionsOverlay { background-color: black; opacity: 0.5; z-index: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; } #optionsScreen h1 { font-size: 1.2em; text-align: left; } #optionsScreen h2 { font-size: 10pt; margin-top: 12px; margin-bottom: 12px; } #optionsScreen * { margin: 0; padding: 0; } #optionsScreen ul { list-style-type: none; } #optionsScreen { color: black; width: 400px; height: 400px; display: none; z-index: 1; background: url(http://nassign.heliohost.org/s/best_small.png?i="+new Date().getTime()+") no-repeat #f0e0d6; background-color: #f0e0d6; background-position: bottom right; padding: 12px; border: 1px solid rgba(0, 0, 0, 0.25); position: absolute; top: 50%; left: 50%; margin-top:-200px; margin-left:-200px; } .assignbutton { font-weight: bold; text-decoration: none; }";
	document.body.appendChild(csheet);
	
	function checkUpdate()
	{
		var v = ver.replace(/\./g, "");
		var d = new Date().getTime();
		var lu = optionsGet("lastcheck");
		var lv = optionsGet("latestversion");
		if (lu == "") {
			lu = d;
			optionsSet("lastcheck", lu);
		}
		if (lv == "") lv = v;
		if (d > parseInt(lu)+86400000 && lv <= v) {
			$jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				url: 'http://nassign.heliohost.org/s/uq.php?v='+ver
			}).done(function(data) {
				lv = parseInt(data);
				optionsSet("latestversion", lv);
				if (lv > v) {
					if (confirm("A new update for /b/ Name Sync is available, install now?\t\tAfter installing the update, refresh to apply changes"))
						window.location = "https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js";
				}
			});
			optionsSet("lastcheck", d);
		}
		if (lv > v) {
			$jq("#syncStatus").before("A new update for /b/ Name Sync is available. \
			<a href='javascript:;' onclick='window.location = \"https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js\";' https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js' target='_blank' onclick='javascript: this.innerHTML =\"\"'>Install now</a><br />After installing update, <a href='javascript:;' onclick='javascript:location.reload(true);'>refresh</a> to apply changes<br /><br />");
		}
	}
	
	function optionsShow()
	{
		$jq("body").scrollTop(0).css("overflow", "hidden");
		var overlayDiv = document.createElement("div");
		overlayDiv.setAttribute("id", "optionsOverlay");
		document.body.appendChild(overlayDiv);

		var optionsDiv = document.createElement("div");
		optionsDiv.setAttribute("id", "optionsScreen");
		optionsDiv.innerHTML = "<h1>/b/ Name Sync<a href='javascript:;'' id='closeBtn' title='Close options'>X</a></h1>"+ver+"<h2>Options</h2>";
		
		var optionsList = document.createElement("ul");
		
		for (var i = 0, len = optionsNames.length; i < len; i++)
		{
			var checked = optionsGet(optionsNames[i]) == "true" ? 'checked' : '';
			optionsList.innerHTML += "<li><input type='checkbox' name='"+optionsNames[i]+"' "+checked+" /> <strong>"+optionsNames[i]+"</strong> "+optionsDescriptions[i]+"</li>";
		}
		
		optionsList.innerHTML += "<li><input type='text' id='bName' placeholder='Name' value='"+optionsGet("Name")+"' /> <input type='text' id='bEmail' placeholder='Email' value='"+optionsGet("Email")+"' /> <input type='text' id='bSubject' placeholder='Subject' value='"+optionsGet("Subject")+"' />";
		optionsDiv.appendChild(optionsList);
		
		optionsDiv.innerHTML += "<h2>More</h2><ul><li><a href='http://mayhemydg.github.com/4chan-x/' target='_blank'>4chan X</a></li><li><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>Changelog</a></li><li><a href='http://milkytiptoe.github.com/Name-Sync/' target='_blank'>Website</a></li><li><a href='http://desktopthread.com/tripcode.php' target='_blank'>Test tripcode</a></li></ul><br />";
		
		$jq('input[type="checkbox"]').live("click", function() { optionsSet($jq(this).attr("name"), String($jq(this).is(":checked"))); });
		
		$jq("#closeBtn").live("click", function() { optionsHide(); });
		overlayDiv.onclick = function() { optionsHide(); };
		document.body.appendChild(optionsDiv);
		
		$jq("#bName").change(function() { optionsSet("Name", $jq(this).val()); });
		$jq("#bEmail").change(function() { optionsSet("Email", $jq(this).val()); });
		$jq("#bSubject").change(function() { optionsSet("Subject", $jq(this).val()); });
		
		$jq("#optionsScreen").fadeIn("fast");
	}
	
	function optionsHide()
	{
		$jq("#optionsScreen").remove();
		$jq("#optionsOverlay").remove();
		$jq("body").css("overflow", "visible");
	}
	
	function hideIds()
	{
		optionsGet("Hide IDs") == "true" ? asheet.innerHTML = ".posteruid { display: none; }" : asheet.innerHTML = ".posteruid { display: inline; }";
	}

	function hidePstrOpts()
	{
		optionsGet("Show Poster Options") == "true" ? bsheet.innerHTML = ".subject { display: inline; }" : bsheet.innerHTML = ".subject { display: none; }";
	}
	
	$jq(document).ready(function() {
		if (optionsGet("Has Run") == "")
		{
			optionsShow();
			optionsSet("Has Run", "true");
		}
		
		enableListen();

		setTimeout(function() { sync(); }, 1000);
	});
	
	function enableListen()
	{		
		if ($jq("#qr").length)
		{
			addListenQR();
		}
		else
		{
			document.body.addEventListener('QRDialogCreation', function() {
					addListenQR();
			}, true);
		}
	}
	
	if (optionsGet("Cross-thread Links") == "true")
	{
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
	
	if (optionsGet("Automatic Updates") == "true")
	{
		checkUpdate();
	}
	
	function addListenQR()
	{
		var qr = $jq("#qr");
		
		$jq("form", qr).on("submit", function() {
			var cName;
			var cEmail;
			var cSubject;
			var cFile = $jq('input[type="file"]', qr).val();
			
			var queuedReplies = $jq("#replies .preview[title]", qr);
			if (queuedReplies.length)
			{
				cFile = queuedReplies.attr("title");
			}
			
			if (optionsGet("Override Fields") == "true")
			{
				cName = optionsGet("Name");
				cEmail = optionsGet("Email");
				cSubject = optionsGet("Subject");
			}
			else
			{
				cName = $jq('input[name="name"]', qr).val();
				cEmail = $jq('input[name="email"]', qr).val();
				cSubject = $jq('input[name="sub"]', qr).val();
			}
			
			if (cFile != lastFile && canPost && cName != "" && cFile != "" && optionsGet("Enable Sync") == "true")
			{
				if (cFile.indexOf("C:\\fakepath\\") > -1)
					cFile = cFile.split("C:\\fakepath\\")[1];
					
				if (onlineFiles.indexOf(cFile) > -1) return;
				
				canPost = false;
				lastFile = cFile;
				
				if (cFile.length-4 > 30)
				{
					var start = cFile.substring(0, 30);
					var end = cFile.substring(cFile.length-4, cFile.length);
					cFile = start + "(...)" + end;
				}
				
				var d = "f="+encodeURIComponent(cFile)+"&n="+encodeURIComponent(cName)+"&t="+t+"&s="+encodeURIComponent(cSubject)+"&e="+encodeURIComponent(cEmail);
				$jq.ajax({
					headers: {"X-Requested-With":"Ajax"},
					type: "POST",
					url: "http://nassign.heliohost.org/s/s.php",
					data: d
				}).fail(function() {
					setSyncStatus(1, "Offline (Error sending)");
				});
				
				if (canSync())
				{
					setTimeout(function() { postSet(); }, 30000);
				}
			}
		});
	}
	
	function postSet()
	{
		canPost = true;
	}
	
	function canSync()
	{
		if ($jq("#imagecount").length && $jq("#count").length)
			return (parseInt($jq("#imagecount").text()) <= 250 && $jq("#count").text() != "404");
		else
			return false;
	}
	
	var setSyncStatus = function(type, msg)
	{
		var colour = "green";
		
		switch (type)
		{
			case 1: colour = "red"; break;
			case 2: colour = "gray"; break;
		}
		
		$jq("#syncStatus").html(msg).css("color", colour);
		
		if (status != type && optionsGet("Append Errors") == "true")
		{
			$jq("div.warning").html("<span style='color: "+colour+" !important;'>Sync is "+msg+"</span>");
			setTimeout(function() { $jq("div.warning").html(""); }, 5000);
		}
		
		status = type;
	}
	
	function sync()
	{		
		if (optionsGet("Enable Sync") == "true")
		{
			$jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				dataType: "json",
				url: 'http://nassign.heliohost.org/s/qj.php?t='+t,
			}).fail(function() {
				setSyncStatus(1, "Offline (Error retrieving)");
			}).done(function(data) {
				if (data == null)
				{
					setSyncStatus(0, "Online");
				}
				else
				{
					onlineNames = [];
					onlineFiles = [];
					onlineSubjects = [];
					onlineEmails = [];
					
					for (var i = 0, len = data.length; i < len; i++)
					{
						onlineNames.push(data[i].n);
						onlineFiles.push(data[i].f);
						onlineEmails.push(data[i].e);
						onlineSubjects.push(data[i].s);
					}

					setSyncStatus(0, "Online");
					updateElements();
				}
			});
		}
		else
		{
			setSyncStatus(2, "Disabled");
		}
		
		if (canSync())
		{
			setTimeout(function() { sync(); }, 30000);
		}
	}
	
	function updateElements()
	{
		usedFilenames = [];
		
		$jq(".thread .post", document).each(function() {
			updatePost(this);
		});
		
		storeNames();
	}

	function updatePost(posttag) {
		// Get the postinfotag to look in specifically, so we don't
		// accidentally look into inlined posts' content later.
		var postinfotag = $jq(posttag).children(".postInfo").children(".userInfo")
				.add( $jq(posttag).children(".postInfoM").children(".nameBlock") );

		var id = $jq(".posteruid", postinfotag).first().text();

		if(id == "(ID: Heaven)")
			return;
		
		var filetextspan = $jq(posttag).children(".file").find(".fileText");
		var subjectspan = $jq(".subject", postinfotag);

		var filename = null;
		var name = null;
		var tripcode = null;
		var email = null;
		var subject = null;
		
		var assignbutton = $jq(".assignbutton", postinfotag);

		if(optionsGet("Enable Sync") == "true"
			&& filetextspan.length != 0
			&& !filetextspan.parents("div.postContainer").hasClass("inline")) {
			// We're excluding inline posts here so that way filenames are
			// sure to be matched up to the server response in post order.
			var filenamespan = $jq("span[title]", filetextspan);
			if(filenamespan.length == 0) {
				filenamespan = $jq("a[href]", filetextspan);
			}
			var truncnametag = $jq(".fntrunc", filenamespan);
			if(truncnametag.length == 0) {
				filename = filenamespan.text();
			} else {
				filename = truncnametag.text();
			}
			var info = getOnlineInfo(filename);
			if(info != null && info[0] != null && info[0] != "" && !usedFilenames[filename]) {
				names[id] = info[0];
				
				email = info[1];
				subject = info[2];
				usedFilenames[filename] = true;
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
			{
				tripcode = "!" + name[1];
			}

			name = name[0];
			
			if (subject != null && subject != "" && subjectspan.first().text() != subject)
			{
				subjectspan.text(subject);
			}

			var nametag = $jq(".name", postinfotag);
			var triptag = $jq(".postertrip", postinfotag);

			if(nametag.first().text() != name) {
				nametag.text(name);
			}

			if(email != null && email != "") {
				var emailtag = $jq(".useremail", postinfotag);
				// If we don't have an emailtag, make it and move the
				// name and tripcode tags into it.
				if(emailtag.length == 0) {
					emailtag = $jq("<a/>")
					.addClass("useremail")
					.insertBefore(nametag);

					nametag.first().appendTo(emailtag);
					// The first nametag element has been moved into
					// emailtag. The other nametag elements must be removed.
					nametag.slice(1).remove();
					nametag = $jq(".name", postinfotag);

					// The triptag elements will be re-added later.
					triptag.remove();
					triptag = $jq(".postertrip", postinfotag);
				}
				emailtag.attr("href", "mailto:"+email);
			}

			if(tripcode != null || triptag.length != 0) {
				if(triptag.length == 0) {
					triptag = $jq("<span/>").addClass("postertrip");
					nametag.after(" ", triptag);
					triptag = $jq(".postertrip", postinfotag);
				}
				if(triptag.first().text() != tripcode) {
					triptag.text(tripcode);
				}
			}
		}
	}
	
	function getOnlineInfo(filename)
	{
		var index = onlineFiles.indexOf(filename);
		
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
		
		if (name == "Hide IDs")
			hideIds();
		if (name == "Show Poster Options")
			hidePstrOpts();
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
	hideIds();
	hidePstrOpts();
	updateElements();
	
	document.body.addEventListener('DOMNodeInserted', function(e) {
		if(e.target.nodeName=='DIV' && $jq(e.target).hasClass("replyContainer") && !$jq(e.target).hasClass("inline")) {
			updatePost($jq(".reply", e.target));
		}
	}, true);
}

addJQuery(setUp);

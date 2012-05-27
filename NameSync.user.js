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
// @version       2.0.53
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
	var optionsNames = ["Enable Sync", "Hide IDs", "Show Poster Options", "Append Errors", "Override Fields"];
	var optionsDescriptions = ["Share and download names online", "Hide IDs next to poster names", "Show poster options next to poster names", "Show sync errors inside the quick reply box", "Share these instead of the quick reply fields"];
	var optionsDefaults = ["true", "false", "true", "true", "false"];
		
	var $Jq = jQuery.noConflict();
	var ver = "2.0.53";
	var website = "http://milkytiptoe.github.com/Name-Sync/";
	
	// Initialized by loadNames()
	var names;

	var onlineNames = [];
	var onlineFiles = [];
	var onlineEmails = [];
	var onlineSubjects = [];
	
	var usedFilenames = [];
	
	var t = document.URL;
	t = t.replace(/^.*\/|\.[^.]*$/g, '');
	t = t.substring(0, 9);
	if (t.length < 9)
		t = "b";
		
	var lastFile = "";
	var canPost = true;
	var retries = -1;
	
	$Jq('form[name="delform"]').prepend("<span id='syncStatus' style='color: gray;'>Loading</span><br /><a id='optionsPopUp' href='#' style='text-decoration: none;' title='Open options'>Options</a><br /><br />");
	$Jq("#optionsPopUp").click(function() { optionsShow(); });
	
	var asheet = document.createElement('style');
	document.body.appendChild(asheet);
	var bsheet = document.createElement('style');
	document.body.appendChild(bsheet);
	var csheet = document.createElement('style');
	csheet.innerHTML = "#optionsScreen ul li { margin-bottom: 2px; } #optionsScreen a#closeBtn { float: right; } #optionsScreen input[type='text'] { padding: 2px; width: 30%; margin-right: 2px; } #optionsScreen a { text-decoration: none; } #optionsOverlay { background-color: black; opacity: 0.5; z-index: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; } #optionsScreen h1 { font-size: 1.2em; } #optionsScreen h2 { font-size: 10pt; margin-top: 12px; margin-bottom: 12px; } #optionsScreen * { margin: 0; padding: 0; } #optionsScreen ul { list-style-type: none; } #optionsScreen { color: black; width: 400px; height: 400px; display: none; z-index: 1; background: url(http://nassign.heliohost.org/s/best_small.png?i="+new Date().getTime()+") no-repeat #f0e0d6; background-color: #f0e0d6; background-position: bottom right; padding: 12px; border: 1px solid rgba(0, 0, 0, 0.25); position: absolute; top: 50%; left: 50%; margin-top:-200px; margin-left:-200px; } .assignbutton { font-weight: bold; text-decoration: none; }";
	document.body.appendChild(csheet);
	
	function optionsShow()
	{
		$Jq("body").scrollTop(0).css("overflow", "hidden");
		var overlayDiv = document.createElement("div");
		overlayDiv.setAttribute("id", "optionsOverlay");
		document.body.appendChild(overlayDiv);

		var optionsDiv = document.createElement("div");
		optionsDiv.setAttribute("id", "optionsScreen");
		optionsDiv.innerHTML = "<h1>/b/ Name Sync<a href='#' id='closeBtn' title='Close options'>X</a></h1>"+ver+"<h2>Options</h2>";
		
		var optionsList = document.createElement("ul");
		
		for (var i = 0, len = optionsNames.length; i < len; i++)
		{
			var checked = optionsGet(optionsNames[i]) == "true" ? 'checked' : '';
			optionsList.innerHTML += "<li><input type='checkbox' name='"+optionsNames[i]+"' "+checked+" /> <strong>"+optionsNames[i]+"</strong> "+optionsDescriptions[i]+"</li>";
		}
		
		optionsList.innerHTML += "<li><input type='text' id='bName' placeholder='Name' value='"+optionsGet("Name")+"' /> <input type='text' id='bEmail' placeholder='Email' value='"+optionsGet("Email")+"' /> <input type='text' id='bSubject' placeholder='Subject' value='"+optionsGet("Subject")+"' />";
		optionsDiv.appendChild(optionsList);
		
		optionsDiv.innerHTML += "<h2>More</h2><ul><li><a href='http://mayhemydg.github.com/4chan-x/' target='_blank'>4chan X</a></li><li><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>Changelog</a></li><li><a href='"+website+"' target='_blank'>Website</a></li><li><a href='http://desktopthread.com/tripcode.php' target='_blank'>Test tripcode</a></li><li id='updateLink'><a href='#'>Check for update</a></li></ul><br />";
		
		$Jq('input[type="checkbox"]').live("click", function() { optionsSet($Jq(this).attr("name"), String($Jq(this).is(":checked"))); });
		
		$Jq("#closeBtn").live("click", function() { optionsHide(); });
		overlayDiv.onclick = function() { optionsHide(); };
		document.body.appendChild(optionsDiv);
		
		$Jq("#bName").change(function() { optionsSet("Name", $Jq(this).val()); });
		$Jq("#bEmail").change(function() { optionsSet("Email", $Jq(this).val()); });
		$Jq("#bSubject").change(function() { optionsSet("Subject", $Jq(this).val()); });
		$Jq("#updateLink").click(function() { 
			$Jq(this).html("Checking...");
			$Jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				url: 'http://nassign.heliohost.org/s/u.php?v='+ver
			}).fail(function() {
				$Jq("#updateLink").html("Error checking for update");
			}).done(function(data) {
				$Jq("#updateLink").html(data);
			});
			
			$Jq(this).attr('onclick','').unbind('click');
		});
		
		$Jq("#optionsScreen").fadeIn("fast");
	}
	
	function optionsHide()
	{
		$Jq("#optionsScreen").remove();
		$Jq("#optionsOverlay").remove();
		$Jq("body").css("overflow", "visible");
	}
	
	function hideIds()
	{
		optionsGet("Hide IDs") == "true" ? asheet.innerHTML = ".posteruid { display: none; }" : asheet.innerHTML = ".posteruid { display: inline; }";
	}

	function hidePstrOpts()
	{
		optionsGet("Show Poster Options") == "true" ? bsheet.innerHTML = ".subject { display: inline; }" : bsheet.innerHTML = ".subject { display: none; }";
	}
	
	$Jq(document).ready(function() {
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
		if ($Jq("#qr").length)
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
	
	function addListenQR()
	{
		var qr = $Jq("#qr");
		
		qr.contents().find(":submit").click(function()
		{
			var cName;
			var cEmail;
			var cSubject;
			var cFile = qr.contents().find('input[type="file"]').val();
			
			var queuedReplies = $Jq("#replies .preview[title]", qr);
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
				cName = encodeURIComponent(qr.contents().find('input[name="name"]').val());
				cEmail = qr.contents().find('input[name="email"]').val();
				cSubject = qr.contents().find('input[name="sub"]').val();
			}
			
			if (cFile != lastFile && canPost == true && cName != "" && cFile != "" && optionsGet("Enable Sync") == "true")
			{	
				canPost = false;
				lastFile = cFile;
				
				if (cFile.indexOf("C:\\fakepath\\") > -1)
					cFile = cFile.split("C:\\fakepath\\")[1];
				
				if (cFile.length-4 > 30)
				{
					var start = cFile.substring(0, 30);
					var end = cFile.substring(cFile.length-4, cFile.length);
					cFile = start + "(...)" + end;
				}
				
				cFile = escape(cFile);
								
				$Jq.ajax({
					headers: {"X-Requested-With":"Ajax"},
					type: "POST",
					url: "http://nassign.heliohost.org/s/s.php",
					data: "f="+cFile+"&n="+cName+"&t="+t+"&s="+cSubject+"&e="+cEmail
				}).fail(function() {
					setSyncStatus(1, "Error sending name");
				});
				
				if (canSync())
				{
					setTimeout(function() { postSet(); }, 3000);
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
		if ($Jq("#imagecount").length && $Jq("#count").length)
			return (parseInt($Jq("#imagecount").text()) <= 250 && $Jq("#count").text() != "404");
		else
			return false;
	}
	
	var setSyncStatus = function(type, msg)
	{
		var colour = "green";
		
		switch (type)
		{
			case 0: retries = -1; break;
			case 1: colour = "red"; retries++; break;
			case 2: colour = "gray"; break;
		}
		
		if (retries >= 1)
			msg += " (retries: "+retries+")";
		
		$Jq("#syncStatus").html(msg).css("color", colour);
		
		if (type == 1 && optionsGet("Append Errors") == "true")
		{
			$Jq("div.warning").html("Sync: "+msg);
			setTimeout(function() { $Jq("div.warning").html(""); }, 5000);
		}
	}
	
	function sync()
	{		
		if (t == "b")
		{
			setSyncStatus(2, "Not available on board index");
			return;
		}
			
		if (optionsGet("Enable Sync") == "true")
		{
			$Jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				url: 'http://nassign.heliohost.org/s/q.php?t='+t,
			}).fail(function() {
				setSyncStatus(1, "Error retrieving names");
			}).done(function(data) {
				if (data.length == 0)
				{
					setSyncStatus(0, "Online");
				}
				else
				{
					var content = data;
						
					try
					{
						var jsonBlocks = content.split("|");
						
						onlineNames = [];
						onlineFiles = [];
						onlineSubjects = [];
						onlineEmails = [];
						
						for (var i = 0, len = jsonBlocks.length -1; i < len; i++)
						{
							var p = jQuery.parseJSON(jsonBlocks[i]);

							onlineNames.push(unescape(p["n"]));
							onlineFiles.push(unescape(p["f"]));
							onlineEmails.push(unescape(p["e"]));
							onlineSubjects.push(unescape(p["s"]));
						}

						setSyncStatus(0, "Online");
						updateElements();
					}
					catch (err)
					{
						setSyncStatus(1, "Error retrieving names (Script error)");
					}
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
		if (t == "b")
			return;
		
		usedFilenames = [];
		
		$Jq(".thread .post", document).each(function() {
			updatePost(this);
		});
		
		storeNames();
	}

	function updatePost(posttag) {
		// Get the postinfotag to look in specifically, so we don't
		// accidentally look into inlined posts' content later.
		var postinfotag = $Jq(posttag).children(".postInfo").children(".userInfo")
				.add( $Jq(posttag).children(".postInfoM").children(".nameBlock") );

		var id = $Jq(".posteruid", postinfotag).first().text();

		if(id == "(ID: Heaven)")
			return;
		
		var filetextspan = $Jq(posttag).children(".file").find(".fileText");
		var subjectspan = $Jq(".subject", postinfotag);

		var filename = null;
		var name = null;
		var tripcode = null;
		var email = null;
		var subject = null;
		
		var assignbutton = $Jq(".assignbutton", postinfotag);

		if(optionsGet("Enable Sync") == "true"
			&& filetextspan.length != 0
			&& !filetextspan.parents("div.postContainer").hasClass("inline")) {
			// We're excluding inline posts here so that way filenames are
			// sure to be matched up to the server response in post order.
			var filenamespan = $Jq("span[title]", filetextspan);
			if(filenamespan.length == 0) {
				filenamespan = $Jq("a[href]", filetextspan);
			}
			var truncnametag = $Jq(".fntrunc", filenamespan);
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
				assignbutton = $Jq("<a/>")
				.attr("href", "#")
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
			
			if (subject != null && subject != "" && subjectspan.text() != subject)
			{
				subjectspan.text(subject);
			}

			var nametag = $Jq(".name", postinfotag);
			var triptag = $Jq(".postertrip", postinfotag);

			if(nametag.text() != name) {
				nametag.text(name);
			}

			if(email != null && email != "") {
				var emailtag = $Jq(".useremail", postinfotag);
				// If we don't have an emailtag, make it and move the
				// name and tripcode tags into it.
				if(emailtag.length == 0) {
					emailtag = $Jq("<a/>")
					.addClass("useremail")
					.insertBefore(nametag);

					nametag.first().appendTo(emailtag);
					// The first nametag element has been moved into
					// emailtag. The other nametag elements must be removed.
					nametag.slice(1).remove();
					nametag = $Jq(".name", postinfotag);

					// The triptag elements will be re-added later.
					triptag.remove();
					triptag = $Jq(".postertrip", postinfotag);
				}
				emailtag.attr("href", "mailto:"+email);
			}

			if(tripcode != null || triptag.length != 0) {
				if(triptag.length == 0) {
					triptag = $Jq("<span/>").addClass("postertrip");
					nametag.after(" ", triptag);
					triptag = $Jq(".postertrip", postinfotag);
				}
				if(triptag.text() != tripcode) {
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
				return null;
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
		names = JSON.parse(sessionStorage["names"]);

		if(names == null) {
			names = {};
		}
	}
	
	loadNames();
	hideIds();
	hidePstrOpts();
	updateElements();
	
	document.body.addEventListener('DOMNodeInserted', function(e) {
		if(e.target.nodeName=='DIV' && $Jq(e.target).hasClass("replyContainer") && !$Jq(e.target).hasClass("inline")) {
			updatePost($Jq(".reply", e.target));
		}
	}, true);
}

addJQuery(setUp);

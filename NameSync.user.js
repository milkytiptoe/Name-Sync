// ==UserScript==
// @namespace     milky
// @name          /b/ Name Sync
// @description   Shares your name with other posters on /b/. Also allows you to assign names to Anonymous posters.
// @author        milky
// @contributor   My Name Here
// @contributor   Macil
// @contributor   ihavenoface
// @contributor   Finer
// @include       http*://boards.4chan.org/b/*
// @updateURL     https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @homepage      http://milkytiptoe.github.com/Name-Sync/
// @version       2.0.36
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
	var $Jq = jQuery.noConflict();

	var ver = "2.0.36";
	var website = "http://milkytiptoe.github.com/Name-Sync/";
	var options = ["true", "true", "true", "false", "false", "false"];
	var bName = "";
	var bEmail = "";
	var bSubject = "";
	
	var names = new Array();
	var ids = new Array();

	var onlineNames = new Array();
	var onlineFiles = new Array();
	var onlineEmails = new Array();
	var onlineSubjects = new Array();
	
	// Prevent assigning from duplicate filenames
	var usedFilenames = [];
	
	var t = document.URL;
	t = t.replace(/^.*\/|\.[^.]*$/g, '');
	t = t.substring(0, 9);
	if (t.length < 9)
		t = "b";
		
	var lastFile = "";
	var canPost = true;
	
	// Options link and status html
	$Jq('form[name="delform"]').prepend("<span id='syncStatus' style='color: gray;'>Loading</span><br /><a id='optionsPopUp' href='#' style='text-decoration: none;' title='Open options'>Options</a><br /><br />");
	$Jq("#optionsPopUp").click(function () { showOptionsScreen(); });
	
	// Styles
	var asheet = document.createElement('style');
	document.body.appendChild(asheet);
	var bsheet = document.createElement('style');
	document.body.appendChild(bsheet);
	var csheet = document.createElement('style');
	csheet.innerHTML = "#optionsScreen ul li { margin-bottom: 2px; } #optionsScreen a#closeBtn { float: right; } #optionsScreen input[type='text'] { padding: 2px; width: 32%; margin-right: 2px; } #optionsScreen a { text-decoration: none; } #optionsOverlay { background-color: black; opacity: 0.5; z-index: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; } #optionsScreen h1 { font-size: 1.2em; } #optionsScreen h2 { font-size: 10pt; margin-top: 12px; margin-bottom: 12px; } #optionsScreen * { margin: 0; padding: 0; } #optionsScreen ul { list-style-type: none; } #optionsScreen { color: black; width: 400px; height: 400px; display: none; z-index: 1; background: url(http://nassign.heliohost.org/s/best_small.png?i="+new Date().getTime()+") no-repeat #f0e0d6; background-color: #f0e0d6; background-position: bottom right; padding: 12px; border: 1px solid rgba(0, 0, 0, 0.25); position: absolute; top: 50%; left: 50%; margin-top:-200px; margin-left:-200px; } .filetitle a, .replytitle a { text-decoration: none; } .filetitle a:hover, .replytitle a:hover { text-decoration: underline; }";
	document.body.appendChild(csheet);
	
	function showOptionsScreen()
	{
		$Jq("body").css("overflow", "hidden");
		var overlayDiv = document.createElement("div");
		overlayDiv.setAttribute("id", "optionsOverlay");
		document.body.appendChild(overlayDiv);

		var optionsDiv = document.createElement("div");
		optionsDiv.setAttribute("id", "optionsScreen");
		optionsDiv.innerHTML = "<h1>/b/ Name Sync<a href='#' id='closeBtn' title='Close options'>X</a></h1>"+ver+"<h2>Options</h2><ul><li><input type='checkbox' id='syncOption' checked='true' /> <strong>Enable Sync</strong> Share and download names online</li><li><input type='checkbox' id='IDOption' checked='true' /> <strong>Show ID's</strong> Show ID's next to poster names</li><li><input type='checkbox' id='posterOption' checked='true' /> <strong>Show Poster Options</strong> Show options next to poster names</li><li><input type='checkbox' id='prependOption' checked='true' /> <strong>Cross-thread Links</strong> Add >>>/b/ to cross-thread links on Ctrl+V</li><li><input type='checkbox' id='appendOption' checked='true' /> <strong>Append Errors</strong> Show sync errors inside the quick reply box</li><li><input type='checkbox' id='overrideOption' checked='true' /> <strong>Override Fields</strong> Share these instead of the quick reply fields</li><li><input type='text' name='bName' id='bName' placeholder='Name' value='"+bName+"' /> <input type='text' name='bEmail' id='bEmail' placeholder='Email' value='"+bEmail+"' /> <input type='text' name='bSubject' id='bSubject' placeholder='Subject' value='"+bSubject+"' /></li></ul><h2>More</h2><ul><li><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>View changelog</a></li><li><a href='"+website+"' target='_blank'>View website</a></li><li id='updateLink'><a href='#'>Check for update</a></li></ul><br />";
		$Jq("#closeBtn").live("click", function () { hideOptionsScreen(); });
		overlayDiv.onclick = function () { hideOptionsScreen(); };
		document.body.appendChild(optionsDiv);
		
		$Jq("#bName").change(function() { bName = $Jq(this).val(); storeCookie(); });
		$Jq("#bEmail").change(function() { bEmail = $Jq(this).val(); storeCookie(); });
		$Jq("#bSubject").change(function() { bSubject = $Jq(this).val(); storeCookie(); });
		$Jq("#posterOption").click(function() { hideOptions(); });
		$Jq("#appendOption").click(function() { options[3] = String($Jq("#appendOption").is(":checked")); storeCookie(); });
		$Jq("#prependOption").click(function() { options[5] = String($Jq("#prependOption").is(":checked")); storeCookie(); });
		$Jq("#overrideOption").click(function() { options[4] = String($Jq("#overrideOption").is(":checked")); storeCookie(); });
		$Jq("#syncOption").click(function() { options[0] = String($Jq("#syncOption").is(":checked")); storeCookie(); });
		$Jq("#IDOption").click(function() { hideIds(); });
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
		
		if (options[0] == "false")
		{
			$Jq("#syncOption").attr("checked", false);
		}
		
		if (options[1] == false)
		{
			$Jq("#IDOption").attr("checked", false);
		}
		
		if (options[2] == false)
		{
			$Jq("#posterOption").attr("checked", false);
		}
		
		if (options[3] == "false")
		{
			$Jq("#appendOption").attr("checked", false);
		}
		
		if (options[4] == "false")
		{
			$Jq("#overrideOption").attr("checked", false);
		}

		if (options[5] == "false")
		{
			$Jq("#prependOption").attr("checked", false);
		}
		
		$Jq("#optionsScreen").fadeIn("fast");
	}
	
	function hideOptionsScreen()
	{
		$Jq("#optionsScreen").remove();
		$Jq("#optionsOverlay").remove();
		$Jq("body").css("overflow", "visible");
	}
	
	function hideIds()
	{
		var off = ".posteruid { display: none; }";
		var on = ".posteruid { display: inline; }";
		
		if (asheet.innerHTML == on || asheet.innerHTML == "")
			asheet.innerHTML = off;
		else
			asheet.innerHTML = on;
		
		options[1] = $Jq("#IDOption").is(":checked");
		storeCookie();
	}

	function hideOptions()
	{
		var off = ".filetitle, .replytitle { display: none; }";
		var on = ".filetitle, .replytitle { display: inline; }";
		
		if (bsheet.innerHTML == on || bsheet.innerHTML == "")
			bsheet.innerHTML = off;
		else
			bsheet.innerHTML = on;
			
		options[2] = $Jq("#posterOption").is(":checked");
		storeCookie();
	}
	
	// When document is fully loaded
	$Jq(document).ready(function() {
		if ($Jq("#qr").length)
		{
			addListenQR();
		}
		else
		{
			document.body.addEventListener('DOMNodeInserted', function(e)
			{
				if(e.target.nodeName=='DIV' && e.target.id == "qr")
				{
					addListenQR();
				}
			}, true);
		}

		// Download info from server
		setTimeout(function() { sync(); }, 1000);
	});
	
	$Jq(document).keyup(function(e) {
		// This could probably be done without looping every td 
		// and instead looping regex match results and checking if td link id exists
		// and if so, replace that link id. But it should only really be used once
		// by a user jumping threads in most cases so it doesn't matter
		
		// On ctrl+v paste
		if (t != "b" && e.ctrlKey && e.which != 65 && (e.which == 86 || e.which==118) && options[5] == "true")
		{
			// Append >>>/b/ to all
			var commentBox = $Jq('#qr').contents().find('textarea[name="com"]');
			commentBox.val(commentBox.val().replace(/>>(\d\d\d\d\d\d\d\d\d)/g, ">>>/b/$1"));
			
			// Remove >>>/b/ if in thread
			$Jq("form[name='delform'] > table tr > td[id]", document).each(function() {
				var id = $Jq(this).attr("id");
				commentBox.val(commentBox.val().replace(new RegExp(">>>/b/"+id, "g"), ">>"+id));
			});
		}
	});
	
	function addListenQR()
	{
		// Add submit listen to QR box
		var $currentIFrame = $Jq('#qr'); 
		$currentIFrame.contents().find(":submit").click(function()
		{
			var cName;
			var cEmail;
			var cSubject;
			var cFile = $currentIFrame.contents().find('input[type="file"]').val();
			
			if (options[4] == "true")
			{
				cName = bName;
				cEmail = bEmail;
				cSubject = bSubject;
			}
			else
			{
				cName = $currentIFrame.contents().find('input[name="name"]').val();
				cEmail = $currentIFrame.contents().find('input[name="email"]').val();
				cSubject = $currentIFrame.contents().find('input[name="sub"]').val();
			}
			
			if (cFile != lastFile && canPost == true && cName != "" && cFile != "" && options[0] == "true")
			{	
				canPost = false;
				lastFile = cFile;
				
				if (cFile.indexOf("C:\\fakepath\\") > -1)
					cFile = cFile.split("C:\\fakepath\\")[1];
				
				// Filename length fix
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
				
				if (parseInt(document.getElementById("imagecount").innerHTML) <= 152 && document.getElementById("count").innerHTML != "404")
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
	
	var setSyncStatus = function(type, msg)
	{
		var colour = "green";
		
		switch (type)
		{
			case 1: colour = "red"; break;
			case 2: colour = "gray"; break;
		}
		
		$Jq("#syncStatus").html(msg).css("color", colour);
		
		if (type == 1 && options[3] == "true")
		{
			$Jq(".warning").html("(Sync) "+msg);
			setTimeout(function() { $Jq(".warning").html(""); }, 5000);
		}
	}
	
	function sync()
	{		
		if (t == "b")
		{
			setSyncStatus(2, "Not available on board index");
			return;
		}
			
		if (options[0] == "true")
		{		
			$Jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				url: 'http://nassign.heliohost.org/s/q.php?t='+t,
			}).fail(function() {
				setSyncStatus(1, "Error retrieving names");
			}).done(function(data) {
				var content = data;

				try
				{
					var jsonBlocks = content.split("|");
					
					onlineNames = [];
					onlineFiles = [];
					onlineSubjects = [];
					onlineEmails = [];
					
					for (var i = 0; i < jsonBlocks.length -1; i++)
					{
						var p = jQuery.parseJSON(jsonBlocks[i]);

						for (var key in p)
						{
							if (p.hasOwnProperty(key))
							{
								switch (key)
								{
									case "n": onlineNames.push(unescape(p[key])); break;
									case "f": onlineFiles.push(unescape(p[key])); break;
									case "e": onlineEmails.push(unescape(p[key])); break;
									case "s": onlineSubjects.push(unescape(p[key])); break;
								}
							}
						}
					}

					setSyncStatus(0, "Online");
					updateElements();
				}
				catch (err)
				{
					setSyncStatus(1, "Error retrieving names (Script error)");
				}
			});
		}
		else
		{
			setSyncStatus(2, "Disabled");
		}
		
		if (parseInt(document.getElementById("imagecount").innerHTML) <= 152 && document.getElementById("count").innerHTML != "404")
		{
			setTimeout(function() { sync(); }, 30000);
		}
	}
	
	function updateElements()
	{
		if (t == "b")
			return;
		
		// Refresh for new cycle
		usedFilenames = [];
		
		// Process OP
		var optag = $Jq("form[name='delform'] > .op", document)[0];
		var id = $Jq(".posteruid", optag)[0].innerHTML;
		var nametag = $Jq(".postername", optag)[0];
		var filesizespan = $Jq(".filesize", optag)[0];
		var titlespan = $Jq(".filetitle", optag)[0];
		updatePost(id, nametag, filesizespan, titlespan);

		// Process replies separately because they differ
		// slightly in a few class names.
		$Jq("form[name='delform'] > table tr > td[id]", document).each(function() {
			var id = $Jq(".posteruid", this)[0].innerHTML;
			var nametag = $Jq(".commentpostername", this)[0];
			var filesizespan = $Jq(".filesize", this)[0];
			var titlespan = $Jq(".replytitle", this)[0];
			updatePost(id, nametag, filesizespan, titlespan);
		});

		storeCookie();
	}

	function updatePost(id, nametag, filesizespan, titlespan) {
		if(id == "(ID: Heaven)")
			return;

		var index = ids.indexOf(id);
		var filename = null;
		var name = null;
		var tripcode = null;
		var email = null;
		var subject = null;	
		var info = null;
		
		// These may be null if they don't exist yet.
		var assignbutton = $Jq(".assignbutton", titlespan)[0];
		var guessbutton = $Jq(".guessbutton", titlespan)[0];

		if(assignbutton == null) {
			assignbutton = document.createElement('a');
			assignbutton.href = "#";
			assignbutton.title = "Assign a name to this poster";
			assignbutton.setAttribute("class", "assignbutton");
			assignbutton.textContent = "+";
			assignbutton.onclick = (function() { var currentId = id; return function() { assignName(currentId); return false; } } )();
			titlespan.appendChild(assignbutton);
		}
		if(guessbutton == null) {	
			guessbutton = document.createElement('a');
			guessbutton.href = "#";
			guessbutton.title = "Guess this poster";
			guessbutton.setAttribute("class", "guessbutton");
			guessbutton.textContent = "?";
			guessbutton.onclick = function () { alert("Guessing requires a filename"); return false; };
			titlespan.appendChild(guessbutton);
		}

		if(options[0] == "true" && filesizespan != null) {
			var filenamespan = $Jq("span[title]", filesizespan)[0];
			if(filenamespan == null) {
				filenamespan = $Jq("a[href]", filesizespan)[0];
			}
			var fullname = $Jq(".fntrunc", filenamespan)[0];
			if(fullname != null) {
				filename = fullname.innerHTML;
			} else {
				filename = filenamespan.innerHTML;
			}
			info = getOnlineInfo(filename);
			if(info[0] != null && info[0] != "" && $Jq(filesizespan).closest("table").attr("class") != "inline" && usedFilenames.indexOf(filename) == -1) {
				if(index > -1) {
					names[index] = info[0];
				} else {
					names[names.length] = info[0];
					ids[ids.length] = id;

					index = ids.length-1;
				}
				
				email = info[1];
				subject = info[2];
				usedFilenames[usedFilenames.length] = filename;
			}
		}
		
		if (onlineNames.indexOf(names[index]) > -1)
		{
			var cell = titlespan;

			if (cell.hasChildNodes())
			{
				while (cell.childNodes.length >= 1)
				{
					cell.removeChild(cell.firstChild);
				} 
			}
		}
		
		if(index > -1) {
			name = names[index];
			tripcode = "";
			
			name = name.split("#");
			if (typeof name[1] != "undefined")
			{
				tripcode = "!" + name[1];
			}

			name = name[0];
			
			if (subject != null && subject != "")
			{
				titlespan.innerHTML = EncodeEntities(subject);
			}
			
			if (email != null && email != "")
			{
				nametag.innerHTML = "<a class='linkmail' href='mailto:" + EncodeEntities(email) + "'>" + EncodeEntities(name) + "</a>";
				
				if (tripcode != "")
				{
					nametag.innerHTML += "<a class='linkmail' href='mailto:" + EncodeEntities(email) + "' style='font-weight: normal !important; color: green !important;'> " + EncodeEntities(tripcode) + "</a>";
				}
			}
			else
			{
				nametag.innerHTML = EncodeEntities(name) + "<a style='font-weight: normal !important; color: green !important; text-decoration: none;'> " + EncodeEntities(tripcode) + "</a>";
			}
			
		} else {
			if(filename != null) {
				guessbutton.onclick = (function() {
					var currentId = id;
					var currentFilename = filename;
					return function() {
						guessPoster(currentId, currentFilename); return false;
					} } )();
			}
		}
		
		if (filename == null)
		{
			guessbutton.style.display = "none";
		}

	}
	
	// Return online info
	function getOnlineInfo(filename)
	{
		var index = onlineFiles.indexOf(filename);
		
		if (index > -1)
		{
			return [onlineNames[index], onlineEmails[index], onlineSubjects[index]];
		}
		else
		{
			return "";
		}
	}
	
	// Guess poster
	function guessPoster(id, filename)
	{		
		if (filename == "")
		{
			alert("Can not guess a poster without a filename");
		}
		else
		{
			$Jq.ajax({
				headers: {"X-Requested-With":"Ajax"},
				url: 'http://nassign.heliohost.org/s/g.php?f='+filename
			}).fail(function() {
				alert("Error guessing name");
			}).done(function(data) {
				var guessed = data;
				
				if (guessed == "")
				{
					alert("Could not guess the name of this poster");
				}
				else
				{
					guessed = unescape(guessed);
					
					var promptName = guessed.split("#");
					var promptTripcode = "";
					
					if (typeof promptName[1] != "undefined")
					{
						promptTripcode = " !" + promptName[1];
					}

					promptName = promptName[0];
					
					if (confirm("This poster is guessed as " + promptName + promptTripcode + ", apply name? Your guess will be marked with a *"))
					{
						// Check if the ID already has a name applied
						var index = ids.indexOf(id);
						
						if (index > -1)
						{
							// If it does, rewrite it
							names[index] = guessed + "*";
						}
						else
						{
							// Otherwise write a new entry
							names[names.length] = guessed + "*";
							ids[ids.length] = id;
						}
						
						updateElements();
					}
				}
			});
		}
	}
	
	// Assign personal name
	function assignName(id)
	{
		// Ask for name
		var name = prompt("What would you like this poster to be named?","");
		
		// If name is not blank
		if (name != null && name != "")
		{
			// Check if the ID already has a name applied
			var index = ids.indexOf(id);
			
			if (index > -1)
			{
				// If it does, rewrite it
				names[index] = name;
			}
			else
			{
				// Otherwise write a new entry
				names[names.length] = name;
				ids[ids.length] = id;
			}
			
			updateElements();
		}
	}
	
	function storeCookie()
	{
		// Expires after one day
		var exp = new Date();
		exp.setTime(exp.getTime() + (1000 * 60 * 60 * 24));

		// If stored names and ids are getting too long
		if (names.length > 40 && ids.length > 40)
		{
			names.splice(0, 1);
			ids.splice(0, 1);
		}
		
		var namesJoin = names.join("|");
		var idsJoin = ids.join("|");
		
		document.cookie = "bName" + "=" + escape(bName) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
		document.cookie = "bEmail" + "=" + escape(bEmail) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
		document.cookie = "bSubject" + "=" + escape(bSubject) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
		document.cookie = "names" + "=" + escape(namesJoin) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
		document.cookie = "ids" + "=" + escape(idsJoin) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
		document.cookie = "options" + "=" + escape(options[0]) + "|" + escape(options[1]) + "|" + escape(options[2]) + "|" + escape(options[3]) + "|" + escape(options[4]) + "|" + escape(options[5]) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
	}

	function loadCookie()
	{
		var nameC = readCookie("bName");
		
		if (nameC != null)
		{
			bName = nameC;
		}
		
		nameC = readCookie("bEmail");
		
		if (nameC != null)
		{
			bEmail = nameC;
		}
		
		nameC = readCookie("bSubject");
		
		if (nameC != null)
		{
			bSubject = nameC;
		}		
		
		var namesSplit = readCookie("names");
		var idsSplit = readCookie("ids");
		
		if (namesSplit != null && idsSplit != null)
		{
			names = namesSplit.split("|");
			ids = idsSplit.split("|");
		}
		
		var guessing = readCookie("options");
		
		if (guessing != null)
		{
			var cOptions = guessing.split("|");
			
			if (cOptions.length == options.length)
			{
				options = [];
				options = cOptions;
			}
			
			if (options[1] == "false")
			{
				hideIds();
			}
			if (options[2] == "false")
			{
				hideOptions();
			}
		}
	}

	function readCookie(name)
	{
		var dc = document.cookie;	
		var cname = name + "=";
		
		if (dc.length > 0)
		{
			var begin = dc.indexOf(cname); 
			var end;
			
			if (begin != -1)
			{
				begin += cname.length;
				end = dc.indexOf(";", begin);
				
				if (end == -1)
					end = dc.length;
				
				return unescape(dc.substring(begin, end));
			}
		}
		
		return null;
	}
	
	function EncodeEntities(s){
		return $Jq("<div/>").text(s).html();
	}
	function DencodeEntities(s){
		return $Jq("<div/>").html(s).text();
	}
	
	// Update elements on load
	loadCookie();
	updateElements();

	// Add new reply listen
	document.body.addEventListener('DOMNodeInserted', function(e)
	{
		if(e.target.nodeName=='TABLE')
		{
			updateElements();
		}
	}, true);
}

addJQuery(setUp);
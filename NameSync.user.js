// ==UserScript==
// @name          /b/ Name Sync
// @description   Shares your name with other posters on /b/. Also allows you to assign names to Anonymous posters.
// @author        milky
// @contributor   my name here
// @include       http*://boards.4chan.org/b/res/*
// @updateURL     https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @homepage      http://nassign.heliohost.org/beta/
// @version       2.0.6
// ==/UserScript==

function addJQuery(a)
{
	var script = document.createElement("script");
	script.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js");
	script.addEventListener('load', function() {
	var script = document.createElement("script");
	script.textContent = "(" + a.toString() + ")();";
	document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

function setUp()
{
	var names = new Array();
	var ids = new Array();

	var onlineNames = new Array();
	var onlineFiles = new Array();

	var t = document.URL;
	t = t.replace(/^.*\/|\.[^.]*$/g, '');
	t = t.substring(0, 9);
	
	var lastFile = "";
	
	var host = "http://whateverorigin.org";
	
	var canPost = true;
	
	// Insert options html
	var onlineElement = document.createElement("input");
	onlineElement.setAttribute("id", "onlineEnabled");
	onlineElement.setAttribute("type", "checkbox");
	onlineElement.checked = true;
	onlineElement.setAttribute("title", "Share and download names online");
	var idsElement = document.createElement("input");
	idsElement.setAttribute("id", "idsEnabled");
	idsElement.setAttribute("type", "checkbox");
	idsElement.checked = true;
	idsElement.setAttribute("title", "Show ID's next to poster names");
	idsElement.onclick = function() { hideIds(); };
	var optElement = document.createElement("input");
	optElement.setAttribute("id", "optEnabled");
	optElement.setAttribute("type", "checkbox");
	optElement.checked = true;
	optElement.setAttribute("title", "Show options next to poster names");
	optElement.onclick = function() { hideOptions(); };
	var delForm = document.getElementsByName("delform")[0];
	document.body.insertBefore(onlineElement, delForm);
	document.body.insertBefore(document.createTextNode("Enable sync"), delForm);
	document.body.insertBefore(document.createElement("br"), delForm);
	document.body.insertBefore(idsElement, delForm);
	document.body.insertBefore(document.createTextNode("Show ID's"), delForm);
	document.body.insertBefore(document.createElement("br"), delForm);
	document.body.insertBefore(optElement, delForm);
	document.body.insertBefore(document.createTextNode("Show poster options"), delForm);
	document.body.insertBefore(document.createElement("br"), delForm);
	var syncStatus = document.createElement("span");
	syncStatus.setAttribute("id", "syncStatus");
	syncStatus.innerHTML = "Sync: Loading...";
	document.body.insertBefore(syncStatus, delForm);
	document.body.insertBefore(document.createElement("br"), delForm);
	document.body.insertBefore(document.createElement("br"), delForm);
	var asheet = document.createElement('style');
	document.body.appendChild(asheet);
	var bsheet = document.createElement('style');
	document.body.appendChild(bsheet);
	var csheet = document.createElement('style');
	csheet.innerHTML = ".filetitle a, .replytitle a { text-decoration: none; } .filetitle a:hover, .replytitle a:hover { text-decoration: underline; }";
	document.body.appendChild(csheet);
	
	function hideIds()
	{
		var off = ".posteruid { display: none; }";
		var on = ".posteruid { display: inline; }";
		
		if (asheet.innerHTML == on || asheet.innerHTML == "")
			asheet.innerHTML = off;
		else
			asheet.innerHTML = on;
			
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
			
		storeCookie();
	}
	
	// When document is fully loaded
	$(document).ready(function() {
		if ($("#qr").length)
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

		// Download names and filenames from server
		setTimeout(function() { sync(); }, 1000);
	});
	
	function addListenQR()
	{
		// Add submit listen to QR box
		var $currentIFrame = $('#qr'); 
		$currentIFrame.contents().find(":submit").click(function()
		{
			var cName = $currentIFrame.contents().find('input[name="name"]').val();
			var cFile = $currentIFrame.contents().find('input[type="file"]').val();
			
			if (cFile.indexOf("C:\\fakepath\\") > -1)
					cFile = cFile.split("C:\\fakepath\\")[1];
			
			if (cFile != lastFile && canPost == true)
			{	
				cName = escape(cName);
				
				// Filename length fix
				if (cFile.length-4 > 30)
				{
					var start = cFile.substring(0, 30);
					var end = cFile.substring(cFile.length-4, cFile.length);
					cFile = start + "(...)" + end;
				}
				
				cFile = escape(cFile);
				
				if (cName != "" && cFile != "" && document.getElementById("onlineEnabled").checked)
				{
					var xmlhttp;

					if (window.XMLHttpRequest)
						xmlhttp = new XMLHttpRequest();
					
					if (location.protocol == "https:")
					{
						xmlhttp.open("GET","http://nassign.heliohost.org/script/store.php?f="+cFile+"&n="+cName+"&t="+t, true);
					}
					else
					{
						xmlhttp.open("GET","http://nassign.heliohost.org/script/store.php?f="+cFile+"&n="+cName, true);
					}
					
					xmlhttp.send();
					
					canPost = false;
					setTimeout(function() { postSet(); }, 30000);
				}
			}
			
			lastFile = cFile;
		});
	}
	
	function postSet()
	{
		canPost = true;
	}
	
	function sync()
	{
		if (document.getElementById("onlineEnabled").checked)
		{	
			$.getJSON(host+'/get?url=http%3A//nassign.heliohost.org/script/query.php?t='+t+'&callback=?', function(data){
				var content = data.contents;
				
				try
				{
					var jsonBlocks = content.split("|");
					
					onlineNames = [];
					onlineFiles = [];
					
					for (var i = 0; i < jsonBlocks.length -1; i++)
					{
						var p = jQuery.parseJSON(jsonBlocks[i]);
					
						for (var key in p)
						{
						  if (p.hasOwnProperty(key))
						  {
							if (key == "n")
							{
								onlineNames.push(unescape(p[key]));
							}
							if (key == "f")
							{
								onlineFiles.push(unescape(p[key]));
							}
						  }
						}
					}
					
					document.getElementById("syncStatus").innerHTML = "Sync: Online";
					document.getElementById("syncStatus").style.color = "green";
					
					updateElements();
				}
				catch (err)
				{
					document.getElementById("syncStatus").innerHTML = "Sync: Error retrieving names, retrying in 30 seconds";
					document.getElementById("syncStatus").style.color = "red";
				}
			});
		}
		else
		{
			document.getElementById("syncStatus").innerHTML = "Sync: Disabled";
			document.getElementById("syncStatus").style.color = "gray";
		}
		
		setTimeout(function() { sync(); }, 30000);
	}
	
	function updateElements()
	{
		// Store all span elements in a variable
		var spans = document.getElementsByTagName("span");

		// Loop to add + button to posts and update names
		for (var i = 0; i < spans.length; i++)
		{
			var gb, as;
			var filename = "";
			
			// Add button
			if ((spans[i].className == "replytitle" || spans[i].className == "filetitle") && spans[i+2].innerHTML != "(ID: Heaven)")
			{
				var id = spans[i+2].innerHTML;
				var index = ids.indexOf(id);
				
				if (spans[i].innerHTML == "" || onlineNames.indexOf(names[index]) > -1)
				{
					if (onlineNames.indexOf(names[index]) > -1)
					{
						var cell = spans[i];

						if (cell.hasChildNodes())
						{
							while (cell.childNodes.length >= 1)
							{
								cell.removeChild(cell.firstChild);
							} 
						}
					}
					else
					{
						as = document.createElement('a');
						as.href = "#";
						as.title = "Assign a name to this poster";
						as.textContent = "+";
						as.onclick = (function() { var currentId = id; return function() { assignName(currentId); return false; } } )();
						
						gb = document.createElement('a');
						gb.href = "#";
						gb.title = "Guess this poster";
						gb.textContent = "?";
						gb.onclick = function () { alert("Guessing requires a filename"); return false; };
						gb.style.display = "none";
					
						spans[i].appendChild(as);
						spans[i].appendChild(gb);
					}
				}
			}
			
			if (spans[i].className == "posteruid")
			{
				// Step one: Get ID
				var id = spans[i].innerHTML;
				var index = ids.indexOf(id);
				
				// Step two: Get filename
				if (document.getElementById("onlineEnabled").checked && id != "(ID: Heaven)")
				{
					var filenameSpan;
					
					// Find filename span
					if (spans[i-2].className == "filetitle")
					{
						// If OP
						filenameSpan = spans[i-3];
					}
					else
					{
						// If reply
						filenameSpan = spans[i+4];
					}
					
					// Move ahead of one span if X back links are in the way
					if (typeof filenameSpan !== "undefined" && filenameSpan.className == "filesize")
					{
						filenameSpan = spans[i+5];
					}
					
					if (typeof filenameSpan !== "undefined" && filenameSpan.className == "replytitle")
					{
						if (spans[i+3].className == "container")
						{
							filenameSpan = spans[i+4];
						}
						else
						{
							filenameSpan = spans[i+3];
						}
					}
					
					if (typeof filenameSpan !== "undefined")
					{
						filename = filenameSpan.innerHTML;
					}
					
					// If filename is valid
					if (filename != "" && filename.indexOf("google") == -1 && (filename.indexOf(".png") > -1 || filename.indexOf(".gif") > -1 || filename.indexOf(".jpg") > -1))
					{
						// Update guess button
						if (typeof gb != "undefined")
						{
							gb.onclick = (function() { var currentId = id; var currentFilename = filename; return function() { guessPoster(currentId, currentFilename); return false; } } )();
							gb.style.display = "inline";
						}
					}
				}
				
				// Step three: Check if this name is new, or needs updating
				var guess = getOnlineName(filename);
					
				if (guess != "")
				{	
					if (index > -1)
					{
						// If ID exists, update name there
						names[index] = guess;
					}
					else
					{
						// Otherwise write new
						names[names.length] = guess;
						ids[ids.length] = id;
						
						// Update index with our new one
						index = ids.length;
					}
				}
				
				// Step four: Update name innerHTML if the ID now exists
				if (index > -1)
				{
					var name = names[index];
					var tripcode = "";
					
					name = name.split("#");
					if (typeof name[1] != "undefined")
					{
						tripcode = "!" + name[1];
					}

					name = name[0];
					
					spans[i-1].innerHTML = name + " " + "<a style='font-weight: normal !important; color: green !important; text-decoration: none;'>" + tripcode + "</a>";
				}
			}
		}
		
		storeCookie();
	}
	
	// Return an online name
	function getOnlineName(filename)
	{
		var index = onlineFiles.indexOf(filename);
		
		if (index > -1)
		{
			return onlineNames[index];
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
			$.getJSON(host+'/get?url=http%3A//nassign.heliohost.org/script/guess.php%3Ff%3D'+filename+'&callback=?', function(data){
				var guessed = data.contents;
				
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

		//If stored names and ids are getting too long
		if (names.length > 40 && ids.length > 40)
		{
			names.splice(0, 1);
			ids.splice(0, 1);
		}
		
		var namesJoin = names.join("|");
		var idsJoin = ids.join("|");
		
		document.cookie = "names" + "=" + escape(namesJoin) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
		document.cookie = "ids" + "=" + escape(idsJoin) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 

		document.cookie = "options" + "=" + escape(document.getElementById("onlineEnabled").checked) + "|" + escape(document.getElementById("idsEnabled").checked) + "|" + escape(document.getElementById("optEnabled").checked) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
	}

	function loadCookie()
	{
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
			var options = guessing.split("|");
			
			if (options[0] == "false")
			{
				document.getElementById("onlineEnabled").checked = false;
			}
			if (options[1] == "false")
			{
				document.getElementById("idsEnabled").checked = false;
				hideIds();
			}
			if (options[2] == "false")
			{
				document.getElementById("optEnabled").checked = false;
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
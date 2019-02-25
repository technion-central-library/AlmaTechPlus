function alertScreenInit(tabid,params) {
	$("div[id='options-logo']").append("<img alt='Technion Library' src='" + chrome.extension.getURL("icons/configuration_logo.png") + "' />");
	document.getElementById("alert_hider").addEventListener("click", function(){closeExtensionScreen("alert");}, false);
	document.getElementById("cancelButton").addEventListener("click",function(){closeExtensionScreen("alert");}, false);
	document.getElementById("okButton").addEventListener("click",function() {closeAlertwithOK(window["tabid"]);}, false);
	window["tabid"] = tabid;
	var str;
	if (tabid == 1) {
		var f = params["fieldsCount"];
		str = "Are you sure you want to delete ";
		if (f == 1) {
			str += "the selected field?";
		} else {
			str += f + " fields?";
		}
		str = "<h3>" + str + "</h3>";
	} else if (tabid == 2) {
		str = "<h3>Are you sure you want to copy the left record on top of the right record?</h3><!--h2>After copy the right record will be closed.</h2-->";
	}
	$("div[class='alert_content']").html(str);
	$("div[id='alert_container']").show(500);
}

function closeAlertwithOK(tabid) {
	if (tabid == 1) {
		// multiple delete
		window["DELETE_INT_ID"] = setInterval(deleteFields, 100);
	} else if (tabid == 2) {
		mergeBibRecord();
	}
	closeExtensionScreen("alert");
}


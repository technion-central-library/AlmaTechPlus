
chrome.extension.sendMessage({}, function(response) {
	// extend alma
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			chrome.storage.sync.get(function (obj) {
				almaApplicationsInit();
				setInterval(almaApplicationsInterval, 1000);
			});
		}
	}, 10);
});

function almaApplicationsInterval() {
	if ($("#breadcrumbs").length == 1 && $("#breadcrumbs").attr("indicator") != "true") {
		console.log("--> Technion extension - Alma new page");
		$("#breadcrumbs").attr("indicator","true");
		switch (document.getElementsByTagName("body")[0].getAttribute("id")) {
			case "body_id_xml_file_loan.fulfillment_checkout.xml":
				handleApplicationBarcodeScanner();
				break;
			case "body_id_xml_file_mdeditor.md_editor.xml":
				window["MD_MERGE_INT_ID"] = setInterval(handleApplicationMDEditor, 300);
				break;
			case "body_id_xml_file_sets.set_details.xml":
				handlePreviewSetInPortal();
				break;
			default:
				//do nothing for now
		}
	}
}

function almaApplicationsInit() {
	updateAlmaColors();
	var keys = new Array("barcode","apikey","server","primaryColor","secondaryColor");
	for(var i=0; i<keys.length; i++) {
		backwardCompatibilityStorage(keys[i]);
	}
	var temp = "<div class='btn-group menuIcons' id='ALMA_MENU_TOP_NAV_EXTENTION' title='' data-placement='bottom' data-original-title='Open Alma extension configuration'><button type='button' class='btn padSides9 transparentBg padding0 shadow0 height100P'><a id='menu-link-extension' aria-label='Open Alma extension configuration' href='' tabindex='-1'><i class='uxf-icon lineHeight50 whiteColor font20'><img src='[IMG_PATH]' /></i></a></button></div>";
	temp = temp.replace("[IMG_PATH]",chrome.extension.getURL("icons/configbtn.png"));
	$("div[id='ALMA_MENU_TOP_NAV_help']").parent().prepend(temp);
	$("a[id='menu-link-extension']").add($("div[id='ALMA_MENU_TOP_NAV_EXTENTION']")).on("click", function() {
		openExtensionScreen("options",1);
		return false;
	});
	setDefaultBarcodeConfiguration();
}

function setDefaultBarcodeConfiguration() {
	// set default values for the first time the extension is used
	var barcodeKey = getStorageKey("barcode");
					console.log("--> [1]Technion extension - set barcode default configuration:" + barcodeKey);

	chrome.storage.local.get(barcodeKey, function (result) {
		console.log("--> [2]Technion extension - set barcode default configuration:" + result[barcodeKey]);

		if (result[barcodeKey] == null) {
			var val = "inactive";
			if (isTechnion()) {
				val = "IL";
			} else if (isIDC()) {
				val = "IDC";
			}			
			console.log("--> [3]Technion extension - set barcode default configuration:" + val);
			chrome.storage.local.set({[barcodeKey]:val}, function() {
				console.log("--> Technion extension - set barcode default configuration:" + val);
			});				
		}
	});
}

function isTechnion() {
	return (document.location.href.indexOf("technion") > 0);
}

function isIDC() {
	return (document.location.href.indexOf("icc-idc") > 0);
}

function getStorageKey(str) {
	return (document.location.href.split("/")[2]) + "-" + str;
}


/////////////////////////////////////////////////////////////////////////////////////
/// Open Screen "options" , "alert"
/////////////////////////////////////////////////////////////////////////////////////

function openExtensionScreen(name,tabid,params) {
	// name = "options"
	if ($("div[id='" + name + "_container']").length == 0 && window["SCREEN_INT_ID"] == null) {
		// open the screen
		$("body").prepend("<div id='" + name + "_container'></div>");
		$("body").prepend("<div id='" + name + "_hider'></div>");
		//$("div[id='options_container']").css("visibility", "hidden");
		$("div[id='" + name + "_container']").hide();
		$("div[id='" + name + "_container']").load(chrome.extension.getURL("src/" + name + ".html"));
		window["SCREEN_INT_ID"] = setInterval(extensionScreenLoaded, 300, name, tabid, params);
	}
}

function extensionScreenLoaded(name, tabid, params) {
	if ($("div[id='screen-init-indicator']").length == 1) {
		clearInterval(window["SCREEN_INT_ID"]);
		window["SCREEN_INT_ID"] = null;
		window[name + "ScreenInit"](tabid, params);
	}
}

function closeExtensionScreen(name) {
	$("div[id='" + name + "_container']").hide(500,"swing", function() { 
		$("div[id='" + name + "_container']").remove();
		$("div[id='" + name + "_hider']").remove();
	});
}

/////////////////////////////////////////////////////////////////////////////////////
/// Barcode scanner app
/////////////////////////////////////////////////////////////////////////////////////

function handleApplicationBarcodeScanner() {
	chrome.storage.local.get(getStorageKey("barcode"), function (result) {
		var barcodeLogic = result[getStorageKey("barcode")];
		if (barcodeLogic == "inactive") {
			return;
		}
		console.log("--> Technion extension - barcode scanner [" + barcodeLogic + "]");
		//console.log("--> barcodeLogic[1]>>" + barcodeLogic + " >>" + getStorageKey("barcode"));
		document.addEventListener('keypress', function (e) {
			if (e.keyCode == 13) { //Enter
				var obj = document.getElementById("pageBeandisplayNameOfUserOrUserIdendifier");
				if (obj != null) {
							//console.log("--> barcodeLogic[2]>>" + barcodeLogic);

					var orig = obj.value;
					obj.value = getIdLogicBased(obj.value, barcodeLogic, true);
					if (orig != obj.value) {
						window["BARCODE_INT_ID"] = setInterval(validateBarcode, 200, orig, barcodeLogic);
					}
				}
			}
		});	
	});	
}

function validateBarcode(id, barcodeLogic) {
	var obj = document.getElementById("pageBeandisplayNameOfUserOrUserIdendifier");
	if (obj == null) { //sucess went to result page
		clearInterval(window["BARCODE_INT_ID"]);
	} else if ($("div[id='error']").length == 1) {
		clearInterval(window["BARCODE_INT_ID"]);
		obj.value = getIdLogicBased(id, barcodeLogic, false);
		$("button[id='cbuttongo']").trigger("click");
	}
}


function getIdLogicBased(id, barcodeLogic, isFirstTry) {
	console.log("--> getIdLogicBased >>" + id + "<<>>" + barcodeLogic + "<<>>" + isFirstTry + "<<");
	if (id == "" || id.length != 12) {
		// do nothing
	} else if (barcodeLogic == "IL") {
		if (isFirstTry && id.substr(0,2)=="00" && isValidIsraeliID(id.substr(2,9))) {
			id=id.substr(2,9);
		} else if (isValidIsraeliID(id.substr(0,9))) {
			id=id.substr(0,9);
		}
	} else if (barcodeLogic == "IDC") {
		if (isFirstTry) {
		   id=id.substr(0,9);
		}
	}
console.log("--> getIdLogicBased return  >>" + id + "<<");
	
	return id;
}

function isValidIsraeliID(id) {
  return /\d{9}/.test(id) && Array.from(id, Number).reduce((counter, digit, i) => {
        const step = digit * ((i % 2) + 1);
        return counter + (step > 9 ? step - 9 : step);
    }) % 10 === 0;
}

/////////////////////////////////////////////////////////////////////////////////////
/// MD Editor setup apps
/////////////////////////////////////////////////////////////////////////////////////

function handleApplicationMDEditor() {
	console.log("wait");
	if ($("#mdeditor_container > iframe").contents().find(".exitButton.btn.btn-secondary").length == 1) {
		clearInterval(window["MD_MERGE_INT_ID"]);
		$("#mdeditor_container").append("<div id='snackbar'></div>"); // used for toast
		addEditorMenuIcon("Copy & Paste (right to left)","MenuIconBar.copypaste","icons/copy_paste.png","clickCopyPaste");
		addEditorMenuIcon("Delete Multiple Fields","MenuIconBar.deletemultiple","icons/multiple_delete.png","clickMultipleDelete");
		// add listener to "Edit" Menu
		// var editMenuObj = $("#mdeditor_container > iframe").contents().find("td[id='fileMenuId']").next();
		// $(editMenuObj).click(function() {
			// console.log("Edit is open" + $("#mdeditor_container > iframe").contents().find("td[id='MenuToolBar.removeMenuItem']").length);
		// });
		
		
		// $("#mdeditor_container > iframe").contents().find("td[class='menuPopupMiddleCenter']").change(function() {
			// console.log("Menu is change" + $("#mdeditor_container > iframe").contents().find("td[id='MenuToolBar.removeMenuItem']").length);
		// });
		
		// $("#mdeditor_container > iframe").contents().find("td[class='menuPopupMiddleCenter']").click(function() {
			// console.log("Menu is click" + $("#mdeditor_container > iframe").contents().find("td[id='MenuToolBar.removeMenuItem']").length);
		// });
// $("#mdeditor_container > iframe").contents().find("div[role='menubar'").click(function() {
			// console.log("click" + this);
		// });
		
	}
}

function addEditorMenuIcon(tit, id, src, functionName) {
	var temp = "<td align='left' style='vertical-align: top;'><div tabindex='0' class='gwt-PushButton new-Design gwt-PushButton-up' role='button' id='[MENU_DIV_ID]' title='[BUTTON_TITLE]' style='width: auto; height: auto; padding-left: 16px; padding-right: 16px;' aria-pressed='false'><input type='text' tabindex='-1' role='presentation' style='opacity: 0; height: 1px; width: 1px; z-index: -1; overflow: hidden; position: absolute;'><div class='html-face'><i id='[MENU_LIST_ITEM_ID]' class='icon-alma-ex-alma- font20 uxfBlueDarkHover'><img id='[MENU_IMG_ID]' src='[MENU_ICON_SRC]' height='20' width='20' /></i></div></div></td>";
	temp = temp.replace("[BUTTON_TITLE]",tit);
	temp = temp.replace("[MENU_DIV_ID]",id);
	temp = temp.replace("[MENU_IMG_ID]",id);
	temp = temp.replace("[MENU_LIST_ITEM_ID]",id);
	temp = temp.replace("[MENU_ICON_SRC]",chrome.extension.getURL(src));
	$("#mdeditor_container > iframe").contents().find("i[id='MenuIconBar.saveRecordImage']").parent().parent().parent().parent().append(temp);
	$("#mdeditor_container > iframe").contents().find("i[id='" + id + "']").click(function() {
		window[functionName]();
	});
}

function invokeEditorMenu(mainMenuName, subId) {
	// default mainMenuName is "FILE"
	var menuObj = $("#mdeditor_container > iframe").contents().find("td[id='fileMenuId']");
	if (mainMenuName == "EDIT") {
		menuObj = menuObj.next();
	}
  	window["EDITOR_MENU_INT_ID"] = setInterval(openSubMenu, 100, subId);
    menuObj.trigger("click");
}

function openSubMenu(subId) {
	if ($("#mdeditor_container > iframe").contents().find("td[id='" + subId + "']").length == 1) {
		clearInterval(window["EDITOR_MENU_INT_ID"]);
		$("#mdeditor_container > iframe").contents().find("td[id='" + subId + "']").trigger("click");
	} else {
		console.log("Wait for Menu interval id=" + window["EDITOR_MENU_INT_ID"]);
	}
}

/////////////////////////////////////////////////////////////////////////////////////
/// Copy paste - MD Editor app
/////////////////////////////////////////////////////////////////////////////////////

function clickCopyPaste() {
	chrome.storage.local.get(getStorageKey("apikey"), function (result) {
		window["almaApikey"] = result[getStorageKey("apikey")];
		chrome.storage.local.get(getStorageKey("server"), function (result) {
			window["almaServer"] = result[getStorageKey("server")];
			validateConfiguration();
		});
    });
}

function validateConfiguration() {
	if (window["almaServer"]  != null && window["almaServer"].length > 0 && window["almaApikey"] != null && window["almaApikey"].length) {
		initMerge()
	} else {
		// Missing configuration
		displayToast("Mandatory configuration is missing for C&P feature. Click <a id='toast-link' href='#'>here</a> to complete the configuration.",10);
		$("a[id='toast-link']").on("click", function() {
			openExtensionScreen("options",2); return false;
		});
	}	
}

function initMerge() {
	if($("#mdeditor_container > iframe").contents().find("div[id='MarcEditorView.title']").length == 2) {
		var str = $("#mdeditor_container > iframe").contents().find("div[id='MarcEditorView.title']").text();
		//var arr = str.split("(");
		var mms = new Array();
		for (var s of str.split("(")) {
			var arr = s.split(")");
			if (arr.length != 0 && arr[0].length == arr[0].replace(/[^0-9]/g,'').length) {
				mms.push(arr[0]);
			}
		}
		if (mms.length == 2) {
			console.log("target_mms=" + mms[0] + ", source_mms=" + mms[1]);
			getBibRecord(mms[1], "SOURCE");
			getBibRecord(mms[0], "TARGET");
		} else {
			displayToast("Error, unable to identify MMS IDs.",6);	
		}

	} else {
		displayToast("The C&P feature requires 2 frames in order to copy right to left.",6);
	}
}

function getBibRecord(mmsid, bitType) {
	var url = "https://api-" + window["almaServer"] + ".hosted.exlibrisgroup.com/almaws/v1/bibs/" + mmsid + "?apikey=" + window["almaApikey"]; 
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var str = this.responseText;
			window[bitType + "_MMSID"] = mmsid;
			window[bitType + "_XML"] = str;
			// instead of mergeBibRecord()  open confirmation screen
			openExtensionScreen("alert",2);
		// } else {
			// console.log("getBibRecord of " + bitType + " the state is >" + this.readyState + "< the status is >" + this.status + "<"); 
		}
	};
	xhttp.open("GET", url, true);
	xhttp.send();
}

// this method is invoked twice
function mergeBibRecord() {
	console.log("mergeBibRecord " + (window["SOURCE_MMSID"] != null && window["TARGET_MMSID"] != null));
	if (window["SOURCE_MMSID"] != null && window["TARGET_MMSID"] != null) {
		var targetStr = window["TARGET_XML"].replaceTag(window["SOURCE_XML"], "record");
		targetStr = targetStr.replace(window["SOURCE_MMSID"], window["TARGET_MMSID"]);
		updateBibRecordStep1(window["TARGET_MMSID"], targetStr);
	}	
}

function updateBibRecordStep1(mmsid, xmlString) {
	var url = "https://api-" + window["almaServer"] + ".hosted.exlibrisgroup.com/almaws/v1/bibs/" + mmsid + "?apikey=" + window["almaApikey"]; 
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			displayToast("Copy & Paste ended successfully. Select 'File->Reload Original Record' to view updates",10);
			//invokeEditorMenu("EDIT","MenuToolBar.splitEditorModeMenuItem");
			//window["CLOSE_RIGHT_RECORD_INT_ID"] = setInterval(updateBibRecordStep2, 100);
		} else if (this.readyState == 4 && this.status != 200){
			displayToast("Error in API call (" + this.status + "). Click <a id='toast-link' href='#'>here</a> to validate the API Key has write permissions",10);
			$("a[id='toast-link']").on("click", function() {
				openExtensionScreen("options",2); return false;
			});
		}
	};
	xhttp.open("PUT", url, true);
	xhttp.setRequestHeader("Content-type","application/xml; charset=utf-8");
	xhttp.send(xmlString);
}

function updateBibRecordStep2() {
	// wait for the right frame to close
	if($("#mdeditor_container > iframe").contents().find("div[id='MarcEditorView.title']").length == 1) {
		clearInterval(window["CLOSE_RIGHT_RECORD_INT_ID"]);
		invokeEditorMenu("FILE", "MenuToolBar.reloadMenuItem");
		window["CONFIRM_RELOAD_RECORD_INT_ID"] = setInterval(updateBibRecordStep3, 100);
	}
}

function updateBibRecordStep3() {
	var btn = $("#mdeditor_container > iframe").contents().find("button[id='yesButtonId']");
	// Confirm reload
	if(btn.length == 1) {
		clearInterval(window["CONFIRM_RELOAD_RECORD_INT_ID"]);
		invokeEditorMenu("FILE", "MenuToolBar.reloadMenuItem");
		btn.trigger("click");
	}
}

/////////////////////////////////////////////////////////////////////////////////////
/// Delete multiple - MD Editor app
/////////////////////////////////////////////////////////////////////////////////////

function clickMultipleDelete() {
	window["SELECTED_FIELDS_ARR"] = new Array();
	$("#mdeditor_container > iframe").contents().find(".selectedRow textarea").parent().parent().parent().parent().each(function (index, value) {
		// store the index of the <tr> of the textarea
		window["SELECTED_FIELDS_ARR"].push($(this).index());
	});
	if (window["SELECTED_FIELDS_ARR"].length > 0) {
		var params = {"fieldsCount":window["SELECTED_FIELDS_ARR"].length};
		openExtensionScreen("alert",1,params);
	} else {
		displayToast("You need to select fields",3);
	}
}

function deleteFields() {
	console.log("wait delete");
	if ($("#mdeditor_container > iframe").contents().find("tr[deleteIndicator='true']").length == 0) {
		if (window["SELECTED_FIELDS_ARR"].length != 0) {
			var index = window["SELECTED_FIELDS_ARR"].pop(); //delete from end to start
			var trElement =  $("#mdeditor_container > iframe").contents().find("table[id='editorTable-left'] > tbody > tr").eq(index);
			$(trElement).find("textarea").trigger("click");
			$(trElement).attr("deleteIndicator","true");
			// console.log("After Index[" + index + "]" + ($("#mdeditor_container > iframe").contents().find("tr[deleteIndicator='true']").length == 1));
			invokeEditorMenu("EDIT","MenuToolBar.removeMenuItem");			
		} else {
			clearInterval(window["DELETE_INT_ID"]);
			displayToast("Delete completed successfully",5);
		}
	}
}

/////////////////////////////////////////////////////////////////////////////////////
/// Customize Color app
/////////////////////////////////////////////////////////////////////////////////////

function updateAlmaColors() {
	chrome.storage.local.get(getStorageKey("primaryColor"), function (result) {
		var url = chrome.extension.getURL("style/runtime.css");
		var pColor = result[getStorageKey("primaryColor")];
		if ($("link[href='" + url + "']").length == 0 && pColor != null) {
			$("head").append("<link rel='stylesheet' href='" + url + "' type='text/css' />");
		} else if (pColor == null) {
			$("link[href='" + url + "']").remove();
		}
		if (pColor != null && pColor != window["primaryColor"]) {
			window["primaryColor"] = pColor;
			chrome.storage.local.get(getStorageKey("secondaryColor"), function (result) {
				document.documentElement.style.setProperty("--primary-color", pColor);
				document.documentElement.style.setProperty("--secondary-color", result[getStorageKey("secondaryColor")]);				
			});
		}
    });
}

/////////////////////////////////////////////////////////////////////////////////////
/// Preview Alma SET in Portal
/////////////////////////////////////////////////////////////////////////////////////
function handlePreviewSetInPortal() {
	if (isTechnion()) {
		var obj =  $("span[id='SPAN_FORM_ID_SECTION_c.sets.generalInformation_FORM_c.sets.setInformation_INPUT_pageBeansetid']");
		obj.html("<a href='https://library.technion.ac.il/he/Pages/Sets.aspx?reset=true&setId=" + obj.text() + "' target='_blank'>" + obj.text() + "</a>"); 
	}
}

/////////////////////////////////////////////////////////////////////////////////////
/// Utilities functions
/////////////////////////////////////////////////////////////////////////////////////

function displayToast(msg, displayDurationSeconds, bottomPadding) {
	if (displayDurationSeconds == null) {
		displayDurationSeconds = 3;
	}
	if (bottomPadding == null) {
		bottomPadding = 30;
	}	
	document.documentElement.style.setProperty("--snackbar-duration", Number(Number(displayDurationSeconds)-Number(0.5)) + "s");
	document.documentElement.style.setProperty("--snackbar-bottom-padding", bottomPadding+"px");
    var x = document.getElementById("snackbar");
    x.className = "show";
	x.innerHTML = msg;
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, Number(displayDurationSeconds)*1000);
}

String.prototype.replaceTag = function(sourceStr, tagName) {
	var stratTag = "<" + tagName + ">";
	var endTag = "</" + tagName + ">";
	var sourceTagStr = sourceStr.substring(sourceStr.indexOf(stratTag), sourceStr.indexOf(endTag));
	var targetTagStr = this.substring(this.indexOf(stratTag), this.indexOf(endTag));
	return this.replace(targetTagStr, sourceTagStr);
};

function backwardCompatibilityStorage(name) {
	chrome.storage.local.get(name, function (result) {
		if (result[name] != null) {
			var temp = result[name];
			result[name] = null;
			chrome.storage.local.get(getStorageKey(name), function (result) {
				result[getStorageKey(name)] = temp;
			});
		}
	});
}


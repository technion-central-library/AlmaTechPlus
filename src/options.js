function optionsScreenInit(tabid) {
	window.colorsArray = new Array(["#673AB7","#512DA8"],["#2196F3","#1976D2"],["#009688","#00796B"],["#E91E63","#C2185B"],["#FFC107","#FFA000"],["#3F51B5","#303F9F"],["#086375","#586F7C"],["#1DD3B0","#B8DBD9"],["#607D8B","#656176"]);
	restoreOptionsConfiguration();
	document.getElementById("updateURLButton").addEventListener("click",saveCopyPasteConfiguration);
	document.getElementById("updateBarcodeButton").addEventListener("click",saveBarcodeConfiguration);
	document.getElementById("testURLButton").addEventListener("click",isBibAPIValid);
	document.getElementById("resetColorButton").addEventListener("click",selectColorBox);
	document.getElementById("tab1").addEventListener("click",function() {openOptionsTab("tab1");}, false);
	document.getElementById("tab2").addEventListener("click",function() {openOptionsTab("tab2");}, false);
	document.getElementById("tab3").addEventListener("click",function() {openOptionsTab("tab3");}, false);
	document.getElementById("tab4").addEventListener("click",function() {openOptionsTab("tab4");}, false);
	document.getElementById("tab" + tabid).click();
	// color select tab
	var len = document.getElementsByClassName("internalRow").length;
	for (var i=0;i<len;i++) {
		document.getElementsByClassName("internalRow")[i].addEventListener("click", selectColorBox);
		document.getElementById("box_" + i + "_0").style.backgroundColor = window.colorsArray[i][0];
		document.getElementById("box_" + i + "_1").style.backgroundColor = window.colorsArray[i][1];
	}
	$("div[id='options_container']").find("li[class='options-configuration-icon']").each(function() {
		$(this).append("<img alt='Configuration icon' src='" + chrome.extension.getURL("icons/configuration.png") + "' />");
	});
	$("div[id='options_container']").find("li[class='options-overview-icon']").each(function() {
		$(this).append("<img alt='Configuration icon' src='" + chrome.extension.getURL("icons/overview.png") + "' />");
	});
	$("div[id='options_container']").find("li[class='step-by-step-icon']").each(function() {
		$(this).append("<img alt='Step by Step icon' src='" + chrome.extension.getURL("icons/stepbystep.png") + "' width='20' height='20' />");
	});	
	
	$("img[id='split-editor-image']").attr("src", chrome.extension.getURL("icons/" + $("img[id='split-editor-image']").attr("imgname")));
	$("img[id='multiple-delete-image']").attr("src", chrome.extension.getURL("icons/" + $("img[id='multiple-delete-image']").attr("imgname")));
	$("img[id='copy-paste-image']").attr("src", chrome.extension.getURL("icons/" + $("img[id='copy-paste-image']").attr("imgname")));
	$("img[id='refresh-image']").attr("src", chrome.extension.getURL("icons/" + $("img[id='refresh-image']").attr("imgname")));

	$("img[id='options-question-mark']").attr("src", chrome.extension.getURL("icons/qmark.png"));
	$("img[id='technion-logo']").attr("src", chrome.extension.getURL("icons/technion.png"));
	$("div[class='options-sponsor'] > a").attr("href", "mailto:techlib" + "@technion.ac.il");
	document.getElementById("step-href").addEventListener("click",function() {openOptionsTab("tab2_1");}, false);
	$("div[id='options-logo']").append("<img alt='Technion Library' src='" + chrome.extension.getURL("icons/configuration_logo.png") + "' />");
	//$("a[id='contact-options']").append("<img alt='Contact the Technion Library' src='" + chrome.extension.getURL("icons/contact_options.png") + "' />");
	//document.getElementById("options-screen-close").addEventListener("click", function(){closeOptionsScreen();}, false);
	document.getElementById("options_hider").addEventListener("click", function(){closeExtensionScreen("options");}, false);
	$("div[id='options_container']").show(500);

}

function restoreOptionsConfiguration() {
	chrome.storage.local.get(getStorageKey("apikey"), function (result) {
		var apikey = result[getStorageKey("apikey")];
		if(apikey != "undefined") {
			document.getElementById("apikeyObject").value = apikey;
		}
	});
	chrome.storage.local.get(getStorageKey("server"), function (result) {
		var ddArray = new Array(["",""],["APAC","ap"],["Europe","eu"],["North America","na"],["Canada","ca"]);
		document.getElementById("geographicObject").appendChild(getDropdown(ddArray, result[getStorageKey("server")]));
	});
	chrome.storage.local.get(getStorageKey("primaryColor"), function (result) {
		for (var i=0;i<window.colorsArray.length;i++) {
			if (window.colorsArray[i][0] == result[getStorageKey("primaryColor")]) {
				document.getElementById("box_" + i + "_0").classList.add("uiBoxLeft");
				document.getElementById("box_" + i + "_1").classList.add("uiBoxRight");					
			}
		}
	});
	chrome.storage.local.get(getStorageKey("barcode"), function (result) {
		var ddArray = new Array(["Israel ID","IL"],["Israel IDC","IDC"],["Inactive","inactive"]);
		document.getElementById("barcodeLogicObject").appendChild(getDropdown(ddArray, result[getStorageKey("barcode")]));
	});
}

function saveCopyPasteConfiguration() {
	var apikeyValue = document.getElementById("apikeyObject").value;
	var serverValue = document.getElementById("geographicObject").value;
	var key1 = getStorageKey("apikey");
	var key2 = getStorageKey("server");
	chrome.storage.local.set({[key1]:apikeyValue,[key2]:serverValue}, function() {
		displayToast("Configuration saved successfully",3,100);
	});
}

function saveBarcodeConfiguration() {
	var barcodeValue = document.getElementById("barcodeLogicObject").value;
	var key1 = getStorageKey("barcode");
	chrome.storage.local.set({[key1]:barcodeValue}, function() {
		displayToast("Configuration saved successfully",3,100);
	});
}

function openOptionsTab(tabid) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById("div_" + tabid).style.display = "block";
	document.getElementById(tabid.split("_")[0]).className += " active";
}

function isBibAPIValid() {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.responseText != "") {
			if (this.responseText.indexOf("GET - OK") > 0) {
				displayToast("SUCCESS",3,100);
			} else {
				displayToast("Error: " + this.responseText,5,100);
			}
		}
	};
	var apikeyValue = document.getElementById("apikeyObject").value;
	var serverValue = document.getElementById("geographicObject").value;
	if (apikeyValue != null && apikeyValue.length > 0 && serverValue != null && serverValue.length > 0) {
		var url = "https://api-" + serverValue + ".hosted.exlibrisgroup.com/almaws/v1/bibs/test?apikey=" + apikeyValue; 
		xhttp.open("GET", url, true);
		xhttp.send();
	} else {
		displayToast("Select the geographic location and insert the API key. They are both mandatory.",8, 100);
	}
}

function getDropdown(ddArray, selectedValue) {
	var fragment = document.createDocumentFragment();
	ddArray.forEach(function(dd, index) {
		var opt = document.createElement("option");
		opt.innerHTML = dd[0];
		opt.value = dd[1];
		if (selectedValue == dd[1]) {
			opt.selected = true;
		}
		fragment.appendChild(opt);
	});
	return fragment;
}

function selectColorBox(event) {
	var len = document.getElementsByClassName("internalRow").length;
	for (var i=0;i<len;i++) {
		// clean previous selected
		document.getElementById("box_" + i + "_0").classList.remove("uiBoxLeft");
		document.getElementById("box_" + i + "_1").classList.remove("uiBoxRight");
	}
	var key1 = getStorageKey("primaryColor");
	var key2 = getStorageKey("secondaryColor");
	if (event.target.id.indexOf("box") != -1) {
		var index = event.target.id.split("_")[1];
		document.getElementById("box_" + index + "_0").classList.add("uiBoxLeft");
		document.getElementById("box_" + index + "_1").classList.add("uiBoxRight");
		//console.log("Colors saved sucess '" + window.colorsArray[index][0] + "','" + window.colorsArray[index][1] + "'");
		displayToast("Color selection updated",3, 100);
		// console.log("Key1=" + [key1]);
		// console.log("Key2=" + [key2]);
		chrome.storage.local.set({[key1]:window.colorsArray[index][0],[key2]:window.colorsArray[index][1]}, function() {
			updateAlmaColors();
		});
	} else { //click reset
		chrome.storage.local.set({[key1]:null}, function() {
			updateAlmaColors();
		});
	}
}

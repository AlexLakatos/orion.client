/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*global eclipse:true dojo document */

eclipse = eclipse || {};
eclipse.Unittest = eclipse.Unittest || {};
eclipse.Unittest.Model = (function() {
	/**
	 * @name eclipse.Model
	 * @class Tree model used by eclipse.Explorer.
	 * TODO: Consolidate with eclipse.TreeModel.
	 */
	function Model(root) {
		this.root = root;
	}
	Model.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		getChildren: function(parentItem, /* function(items) */ onComplete){
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var result;
			if (item === this.root) {
				result = "treetable";
			} else {
				result = item.Name;
				// remove all non valid chars to make a dom id. 
//				result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			} 
			return result;
		}
	};
	return Model;
}());

eclipse.Unittest.Renderer = (function() {
	function Renderer () {
	}
	Renderer.prototype = {
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			
			dojo.addClass(tableNode, 'treetable');
			var thead = document.createElement('thead');
			var row = document.createElement('tr');

			var th = document.createElement('th');
			th.innerHTML = "Name";
			row.appendChild(th);

			var result= document.createElement('th');
			result.innerHTML = "Result";
			row.appendChild(result);

//			th = document.createElement('th');
//			th.innerHTML = "Date";
//			row.appendChild(th);
			
			thead.appendChild(row);
			tableNode.appendChild(thead);
			
//			dojo.style(actions, "textAlign", "center");
//			dojo.style(size, "textAlign", "right");

		},
		
		render: function(item, tableRow) {
			tableRow.cellSpacing = "8px";
			dojo.style(tableRow, "verticalAlign", "baseline");
			dojo.addClass(tableRow, "treeTableRow");
			var col, div, link;
			if (item.Directory) {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				var expandImg = dojo.create("img", {src: "/images/collapsed-gray.png", name: nameId}, div, "last");
				dojo.create("img", {src: "/images/silk/folder.png"}, div, "last");
				link = dojo.create("a", {className: "navlinkonpage", href: "#" + item.ChildrenLocation}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
				expandImg.onclick = dojo.hitch(this, function(evt) {
					this.tableTree.toggle(tableRow.id, nameId, '/images/expanded-gray.png', '/images/collapsed-gray.png');
				});
			} else {
				col = document.createElement('td');
				tableRow.appendChild(col);
				div = dojo.create("div", null, col, "only");
//				dojo.create("img", {src: "/images/none.png"}, div, "last");
				dojo.create("img", {src: item.result?"/images/unit_test/testok.gif":"/images/unit_test/testfail.gif"}, div, "first");
//				link = dojo.create("a", {className: "navlink", href: "/"}, div, "last");
				dojo.place(document.createTextNode(item.Name), div, "last");
			}
			
			var resultColumn = document.createElement('td');
			tableRow.appendChild(resultColumn);
		},
		rowsChanged: function() {
		}
		
	};
	return Renderer;
}());


var root = {children:[]};

dojo.addOnLoad(function(){
	// create registry and instantiate needed services
	var serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	var inputService = new eclipse.InputService(serviceRegistry);
	
	function runTests(fileURI) {
		//console.log("installing non-persistent plugin: " + fileURI);
		var testOverview = dojo.byId("test-overview");
		dojo.place(document.createTextNode("Running tests from: "), testOverview, "last");
		var link = dojo.create("a", {className: "navlink", href: "/coding.html#"+fileURI}, testOverview, "last");
		dojo.place(document.createTextNode(fileURI.substring(fileURI.lastIndexOf("/")+1)), link, "last");
		
		// these are isolated from the regular service and plugin registry
		var testServiceRegistry = new eclipse.ServiceRegistry();
		var testPluginRegistry = new eclipse.PluginRegistry(testServiceRegistry, {});
		
		
		testPluginRegistry.installPlugin(fileURI).then(function() {
			return testServiceRegistry.getService("testRunner");
		}).then(function(service) {
			//console.log("got service: " + service);

			var myTree = new eclipse.TableTree({
				model: new eclipse.Unittest.Model(root),
				showRoot: false,
				parent: "test-tree",
				labelColumnIndex: 0,  // 1 if with checkboxes
				renderer: new eclipse.Unittest.Renderer()
			});			

			var times = {};
			var testCount = 0;
			var _top;
			service.addEventListener("runStart", function(name) {
				var n = name ? name : "<top>";
				if (!_top) {
					_top = n;
				}
//				console.log("[Test Run] - " + name + " start");
				times[n] = new Date().getTime();
			});
			service.addEventListener("runDone", function(name, obj) {
				var n = name ? name : "<top>";
//				var result = [];
//				result.push("[Test Run] - " + name + " done - ");
//				result.push("[Failures:" + obj.failures + (name === top ? ", Test Count:" + testCount : "") +"] ");
//				result.push("(" + (new Date().getTime() - times[name]) / 1000 + "s)");
				delete times[n];
//				console.log(result.join(""));
			});
			service.addEventListener("testStart", function(name) {
				times[name] = new Date().getTime();
				testCount++;
			});
			service.addEventListener("testDone", function(name, obj) {
//				var result = [];
//				result.push(obj.result ? " [passed] " : " [failed] ");
//				result.push(name);
				var millis = new Date().getTime() - times[name];
//				result.push(" (" + (millis) / 1000 + "s)");
				delete times[name];
//				if (!obj.result) {
//					result.push("\n  " + obj.message);
//				}
//				console.log(result.join(""));
				root.children.push({"Name":name, result: obj.result, message: obj.message, millis: millis});
				myTree.refresh(root, root.children);
			});	
			service.run();
		});
	}

	serviceRegistry.getService("IInputProvider").then(function(input) {
		input.addEventListener("inputChanged", function(fileURI) {
			runTests(fileURI);
		});
		input.getInput(function(fileURI) {
			runTests(fileURI);
		});
	});

});
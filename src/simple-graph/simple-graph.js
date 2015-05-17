//shim
require("document-register-element");

//element setup
var template = require("./_template.html");
require("./simple-graph.less");

//libraries
var csv = require("./csv");
var graph = require("./graph");

var parser = new csv.Parser();

var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  var html = this.innerHTML;
  this.innerHTML = template();
  html = html.split("\n").map(s => s.trim()).filter(s => s).join("\n");
  var data = parser.parse(html);
  var header = data.shift();
};
proto.attachedCallback = function() {};
proto.detachedCallback = function() {};
proto.attributeChangedCallback = function() {};

document.registerElement("simple-graph", { prototype: proto });
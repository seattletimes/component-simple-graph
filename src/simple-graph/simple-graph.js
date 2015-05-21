//shim
require("document-register-element");

//element setup
var template = require("./_template.html");
require("./simple-graph.less");
var Tabletop = require("./tabletop").Tabletop;

//libraries
var csv = require("./csv");
var Graph = require("./graph");

var parser = new csv.Parser();

var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  if (this.hasAttribute("sheet")) {
    var parsed = [];
    var sheetId = this.getAttribute("sheet");
    var self = this;
    Tabletop.init({ 
      key: sheetId, 
      callback: function(data, tabletop) {
        var header = [];
        for (var label in data[0]) {
          header.push(label);
        }
        parsed.push(header);
        data.forEach(function(row) {
          var parsedRow = [];
          for (var label in row) {
            parsedRow.push(row[label]);
          }
          parsed.push(parsedRow);
        });       
        self.innerHTML = template();
        var graph = new Graph(self, parsed);
      },
      simpleSheet: true,
      parseNumbers: true
    });
  } else {
    var html = this.innerHTML;
    html = html.split("\n").map(s => s.trim()).filter(s => s).join("\n");
    var data = parser.parse(html);
    this.innerHTML = template();
    var graph = new Graph(this, data);
  }
};
proto.attachedCallback = function() {};
proto.detachedCallback = function() {};
proto.attributeChangedCallback = function() {};

try {
  document.registerElement("simple-graph", { prototype: proto });
} catch (e) {
  console.log("<simple-graph> is already registered.");
}
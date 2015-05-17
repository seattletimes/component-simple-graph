var rgb = function(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
};

var palette = [
  rgb(229, 175, 155),
  rgb(202, 105, 81),
  rgb(255, 218, 162),
  rgb(248, 158, 93),
  rgb(181, 191, 169),
  rgb(121, 143, 113),
  rgb(213, 228, 240),
  rgb(163, 193, 221),
  rgb(199, 187, 220),
  rgb(123, 90, 166)
];

var detectIntervals = function(bounds) {
  var intervals = [1, 2, 5];
  var interval;
  var index = 0;
  var power = -2;
  var range = bounds.max - bounds.min;
  do {
    if (index == intervals.length) {
      index = 0;
      power++;
    }
    var step = intervals[index++ % intervals.length];
    interval = step * Math.pow(10, power);
    var count = range / interval;
    if (count > 3 && count < 7) {
      return interval;
    }
  } while (power < 10);
  return null;
}

var Graph = function(element, data) {
  this.data = null;
  this.canvas = element.querySelector("canvas");
  this.context = this.canvas.getContext("2d");
  this.styles = window.getComputedStyle(element);
  
  this.processData(data);
  this.draw();
};

Graph.prototype = {
  processData(data) {
    var headers = data.shift();
    this.headers = headers;
  
    var series = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      for (var j = 0; j < row.length; j++) {
        if (!series[j]) series[j] = [];
        series[j][i] = row[j];
      }
    }
    
    this.xLabels = series.shift();
    
    this.series = series;
  },
  setBounds() {
    var values = this.series.reduce((then, now) => then.concat(now), []);
    this.bounds = {
      max: Math.max.apply(null, values),
      min: Math.min.apply(null, values)
    };
    //add a little bit of padding
    this.bounds.max *= 1.1;
    //always zero-line unless numbers go negative
    if (this.bounds.min > 0) this.bounds.min = 0;
  },
  scaleY(val) {
    return (val - this.bounds.min) / (this.bounds.max - this.bounds.min);
  },
  getBox() {
    //handle media queries here, basically
    return {
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height - 20 //update this to match the styles
    }
  },
  draw() {
    var canvas = this.canvas;
    var context = this.context;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.setBounds();
    var box = this.getBox();
    
    this.series.forEach((series, index) => {
      context.strokeStyle = palette[index];
      var step = box.width / (series.length - 1);
      context.beginPath();
      series.forEach((d, i) => {
        var goto = i ? "lineTo" : "moveTo";
        var x = i * step + box.x;
        var y = box.height - this.scaleY(d) * box.height + box.y;
        context[goto](x, y);
      });
      context.stroke();
    });
    
    //draw x axis labels
    var labelStep = box.width / (this.xLabels.length - 1);
    context.textAlign = "left";
    this.xLabels.forEach((label, i, labels) => {
      var x = i * labelStep  + box.x;
      var size = this.styles.fontSize.replace("px", "") * 1;
      context.fillText(label, x, box.y + box.height + size);
      context.textAlign = "center";
    });
    
    //draw y axis lines
    var interval = detectIntervals(this.bounds);
    if (!interval) return;
    context.strokeStyle = "#DDD";
    context.textAlign = "left";
    var drawY = function(value, y) {
      context.beginPath();
      context.moveTo(box.x, y);
      context.lineTo(box.x + box.width, y);
      context.stroke();
      context.fillText(value, box.x + 4, y - 4);
    }
    var line, lineY;
    if (this.bounds.min < 0) {
      line = 0 - interval;
      lineY = box.height - this.scaleY(line) * box.height + box.y;
      while (lineY < box.height) {
        drawY(line, lineY);
        line -= interval;
        lineY = box.height - this.scaleY(line) * box.height + box.y;
        if (line < -1000) break;
      }
    }
    //start with the zero line
    context.strokeStyle = "#888";
    line = 0;
    lineY = box.height - this.scaleY(line) * box.height + box.y;
    while (lineY > 10) {
      drawY(line, lineY);
      context.strokeStyle = "#DDD";
      line += interval;
      lineY = box.height - this.scaleY(line) * box.height + box.y;
    }
  }
}

module.exports = Graph;
var rgb = function(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
};

const LINE = "#888";
const LABEL_PADDING = 8;
const BAR_PADDING = 8;

var palette = [
  rgb(229, 175, 155),
  rgb(163, 193, 221),
  rgb(248, 158, 93),
  rgb(181, 191, 169),
  rgb(123, 90, 166),
  rgb(121, 143, 113),
  rgb(213, 228, 240),
  rgb(202, 105, 81),
  rgb(199, 187, 220),
  rgb(255, 218, 162)
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
  this.mode = element.getAttribute("mode") || "line";
  this.data = null;
  this.scaler = null;
  this.canvas = element.querySelector("canvas");
  this.context = this.canvas.getContext("2d");
  
  //force reflow
  var _ = element.offsetWidth;
  
  this.setStyles(element);
  this.processData(data);
  this.draw();
  
  window.addEventListener("resize", this.draw.bind(this));
  
  //set up a refresh cycle to catch webfonts
  //this is a crappy way to work, but Typekit doesn't give us many options
  var redraw = () => {
    this.draw();
    window.setTimeout(redraw, 1000);
  };
  // window.setTimeout(redraw, 1000);
};

Graph.prototype = {
  setStyles(element) {
    var computed = window.getComputedStyle(element);
    this.styles = {
      color: computed.color,
      background: computed.background,
      fontFamily: computed.fontFamily.split(",").shift().trim(),
      fontSize: computed.fontSize.replace(/px/, "") * 1
    };
  },
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
    if (this.bounds.min > 0) {
      this.bounds.min = 0;
    } else {
      this.bounds.min *= 1.1;
    }
  },
  setArea() {
    //handle media queries here, basically
    //get the widest label size for the y axis
    var interval = detectIntervals(this.bounds);
    var start = Math.floor(this.bounds.min / interval) * interval;
    var labels = [];
    for (var i = start; i < this.bounds.max; i += interval) labels.push(i);
    var width = Math.max.apply(null, labels.map(l => this.context.measureText(l).width));
    this.box = {
      x: width + LABEL_PADDING,
      y: 0,
      width: this.canvas.width - (width + LABEL_PADDING) * 2,
      height: this.canvas.height - this.styles.fontSize - LABEL_PADDING
    }
  },
  setScaler() {
    var self = this;
    var barPadding = BAR_PADDING / self.series.length;
    this.scaler = {
      y: val => {
        var scaled = (val - self.bounds.min) / (self.bounds.max - self.bounds.min);
        return self.box.y + self.box.height - scaled * self.box.height;
      },
      x: (val, series) => {
        series = series || 0;
        if (self.mode == "bar") {
          var barWidth = self.scaler.barWidth;
          var groupWidth = barWidth * self.series.length + BAR_PADDING;
          var start = BAR_PADDING / 2 + groupWidth * val;
          return self.box.x + start + series * barWidth;
        }
        var scaled = val / (self.xLabels.length - 1);
        return self.box.x + scaled * self.box.width;
      },
      barWidth: self.box.width / (self.xLabels.length * self.series.length) - barPadding
    }
  },
  drawAxes() {
    var context = this.context;
    var box = this.box;
    
    //draw the box outline
    context.lineWidth = 1;
    context.strokeStyle = LINE;
    context.moveTo(box.x, box.y);
    context.lineTo(box.x, box.y + box.height);
    context.lineTo(box.x + box.width, box.y + box.height);
    context.stroke();
    
    //draw x axis labels
    var labelStep = box.width / (this.xLabels.length - 1);
    context.textAlign = "center";
    this.xLabels.forEach((label, i, labels) => {
      var x = this.scaler.x(i, this.series.length / 2);
      var size = this.styles.fontSize;
      context.fillText(label, x, box.y + box.height + size + LABEL_PADDING);
    });
    
    //draw y axis lines
    var interval = detectIntervals(this.bounds);
    if (!interval) return;
    context.strokeStyle = "#DDD";
    context.textAlign = "right";
    var drawY = (value, y) => {
      context.beginPath();
      context.moveTo(box.x, y);
      context.lineTo(box.x + box.width, y);
      context.stroke();
      context.fillText(value, box.x - LABEL_PADDING, y + this.styles.fontSize * .3);
    }
    var line, lineY;
    if (this.bounds.min < 0) {
      line = 0 - interval;
      lineY = this.scaler.y(line);
      while (lineY < box.height) {
        drawY(line, lineY);
        line -= interval;
        lineY = this.scaler.y(line);
        if (line < -1000) break;
      }
    }
    //start with the zero line
    context.strokeStyle = "#888";
    line = 0;
    lineY = this.scaler.y(line);
    while (lineY > 10) {
      drawY(line, lineY);
      context.strokeStyle = "#DDD";
      line += interval;
      lineY = this.scaler.y(line);
    }
  },
  draw() {
    var canvas = this.canvas;
    var context = this.context;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // font family/size/colors
    context.font = `${this.styles.fontSize}px ${this.styles.fontFamily}`;
    context.fillStyle = this.styles.color;
    
    this.setBounds();
    this.setArea();
    this.setScaler();
    
    this.drawAxes();
    
    //finally, draw actual series on top of everything else
    var box = this.box;
    context.lineWidth = 2;
    this.series.forEach((series, index) => {
      context.strokeStyle = palette[index];
      var step = box.width / (series.length - 1);
      if (this.mode == "line") {
        context.beginPath();
        series.forEach((d, i) => {
          var goto = i ? "lineTo" : "moveTo";
          var x = this.scaler.x(i);
          var y = this.scaler.y(d);
          context[goto](x, y);
        });
        context.stroke();
      } else {
        context.fillStyle = palette[index];
        series.forEach((d, i) => {
          context.beginPath();
          var x = this.scaler.x(i, index);
          var y = this.scaler.y(d);
          var zero = this.scaler.y(0);
          context.fillRect(x, y, this.scaler.barWidth, zero - y);
        });
      }
    });
  }
}

module.exports = Graph;
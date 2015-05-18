component-simple-graph
======================

A custom element for creating simple, static line and bar charts from CSV data. The first column in the data will be used to generate the x-axis, while remaining columns will be used for data series. For example, the following code would create a chart with five series in it::

    <simple-graph mode="bar">
      benchmark,Shell,Perl,Python,Ruby_1.8,Ruby_1.9
      sort,2.14,0.78,0.83,1.47,0.87
      sort 10x,15.81,6.91,4.80,22.21,9.44
      sort 20x,35.25,18.42,16.80,601.43,29.80
      sort 50x,112.12,600.34,126.91,600.61,80.12
      md5,26.98,0.88,0.94,0.47,0.57
      text replace,3.00,1.33,4.38,3.02,2.77
      http get,6.99,3.73,0.89,1.73,1.99
    </simple-graph>

You can also feed Google data into a graph from a spreadsheet by setting the ``sheet`` attribute on the element with the Google sheet ID. We do not recommend using this for long-term support, given that the Sheets API is not guaranteed to be stable, but it can be useful during breaking news situations::

    <simple-graph sheet="1U_gi_kTy6oHiEPpcHsfyKNwwOTJxS8qdg1oQB9jHzJU">
    </simple-graph>

The element will automatically scale the graph to fit the data, including negative numbers, although datasets with entirely positive values will be graphed against 0 (as is right and proper). 

Config options
--------------

``simple-graph`` may be configured via a number of attributes on the element.

* ``mode`` - (default: "line") If set to "bar", will use a grouped bar chart instead of a line chart.
* ``colors`` - Used to set the palette for the graph series. If there aren't enough colors provided, the default Seattle Times palette will be used to fill them in.
* ``sheet`` - Set this to a Google Sheets ID to load data from that sheet over AJAX. It will only use the first sheet in the workbook.
* ``nokey`` - Turns off visible keys. Keys are also disabled if there's only one series in the data.

Notes
-----

In an attempt to fit your site's CSS, the graph will load computed styles from the DOM and use those for its labels, although it does include some defaults (namely, font-size, margin, and max-width) scoped to the ``simple-graph`` selector. These can be overridden with any more-specific selector (a class is a good way to go).

``simple-graph`` was built using the `Seattle Times web component template <https://github.com/seattletimes/component-template>`__. It was completed with the support of a Knight-Mozilla code convening at the 2015 Write the Docs conference in Portland, OR.

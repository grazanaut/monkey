(function() {
  "use strict";

  var context = this;

  var exports = {
    name: 'A',
    children: [{
      name: 'A1'
    },{
      name: 'A2'
    },{
      name: 'A3',
      children: [{
        name: 'A3a',
        children: [{
          name: 'A3ai'
        }]
      },{
        name: 'A3b'
      }]
    }]
  };

  if (this.module) {
    this.module.exports = exports;
  }
  else if (typeof this.define === 'function' && this.define.amd) {
    this.define('testTree', [], function(require, exports, module) {
      module.exports = exports;
    });
  }
  else {
    this.testTree = exports;
  }

}).call(this);


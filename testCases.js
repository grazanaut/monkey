Prime8.forEach(testTree, function(obj) { console.log(obj.name); });
Prime8.forEach(testTree, function(obj) { console.log(obj.name); }, { depthFirst: false});
Prime8.some(testTree, function(obj) { return obj.name.match(/3/); });
Prime8.first(testTree, function(obj) { return obj.name.match(/3/); });
Prime8.first(testTree, function(obj) { return obj.name.match(/3/); }, { depthFirst: false} );
Prim8.pathTo(testTree, function(obj) { return obj.name.match(/3/); });
Prime8.map(testTree, function(obj, nodeInfo, children) { return { desc: obj.name, childs: children, path: nodeInfo.path, nodeInfo: nodeInfo }; });
Prime8.map(testTree, function(obj, nodeInfo, children) { return { desc: obj.name, childs: children, path: nodeInfo.path, nodeInfo: nodeInfo }; }, { depthFirst: false });
Prime8.every(testTree, function(cur, par) { return cur.name.match(/A/); });
Prime8.every(testTree, function(cur, par) { return cur.name.match(/^A$/); });
prim8.reduce(testTree, function(acc, cur, ni) {
  console.log(cur.name);
  acc.name += ';' + cur.name;
  return acc;
}, undefined, { depthFirst: false });
prim8.reduce(testTree, function(acc, cur, ni) {
  console.log(cur.name);
  acc.name += ';' + cur.name;
  return acc;
}, {name: 'Z'}, { depthFirst: false });
prim8.reduce(testTree, function(acc, cur, ni) {
  console.log(cur.name);
  console.log(cur.name.length);
  acc += cur.name.length;
  console.log(acc);
  return acc;
}, 0, { depthFirst: false });

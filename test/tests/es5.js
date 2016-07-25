package('ES5', function () {
  "use strict";

  // The scope when none is set.
  var nullScope = (function(){ return this; }).call();


  method('init', function() {
    // This will reset the array in < IE8. Modern browsers will ignore the element.
    var arr = [];
    arr[4294967295] = 'd';
    equal(arr.length, 0, 'Array internals will not allow more than a 32bit integer as a key. Anything higher will be ignored');
  });

  method('isArray', function() {

    // all following calls return true
    test(Array, [[]], true, 'empty array');
    test(Array, [[1]], true, 'simple array');
    test(Array, [new Array()], true, 'new array with constructor');
    test(Array, [Array.prototype], true, 'Array.prototype'); // Little known fact: Array.prototype is itself an array.

    // all following calls return false
    test(Array, [], false, 'no param');
    test(Array, [{}], false, 'object');
    test(Array, [null], false, 'null');
    test(Array, safeArray(undefined), false, 'undefined');
    test(Array, [17], false, 'number');
    test(Array, ["Array"], false, 'string');
    test(Array, [true], false, 'true');
    test(Array, [false], false, 'false');
  });


  method('forEach', function() {
    var arr, count, expected, result;

    arr = ['a','b','c'];

    raisesError(function(){ [].forEach(); }, 'Array#forEach | should raise an error when no fn given');
    result = arr.forEach(function(){
      equal(this, nullScope, 'Array#forEach | scope should be undefined when not passed');
    });
    result = arr.forEach(function(){
      equal(this.toString(), 'wasabi', 'Array#forEach | scope can be passed');
    }, 'wasabi');
    equal(result, undefined, 'Array#forEach | returns undefined');

    arr[234] = 'd';
    count = 0;
    expected = ['a','b','c','d'];
    arr.forEach(function(el, i, arr){
      arr.push(3)
      equal(el, expected[count], 'Array#forEach | elements should be as expected');
      equal(typeof i, 'number', 'Array#forEach | i must be a number');
      count++;
    }, 'wasabi');

    equal(count, 4, 'Array#forEach | will not visit elements that were added since beginning the loop or visit missing elements');

    arr = ['a'];
    arr[-3] = 'b';


    // This will lock browsers, including native implementations. Sparse array
    // optimizations are NOT in the ECMA spec, it would seem.
    // arr[4294967294] = 'c';


    arr[256] = 'd';
    count = 0;
    arr.forEach(function(el, i){
      count++;
    });

    equal(count, 2, 'Array#forEach | will only visit elements with valid indexes');
    equal(arr.length, 257, 'Array#forEach | "numerically greater than the name of every property whose name is an array index"');

    arr.length = 50;
    arr.forEach(function() {
      count++;
    });
    equal(arr[4294967294], undefined, 'Array#forEach | setting the length property will delete all elements above that index');

    arr = ['a','b','c'];
    expected = ['a','x'];
    count = 0;
    arr.forEach(function(el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(el, expected[count], 'Array#forEach | elements should be as expected');
      count++;
    });
    equal(count, 2, 'Array#forEach | elements deleted after the loop begins should not be visited');

    arr = [];
    expected = ['moo'];
    count = 0;
    arr[2] = 'two';
    arr['2'] = 'moo';
    arr.forEach(function(el, i){
      equal(el, expected[count], 'Array#forEach | strings and numbers are both the same for accessing array elements');
      count++;
    });

    equal(count, 1, 'Array#forEach | setting array elements with a string is the same as with a number');


    arr = [];
    arr[2] = 'c';
    arr[1] = 'b';
    arr[0] = 'a';

    result = [];
    arr.forEach(function(el) {
      result.push(el);
    });
    equal(result, ['a','b','c'], 'Array#forEach | walks array in order');



    count = 0;
    [1,2,3].forEach(function(el) {
      count++;
      return false;
    });
    equal(count, 3, 'Array#forEach | returning false will not break the loop');


    count = 0;
    arr = [1,2];
    arr.push(undefined);
    arr.push(3);
    arr.forEach(function(el) {
      count++;
      return false;
    });
    equal(count, 4, 'Array#forEach | undefined members are counted');


    // array.js

    arr = [2, 5, 9];
    arr.forEach(function(el, i, a) {
      equal(el, a[i], 'Array#forEach | looping successfully');
    });

    var arr = ['a', [1], { foo: 'bar' }, 352];
    count = 0;
    arr.forEach(function(el, i, a) {
        count++;
    });
    equal(count, 4, 'Array#forEach | complex array | should have looped 4 times');

    ['a'].forEach(function(el, i, a) {
      equal(el, 'a', 'Array#forEach | first parameter is the element');
      equal(i, 0, 'Array#forEach | second parameter is the index');
      equal(this.toString(), 'this', 'Array#forEach | scope is passed properly');
    }, 'this');

  });


  method('indexOf', function() {
    var arr, fn, reg, obj;

    arr = [1,2,3];
    arr[-2] = 4; // Throw a wrench in the gears by assigning a non-valid array index as object property.

    equal(arr.indexOf(1), 0, 'Array#indexOf | finds 1');
    equal(arr.indexOf(1) === 0, true, 'Array#indexOf | finds 1 and is result strictly equal');
    equal(arr.indexOf(4), -1, 'Array#indexOf | does not find 4');
    equal(arr.indexOf('1'), -1, 'Array#indexOf | Uses strict equality');
    equal(arr.indexOf(2, 1), 1, 'Array#indexOf | from index 1');
    equal(arr.indexOf(2, 2), -1, 'Array#indexOf | from index 2');
    equal(arr.indexOf(2, 3), -1, 'Array#indexOf | from index 3');
    equal(arr.indexOf(2, 4), -1, 'Array#indexOf | from index 4');
    equal(arr.indexOf(3, -1), 2, 'Array#indexOf | from index -1');
    equal(arr.indexOf(3, -2), 2, 'Array#indexOf | from index -2');
    equal(arr.indexOf(3, -3), 2, 'Array#indexOf | from index -3');
    equal(arr.indexOf(3, -4), 2, 'Array#indexOf | from index -4');

    // These tests will by proxy be stress testing the toInteger internal private function.
    equal(arr.indexOf(1, NaN), 0, 'Array#indexOf | index NaN becomes 0');
    equal(arr.indexOf(1, true), -1, 'Array#indexOf | index true becomes 1');
    equal(arr.indexOf(1, false), 0, 'Array#indexOf | index false becomes 0');
    equal(arr.indexOf(1, 0.1), 0, 'Array#indexOf | index 0.1 becomes 0');
    equal(arr.indexOf(1, 1.1), -1, 'Array#indexOf | index 1.1 becomes 1');
    equal(arr.indexOf(3, -0.1), 2, 'Array#indexOf | index -0.1 becomes 0');
    equal(arr.indexOf(3, -1.1), 2, 'Array#indexOf | index -1.1 becomes -1');
    equal(arr.indexOf(1, 1.7), -1, 'Array#indexOf | index 1.7 becomes 1');
    equal(arr.indexOf(3, -1.7), 2, 'Array#indexOf | index -1.7 becomes -1');


    fn  = function(){};
    reg = /arf/;
    obj = { moo: 'cow' };

    equal([fn].indexOf(fn), 0, 'Array#indexOf | finds function references');
    equal([reg].indexOf(reg), 0, 'Array#indexOf | finds regex references');
    equal([obj].indexOf(obj), 0, 'Array#indexOf | finds object references');

    arr = [];
    arr[2] = 'c';
    arr[1] = 'c';
    arr[0] = 'c';

    equal(arr.indexOf('c'), 0, 'Array#indexOf | walks array in order');
    equal(Array.prototype.indexOf.call('moo', 'o'), 1, 'Array#indexOf | should work on strings as well');

    arr = [];
    arr[3] = 'a';

    equal(arr.indexOf('a'), 3, 'Array#indexOf | must work on sparse arrays as well');

    // Although Infinity appears to be allowable in the ECMA spec, both of these cases
    // would appear to kill all modern browsers.
    // equal(arr.indexOf(1, Infinity), -1, 'Array#indexOf | infinity is valid');  This locks the browser... should it??
    // equal(arr.indexOf(1, -Infinity), 0, 'Array#indexOf | -infinity is valid');


    // array.js

    equal(['a','b','c'].indexOf('b'), 1, 'Array#indexOf | b in a,b,c');
    equal(['a','b','c'].indexOf('b', 0), 1, 'Array#indexOf | b in a,b,c from 0');
    equal(['a','b','c'].indexOf('a'), 0, 'Array#indexOf | a in a,b,c');
    equal(['a','b','c'].indexOf('f'), -1, 'Array#indexOf | f in a,b,c');

    equal(['a','b','c','b'].indexOf('b'), 1, 'Array#indexOf | finds first instance');
    equal(['a','b','c','b'].indexOf('b', 2), 3, 'Array#indexOf | finds first instance from index');

    equal([5,2,4].indexOf(5), 0, 'Array#indexOf | 5 in 5,2,4');
    equal([5,2,4].indexOf(2), 1, 'Array#indexOf | 2 in 5,2,4');
    equal([5,2,4].indexOf(4), 2, 'Array#indexOf | 4 in 5,2,4');
    equal([5,2,4,4].indexOf(4, 3), 3, 'Array#indexOf | 4 in 5,2,4,4 from index 3');

    equal([5,2,4,4].indexOf(4, 10), -1, 'Array#indexOf | 4 in 5,2,4,4 from index 10');
    equal([5,2,4,4].indexOf(4, -10), 2, 'Array#indexOf | 4 in 5,2,4,4 from index -10');
    equal([5,2,4,4].indexOf(4, -1), 3, 'Array#indexOf | 4 in 5,2,4,4 from index -1');

    equal([{ foo: 'bar' }].indexOf({ foo: 'bar' }), -1, 'Array#indexOf | will not find deep objects (use findIndex)');
    equal([{ foo: 'bar' }].indexOf(function(a) { return a.foo === 'bar'; }), -1, 'Array#indexOf | will not run against a function (use findIndex)');

  });


  method('lastIndexOf', function() {
    var arr, fn, reg, obj;

    arr = ['a', 1, 'a'];
    arr[-2] = 'a'; // Throw a wrench in the gears by assigning a non-valid array index as object property.

    equal(arr.lastIndexOf('a'), 2, 'Array#lastIndexOf | finds a');
    equal(arr.lastIndexOf('a') === 2, true, 'Array#lastIndexOf | finds a and is result strictly equal');
    equal(arr.lastIndexOf('c'), -1, 'Array#lastIndexOf | does not find c');
    equal(arr.lastIndexOf('1'), -1, 'Array#lastIndexOf | Uses strict equality');
    equal(arr.lastIndexOf('a', 1), 0, 'Array#lastIndexOf | from index 1');
    equal(arr.lastIndexOf('a', 2), 2, 'Array#lastIndexOf | from index 2');
    equal(arr.lastIndexOf('a', 3), 2, 'Array#lastIndexOf | from index 3');
    equal(arr.lastIndexOf('a', 4), 2, 'Array#lastIndexOf | from index 4');
    equal(arr.lastIndexOf('a', 0), 0, 'Array#lastIndexOf | from index 0');
    equal(arr.lastIndexOf('a', -1), 2, 'Array#lastIndexOf | from index -1');
    equal(arr.lastIndexOf('a', -2), 0, 'Array#lastIndexOf | from index -2');
    equal(arr.lastIndexOf('a', -3), 0, 'Array#lastIndexOf | from index -3');
    equal(arr.lastIndexOf('a', -4), -1, 'Array#lastIndexOf | from index -4');

    fn  = function(){};
    reg = /arf/;
    obj = { moo: 'cow' };

    equal([fn].lastIndexOf(fn), 0, 'Array#lastIndexOf | finds function references');
    equal([reg].lastIndexOf(reg), 0, 'Array#lastIndexOf | finds regex references');
    equal([obj].lastIndexOf(obj), 0, 'Array#lastIndexOf | finds object references');

    arr = [];
    arr[2] = 'c';
    arr[1] = 'c';
    arr[0] = 'c';

    equal(arr.lastIndexOf('c'), 2, 'Array#lastIndexOf | walks array in order');
    equal(Array.prototype.lastIndexOf.call('moo', 'o'), 2, 'Array#lastIndexOf | should work on strings as well');

    arr = ['c'];
    arr[3] = 'a';

    equal(arr.lastIndexOf('c'), 0, 'Array#lastIndexOf | must work on sparse arrays as well');

    // array.js

    equal(['a','b','c','d','a','b'].lastIndexOf('b'), 5, 'Array#lastIndexOf | b');
    equal(['a','b','c','d','a','b'].lastIndexOf('b', 4), 1, 'Array#lastIndexOf | b from index 4');
    equal(['a','b','c','d','a','b'].lastIndexOf('z'), -1, 'Array#lastIndexOf | z');

    equal([1,5,6,8,8,2,5,3].lastIndexOf(3), 7, 'Array#lastIndexOf | 1,5,6,8,8,2,5,3 | 3');
    equal([1,5,6,8,8,2,5,3].lastIndexOf(3, 0), -1, 'Array#lastIndexOf | 1,5,6,8,8,2,5,3 | 3 from index 0');
    equal([1,5,6,8,8,2,5,3].lastIndexOf(8), 4, 'Array#lastIndexOf | 1,5,6,8,8,2,5,3 | 8');
    equal([1,5,6,8,8,2,5,3].lastIndexOf(8, 3), 3, 'Array#lastIndexOf | 1,5,6,8,8,2,5,3 | 8 from index 3');
    equal([1,5,6,8,8,2,5,3].lastIndexOf(1), 0, 'Array#lastIndexOf | 1,5,6,8,8,2,5,3 | 1');
    equal([1,5,6,8,8,2,5,3].lastIndexOf(42), -1, 'Array#lastIndexOf | 1,5,6,8,8,2,5,3 | 42');

    equal([2,5,9,2].lastIndexOf(2), 3, 'Array#lastIndexOf | 2,5,9,2 | 2');
    equal([2,5,9,2].lastIndexOf(7), -1, 'Array#lastIndexOf | 2,5,9,2 | 7');
    equal([2,5,9,2].lastIndexOf(2, 3), 3, 'Array#lastIndexOf | 2,5,9,2 | 2 from index 3');
    equal([2,5,9,2].lastIndexOf(2, 2), 0, 'Array#lastIndexOf | 2,5,9,2 | 2 from index 2');
    equal([2,5,9,2].lastIndexOf(2, -2), 0, 'Array#lastIndexOf | 2,5,9,2 | 2 from index -2');
    equal([2,5,9,2].lastIndexOf(2, -1), 3, 'Array#lastIndexOf | 2,5,9,2 | 2 from index -1');
    equal([2,5,9,2].lastIndexOf(2, -10), -1, 'Array#lastIndexOf | 2,5,9,2 | 2 from index -10');

    equal([2,5,9,2].lastIndexOf(2, 10), 3, 'Array#lastIndexOf | 2,5,9,2 | 2 from index 10');
    equal([{ foo: 'bar' }].lastIndexOf({ foo: 'bar' }), -1, 'Array#lastIndexOf | will not find deep objects (use findIndex)');
    equal([{ foo: 'bar' }].lastIndexOf(function(a) { return a.foo === 'bar'; }), -1, 'Array#lastIndexOf | will not run against a function (use findIndex)');

  });


  method('every', function() {
    var arr, count, expected, result;

    arr = [];
    raisesError(function(){ [].every(); }, 'Array#every | should raise an error when no first param');
    result = arr.every(function(){
      equal(this, nullScope, 'Array#every | scope should be undefined when not passed');
    });
    [1].every(function(){
      equal(this.toString(), 'wasabi', 'Array#every | scope can be passed');
    }, 'wasabi');
    [1].every(function(){
      equal(this.toString(), '', 'Array#every | scope can be falsy');
    }, '');
    equal([].every(function(){ return true; }), true, 'Array#every | empty arrays will always be true');
    equal([].every(function(){ return false; }), true, 'Array#every | empty arrays will always be true even when false returned');
    equal([1].every(function(){ return 1; }), true, 'Array#every | 1 coerced to true');
    equal([1].every(function(){ return 0; }), false, 'Array#every | 0 coerced to false');
    equal([1].every(function(){ return 'blah'; }), true, 'Array#every | non-null string coerced to true');
    equal([1].every(function(){ return ''; }), false, 'Array#every | blank string coerced to false');

    arr = ['c','c','c'];
    count = 0;
    result = arr.every(function(el, i, a){
      equal(el, 'c', 'Array#every | first argument is element');
      equal(i, count, 'Array#every | second argument is index');
      equal(a, arr, 'Array#every | third argument is the array');
      count++;
      return el == 'c';
    });
    equal(result, true, 'Array#every | all are c');
    equal(count, 3, 'Array#every | should have been called 3 times');


    arr = ['a','b','c'];
    count = 0;
    result = arr.every(function(el){
      count++;
      return el == 'c';
    });
    equal(result, false, 'Array#every | not all are c');
    equal(count, 1, 'Array#every | should stop once it can return false');


    arr = [];
    arr[247] = 'a';
    count = 0;
    result = arr.every(function(el){
      count++;
      return el == 'a';
    });
    equal(result, true, 'Array#every | sparse arrays should not count missing elements');
    equal(count, 1, 'Array#every | sparse arrays should have called once only');


    arr = ['a','b','c'];
    expected = ['a','x'];
    count = 0;
    arr.every(function(el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(el, expected[count], 'Array#every | elements should be as expected');
      count++;
      return true;
    });
    equal(count, 2, 'Array#every | elements deleted after the loop begins should not be visited');

  });

  method('some', function() {
    var arr, count, expected, result;

    arr = [];
    raisesError(function(){ [].some(); }, 'Array#some | should raise an error when no first param');
    result = arr.some(function(){
      equal(this, nullScope, 'Array#some | scope should be undefined when not passed');
    });
    [1].some(function(){
      equal(this.toString(), 'wasabi', 'Array#some | scope can be passed');
    }, 'wasabi');
    [1].some(function(){
      equal(this.toString(), '', 'Array#some | scope can be falsy');
    }, '');
    equal([].some(function(){ return true; }), false, 'Array#some | empty arrays will always be false');
    equal([].some(function(){ return false; }), false, 'Array#some | empty arrays will always be false even when false returned');
    equal([1].some(function(){ return 1; }), true, 'Array#some | 1 coerced to true');
    equal([1].some(function(){ return 0; }), false, 'Array#some | 0 coerced to false');
    equal([1].some(function(){ return 'blah'; }), true, 'Array#some | non-null string coerced to true');
    equal([1].some(function(){ return ''; }), false, 'Array#some | blank string coerced to false');

    arr = ['c','c','c'];
    count = 0;
    result = arr.some(function(el, i, a){
      equal(el, 'c', 'Array#some | first argument is element');
      equal(i, count, 'Array#some | second argument is index');
      equal(a, arr, 'Array#some | third argument is the array');
      count++;
      return el == 'c';
    });
    equal(result, true, 'Array#some | some are c');
    equal(count, 1, 'Array#some | should stop as soon as it finds an element');


    arr = ['a','b','c'];
    count = 0;
    result = arr.some(function(el){
      count++;
      return el == 'd';
    });
    equal(result, false, 'Array#some | none are d');
    equal(count, 3, 'Array#some | should have been called 3 times');


    arr = [];
    arr[247] = 'a';
    count = 0;
    result = arr.some(function(el){
      count++;
      return el == 'a';
    });

    equal(result, true, 'Array#some | sparse arrays should not count missing elements');
    equal(count, 1, 'Array#some | sparse arrays should have called once only');


    arr = ['a','b','c'];
    expected = ['a','x'];
    count = 0;
    arr.some(function(el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(el, expected[count], 'Array#some | elements should be as expected');
      count++;
      return false;
    });
    equal(count, 2, 'Array#some | elements deleted after the loop begins should not be visited');

  });


  method('map', function() {
    var arr, count, expected, result;

    arr = [];
    raisesError(function(){ [].map(); }, 'Array#map | should raise an error when no first param');
    result = arr.map(function(){
      equal(this, nullScope, 'Array#map | scope should be undefined when not passed');
    });
    [1].map(function(){
      equal(this.toString(), 'wasabi', 'Array#map | scope can be passed');
    }, 'wasabi');
    [1].map(function(){
      equal(this.toString(), '', 'Array#map | scope can be falsy');
    }, '');
    [1].map(function(){
      equal(Number(this), 0, 'Array#map | scope can be a number');
    }, 0);

    arr = ['c','c','c'];
    count = 0;
    result = arr.map(function(el, i, a){
      equal(el, 'c', 'Array#map | first argument is element');
      equal(i, count, 'Array#map | second argument is index');
      equal(a, arr, 'Array#map | third argument is the array');
      count++;
      return 'a';
    });
    equal(result, ['a','a','a'], 'Array#map | mapped to a');
    equal(count, 3, 'Array#map | should have run 3 times');


    arr = [1,2,3];
    count = 0;
    result = arr.map(function(el){
      return Math.pow(el, 2);
    });
    equal(result, [1,4,9], 'Array#map | n^2');


    arr = [];
    arr[247] = 'a';
    count = 0;
    result = arr.map(function(el){
      count++;
      return 'c';
    });
    equal(result.length, 248, 'Array#map | resulting array should also be sparse if source was');
    equal(count, 1, 'Array#map | callback should only have been called once');


    arr = ['a','b','c'];
    expected = ['a','x'];
    count = 0;
    arr.map(function(el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(el, expected[count], 'Array#map | elements should be as expected');
      count++;
    });
    equal(count, 2, 'Array#map | elements deleted after the loop begins should not be visited');
  });


  method('filter', function() {
    var arr, count, expected, result;

    arr = [];
    raisesError(function(){ [].filter(); }, 'Array#filter | should raise an error when no first param');
    result = arr.filter(function(){
      equal(this, nullScope, 'Array#filter | scope should be undefined when not passed');
    });
    [1].filter(function(){
      equal(this.toString(), 'wasabi', 'Array#filter | scope can be passed');
    }, 'wasabi');
    [1].filter(function(){
      equal(this.toString(), '', 'Array#filter | scope can be falsy');
    }, '');
    equal([].filter(function(){ return true; }), [], 'Array#filter | empty arrays will always be []');
    equal([].filter(function(){ return false; }), [], 'Array#filter | empty arrays will always be [] even when false returned');
    equal([1].filter(function(){ return 1; }), [1], 'Array#filter | 1 coerced to true');
    equal([1].filter(function(){ return 0; }), [], 'Array#filter | 0 coerced to false');
    equal([1].filter(function(){ return 'blah'; }), [1], 'Array#filter | non-null string coerced to true');
    equal([1].filter(function(){ return ''; }), [], 'Array#filter | blank string coerced to false');

    arr = ['c','c','c'];
    count = 0;
    result = arr.filter(function(el, i, a){
      equal(el, 'c', 'Array#filter | first argument is element');
      equal(i, count, 'Array#filter | second argument is index');
      equal(a, arr, 'Array#filter | third argument is the array');
      count++;
      return el == 'c';
    });
    equal(result, ['c','c','c'], 'Array#filter | filter are c');
    equal(count, 3, 'Array#filter | should have executed 3 times');


    arr = ['a','b','c'];
    count = 0;
    result = arr.filter(function(el){
      count++;
      return el == 'b';
    });
    equal(result, ['b'], 'Array#filter | returns [b]');
    equal(count, 3, 'Array#filter | should have been called 3 times');


    arr = [];
    arr[247] = 'a';
    count = 0;
    result = arr.filter(function(el){
      count++;
      return true;
    });
    equal(result, ['a'], 'Array#filter | sparse arrays should not count missing elements');
    equal(count, 1, 'Array#filter | sparse arrays should have called once only');


    arr = ['a','b','c'];
    expected = ['a','x'];
    count = 0;
    result = arr.filter(function(el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(el, expected[count], 'Array#filter | elements should be as expected');
      count++;
      return true;
    });
    equal(result, ['a','x'], 'Array#filter | modified array should appear as the result');
    equal(count, 2, 'Array#filter | elements deleted after the loop begins should not be visited');
  });

  method('reduce', function() {
    var arr, count, result, previous, current;

    arr = [];
    raisesError(function(){ [1].reduce(); }, 'Array#reduce | should raise an error when no callback provided');
    raisesError(function(){ [].reduce(function(){}); }, 'Array#reduce | should raise an error on an empty array with no initial value');
    [1].reduce(function(){
      equal(this, nullScope, 'Array#reduce | scope should be undefined');
    }, 1);


    arr = [1,2,3];
    previous = [1,3];
    current = [2,3];
    count = 0;

    result = arr.reduce(function(prev, el, i, o){
      equal(prev, previous[count], 'Array#reduce | first argument is the prev value');
      equal(el, current[count], 'Array#reduce | second argument is element');
      equal(i, count + 1, 'Array#reduce | third argument is index');
      equal(o, arr, 'Array#reduce | fourth argument is the array');
      count++;
      return prev + el;
    });

    equal(result, 6, 'Array#reduce | result is correct');
    equal(count, 2, 'Array#reduce | should have been called 3 times');


    equal([1].reduce(function(){ return 324242; }), 1, 'Array#reduce | function is not called and returns 1');

    count = 0;
    [1].reduce(function(prev, current, i) {
      equal(prev, 5, 'Array#reduce | prev is equal to the inital value if it is provided');
      equal(current, 1, 'Array#reduce | current is equal to the first value in the array if no intial value provided');
      equal(i, 0, 'Array#reduce | i is 0 when an initial value is passed');
      count++;
    }, 5);
    equal(count, 1, 'Array#reduce | should have been called once');

    arr = ['a','b','c'];
    previous = ['a','ab'];
    current  = ['b','c'];
    count = 0;
    result = arr.reduce(function(prev, el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(prev, previous[count], 'Array#reduce | previous should be as expected');
      equal(el, current[count], 'Array#reduce | current should be as expected');
      count++;
      return prev + el;
    });
    equal(count, 2, 'Array#reduce | elements deleted after the loop begins should not be visited');

    equal([1,2,3].reduce(function(a, n){ return a + n; }, 0), 6, 'Array#reduce | can handle initial value of 0');


    // array.js

    equal([0,1,2,3,4].reduce(function(a,b) { return a + b; }), 10, 'Array#reduce | a + b');
    equal([[0,1],[2,3],[4,5]].reduce(function(a,b) { return a.concat(b); }, []), [0,1,2,3,4,5], 'Array#reduce | concat');
    ['a'].reduce(function(p, c, i, a) {
      equal(p, 'c', 'Array#reduce | a | first parameter is the lhs');
      equal(c, 'a', 'Array#reduce | a | second parameter is the rhs');
      equal(i, 0, 'Array#reduce | a | third parameter is the index');
      equal(a, ['a'], 'Array#reduce | a | fourth parameter is the array');
    }, 'c');
    [55,66].reduce(function(p, c, i, a) {
      equal(p, 55, 'Array#reduce | 55,66 | first parameter is the lhs');
      equal(c, 66, 'Array#reduce | 55,66 | second parameter is the rhs');
      equal(i, 1, 'Array#reduce | 55,66 | third parameter is the index');
      equal(a, [55,66], 'Array#reduce | 55,66 | fourth parameter is the array');
    });
    [1].reduce(function(p, c, i, a) {
      // This assertion should never be called.
      equal(true, false, 'Array#reduce | one element array with no rhs passed in does not iterate');
    });
    equal([1].reduce(function() {}), 1, 'Array#reduce | [1] reduces to 1');

  });


  method('reduceRight', function() {
    var arr, count, result, previous, current;

    arr = [];
    raisesError(function(){ [1].reduceRight(); }, 'Array#reduceRight | should raise an error when no callback provided');
    raisesError(function(){ [].reduceRight(function(){}); }, 'Array#reduceRight | should raise an error on an empty array with no initial value');
    [1].reduceRight(function(){
      equal(this, nullScope, 'Array#reduceRight | scope should be undefined');
    }, 1);


    arr = [1,2,3];
    previous = [3,5];
    current = [2,1];
    count = 0;

    result = arr.reduceRight(function(prev, el, i, o){
      equal(prev, previous[count], 'Array#reduceRight | first argument is the prev value');
      equal(el, current[count], 'Array#reduceRight | second argument is element');
      equal(i, 1 - count, 'Array#reduceRight | third argument is index');
      equal(o, arr, 'Array#reduceRight | fourth argument is the array');
      count++;
      return prev + el;
    });

    equal(result, 6, 'Array#reduceRight | result is correct');
    equal(count, 2, 'Array#reduceRight | should have been called 3 times');


    equal([1].reduceRight(function(){ return 324242; }), 1, 'Array#reduceRight | function is not called and returns 1');

    count = 0;
    [1].reduceRight(function(prev, current, i) {
      equal(prev, 5, 'Array#reduceRight | prev is equal to the inital value if it is provided');
      equal(current, 1, 'Array#reduceRight | current is equal to the first value in the array if no intial value provided');
      equal(i, 0, 'Array#reduceRight | i is 0 when an initial value is passed');
      count++;
    }, 5);
    equal(count, 1, 'Array#reduceRight | should have been called once');

    arr = ['a','b','c'];
    previous = ['c','cb'];
    current  = ['b','a'];
    count = 0;
    result = arr.reduceRight(function(prev, el, i){
      if(i == 0) {
        arr[1] = 'x';
        delete arr[2];
      }
      equal(prev, previous[count], 'Array#reduceRight | previous should be as expected');
      equal(el, current[count], 'Array#reduceRight | current should be as expected');
      count++;
      return prev + el;
    });
    equal(count, 2, 'Array#reduceRight | elements deleted after the loop begins should not be visited');

    equal([1,2,3].reduceRight(function(a, n){ return a + n; }, 0), 6, 'Array#reduceRight | can handle initial value of 0');


    // array.js

    equal([0,1,2,3,4].reduceRight(function(a,b) { return a + b; }), 10, 'Array#reduceRight | a + b');
    equal([[0,1],[2,3],[4,5]].reduceRight(function(a,b) { return a.concat(b); }, []), [4,5,2,3,0,1], 'Array#reduceRight | concat');
    ['a'].reduceRight(function(p, c, i, a) {
      equal(p, 'c', 'Array#reduceRight | a | first parameter is the lhs');
      equal(c, 'a', 'Array#reduceRight | a | second parameter is the rhs');
      equal(i, 0, 'Array#reduceRight | a | third parameter is the index');
      equal(a, ['a'], 'Array#reduceRight | a | fourth parameter is the array');
    }, 'c');
    [55,66].reduceRight(function(p, c, i, a) {
      equal(p, 66, 'Array#reduceRight | 55,66 | first parameter is the lhs');
      equal(c, 55, 'Array#reduceRight | 55,66 | second parameter is the rhs');
      equal(i, 0, 'Array#reduceRight | 55,66 | third parameter is the index');
      equal(a, [55,66], 'Array#reduceRight | 55,66 | fourth parameter is the array');
    });
    [1].reduceRight(function(p, c, i, a) {
      // This assertion should never be called.
      equal(true, false, 'Array#reduceRight | one element array with no rhs passed in does not iterate');
    });
    equal([1].reduceRight(function() {}), 1, 'Array#reduceRight | [1] reduces to 1');

  });


  group('inheritance', function() {
    var count;

    var Soup = function(){};
    Soup.prototype = [1,2,3];

    var x = new Soup();

    count = 0;
    x.every(function() {
      count++;
      return true;
    });
    x.some(function() {
      count++;
    });
    x.map(function() {
      count++;
    });
    x.filter(function() {
      count++;
    });
    x.forEach(function() {
      count++;
    });
    x.reduce(function() {
      count++;
    });
    x.reduceRight(function() {
      count++;
    });

    equal(count, 19, 'Array | array elements in the prototype chain are also properly iterated');
    equal(x.indexOf(2), 1, 'Array | indexOf | array elements in the prototype chain are also properly iterated');
    equal(x.lastIndexOf(2), 1, 'Array | lastIndexOf | array elements in the prototype chain are also properly iterated');
  });


  group('trim', function() {
    var whiteSpace = '\u0009\u000B\u000C\u0020\u00A0\uFEFF\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000';
    var lineTerminators = '\u000A\u000D\u2028\u2029';

    equal(whiteSpace.trim(), '', 'String#trim | should trim all WhiteSpace characters defined in 7.2 and Unicode "space, separator and Unicode "space, separator""');
    equal(lineTerminators.trim(), '', 'String#trim | should trim all LineTerminator characters defined in 7.3');


    equal('   wasabi   '.trim(), 'wasabi', 'String#trim | should trim both left and right whitespace');
    equal(''.trim(), '', 'String#trim | blank');
    equal(' wasabi '.trim(), 'wasabi', 'String#trim | wasabi with whitespace');


    equal(String.prototype.trim.call([1]), '1', 'String#trim | should handle objects as well');

  });


  group('keys', function() {
    var Person;

    raisesError(function(){ Object.keys(undefined); }, 'raises a TypeError for undefined');
    raisesError(function(){ Object.keys(null); }, 'raises a TypeError for null');

    // ES5 states that a TypeError must be thrown when non-objects are
    // passed to Object.keys. However, ES6 revises this and performs
    // a coercion instead. The Sugar polyfills follow the ES5 spec for now,
    // however some browsers have already started to implement ES6 behavior,
    // so this is not consistent at the moment, so comment these tests out.

    // raisesError(function(){ Object.keys(true); }, 'raises a TypeError for boolean');
    // raisesError(function(){ Object.keys(3); }, 'raises a TypeError for number');
    // raisesError(function(){ Object.keys(NaN); }, 'raises a TypeError for NaN');
    // raisesError(function(){ Object.keys('wasabi'); }, 'raises a TypeError for string');

    equal(Object.keys({ moo:'bar', broken:'wear' }), ['moo','broken'], 'returns keys of an object');
    equal(Object.keys(['a','b','c']), ['0','1','2'], 'returns indexes of an array');
    equal(Object.keys(/foobar/), [], 'regexes return a blank array');
    equal(Object.keys(function(){}), [], 'functions return a blank array');
    equal(Object.keys(new Date), [], 'dates return a blank array');

    Person = function() {
      this.broken = 'wear';
    };
    Person.prototype = { cat: 'dog' };

    equal(Object.keys(new Person), ['broken'], 'Object#keys | will get instance properties but not inherited properties');
  });


  group('now', function() {
    equalWithMargin(Date.now(), new Date().getTime(), 5, 'Date#now | basic functionality');
  });

  group('parse', function() {

    // Returns 807937200000 in time zone GMT-0300, and other values in other
    // timezones, since the argument does not specify a time zone.
    equal(Date.parse("Aug 9, 1995"), new Date(1995, 7, 9).getTime(), 'Date#parse | No timezone');
    // Returns 807926400000 no matter the local time zone.
    equal(Date.parse("Wed, 09 Aug 1995 00:00:00 GMT"), new Date(807926400000).getTime(), 'Date#parse | GMT');
    // Returns 807937200000 in timezone GMT-0300, and other values in other
    // timezones, since there is no time zone specifier in the argument.
    equal(Date.parse("Wed, 09 Aug 1995 00:00:00"), new Date(1995, 7, 9).getTime(), 'Date#parse | No timezone with time');
    equal(Date.parse("Thu, 09 Aug 1995 00:00:00 GMT-0400"), 807940800000, 'Date#parse | 1995/7/9 GMT-04:00');
    // Returns 0 no matter the local time zone.
    equal(Date.parse("Thu, 01 Jan 1970 00:00:00 GMT"), 0, 'Date#parse | 1970/1/1 GMT');

    // Note: Avoiding non GMT dates around the epoch as they tend to be unreliable.
    // Returns 14400000 in timezone GMT-0400, and other values in other
    // timezones, since there is no time zone specifier in the argument.
    // equal(Date.parse("Thu, 01 Jan 1970 00:00:00"), (new Date).getTimezoneOffset().minutes(), 'Date#parse | 1970/1/1 Local');
    // Returns 14400000 no matter the local time zone.
    // equal(Date.parse("Thu, 01 Jan 1970 00:00:00 GMT-0400"), new Date(1995, 7, 9).getTime(), 'Date#parse | 1970/1/1 GMT-04:00');

  });

  group('toISOString', function() {
    equal(new Date(Date.UTC(2000, 0, 1)).toISOString(), '2000-01-01T00:00:00.000Z', 'Date#toISOString | new millenium!');
    equal(new Date(Date.UTC(1978, 7, 25)).toISOString(), '1978-08-25T00:00:00.000Z', 'Date#toISOString | happy birthday!');
    equal(new Date(Date.UTC(1978, 7, 25, 11, 45, 33, 456)).toISOString(), '1978-08-25T11:45:33.456Z', 'Date#toISOString | with time');
  });


  group('toJSON', function() {
    equal(new Date(2002, 7, 25).toJSON(), new Date(2002, 7, 25).toISOString(), 'Date#toJSON | output');
  });

  group('bind', function() {
    var instance, BoundPerson, Person;

    raisesError(function(){ Function.prototype.bind.call('mooo'); }, 'Function#bind | Raises an error when used on anything un-callable');
    raisesError(function(){ Function.prototype.bind.call(/mooo/); }, 'Function#bind | Regexes are functions in chrome');

    equal((function(){ return this; }).bind('yellow')().toString(), 'yellow', 'Function#bind | basic binding of this arg');
    equal((function(){ return arguments[0]; }).bind('yellow', 'mellow')(), 'mellow', 'Function#bind | currying argument 1');
    equal((function(){ return arguments[1]; }).bind('yellow', 'mellow', 'fellow')(), 'fellow', 'Function#bind | currying argument 2');
    equal((function(){ return this; }).bind(undefined)(), nullScope, 'Function#bind | passing undefined as the scope');

    (function(a, b){
      equal(this.toString(), 'yellow', 'Function#bind | ensure only one call | this object');
      equal(a, 'mellow', 'Function#bind | ensure only one call | argument 1');
      equal(b, 'fellow', 'Function#bind | ensure only one call | argument 2');
    }).bind('yellow', 'mellow', 'fellow')();

    // It seems this functionality can't be achieved in a JS polyfill...
    // equal((function(){}).bind().prototype, undefined, 'Function#bind | currying argument 2'); 

    Person = function(a, b) {
      this.first = a;
      this.second = b;
    };

    BoundPerson = Person.bind({ mellow: 'yellow' }, 'jump');
    instance = new BoundPerson('jumpy');

    equal(instance.mellow, undefined, 'Function#bind | passed scope is ignored when used with the new keyword');
    equal(instance.first, 'jump', 'Function#bind | curried argument makes it to the constructor');
    equal(instance.second, 'jumpy', 'Function#bind | argument passed to the constructor makes it in as the second arg');
    equal(instance instanceof Person, true, 'Function#bind | instance of the class');

    equal(instance instanceof BoundPerson, true, 'Function#bind | instance of the bound class');

    // Note that this spec appears to be wrong in the MDN docs:
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
    // Changing this test to assert true as native implementations all function this way.
    equal(new Person() instanceof BoundPerson, true, 'Function#bind | instance of unbound class is not an instance of the bound class');

    // Binding functions without a prototype should not explode.
    Object.prototype.toString.bind('hooha')();


    // function.js

    var bound, obj, result;

    obj = { foo: 'bar' };

    bound = (function(num, bool, str, fourth, fifth) {
      equal(this === obj, true, 'Function#bind | Bound object is strictly equal');
      equal(num, 1, 'Function#bind | first parameter');
      equal(bool, true, 'Function#bind | second parameter');
      equal(str, 'wasabi', 'Function#bind | third parameter');
      equal(fourth, 'fourth', 'Function#bind | fourth parameter');
      equal(fifth, 'fifth', 'Function#bind | fifth parameter');
      return 'howdy';
    }).bind(obj, 1, true, 'wasabi');

    result = bound('fourth','fifth');
    equal(result, 'howdy', 'Function#bind | result is correctly returned');

    (function(first) {
      equal(Array.prototype.slice.call(arguments), [], 'Function#bind | arguments array is empty');
      equal(first, undefined, 'Function#bind | first argument is undefined');
    }).bind('foo')();

  });

  group('overwrite', function() {

    // Ensure that all prototype methods affected by Sugar are still overwriteable.

    var storedEach = Array.prototype.each;
    var storedEachExisted = 'each' in Array.prototype;
    var a = [];
    a.each = 'OH PLEASE';
    equal(a.each, 'OH PLEASE', 'Sugar methods can ALL be overwritten!');
    if(!storedEachExisted) {
      delete Array.prototype.each;
    } else {
      Array.prototype.each = storedEach;
    }

  });

});

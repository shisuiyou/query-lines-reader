# query-lines-reader
Query multi lines by reading file. Support big file for nodejs

## Install

```
$ npm install query-lines-reader
```

```js

let queryLinesReader = new QueryLinesReader(filePath, options);

queryLinesReader.queryLines(options).then(lineRes => {});

queryLinesReader.getTotal().then(totalRes => {});

```


## Options

### filePath
1. File absolute path, example: <br>
path.resolve(__dirname, './test.txt')

2. Stream, the stream path is must be absolute, example: <br>
fs.createReadStream(path.resolve(__dirname, './test.txt'))

3. Buffer, example: <br>
Buffer.from(path.resolve(__dirname, './test.txt'))

4. URL, example: <br>
new URL('file:///tmp/hello')

### options
#### start && end:
* Type: Number<br>
* start: you need first line number (Default 0)<br>
* end: you need last line number (Default 10)<br>

the line include `start` exclude `end`.  [start, end) ！！！！

#### pageSize && currentPage
* Type: Number<br>
* pageSize: number of pages per page (Default 0)<br>
* currentPage: current page (Default 10)<br>

#### needTotal
* Type: Boolean<br>
* If true will return total lines or not<br>

#### reverse
* Type: Boolean, read direction<br>
* Tf false, from top to bottom<br>
* If true, from bottom to top<br>

#### include
* Type: String or RegExp, string or regular expression<br>
* You can use it to search file <br>

### lineRes
* lineList: lines result<br>
* total: if options.needTotal is true, this will return<br>

### totalRes
* Type: Number, file's total line<br>

## Example

```js
// From top to bottom
const path = require('path');
const QueryLinesReader = require('query-lines-reader');

let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './test.txt'));

queryLinesReader.queryLines({
    start: 0,
    end: 2
}).then(res => {
    res.lineList // ['xx', 'xxxx']
})

```

```js
// From bottom to top
const path = require('path');
const QueryLinesReader = require('query-lines-reader');

let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './test.txt'), {
    reverse: true,
    // include: /xxxx/g
});

queryLinesReader.queryLines({
    start: 0,
    end: 2,
    // reverse: true     // You can also set it here
    // include: /xxxx/g  // You can also set it here
}).then(res => {
    res.lineList // ['xxxx', 'xx']
})

```

```js
// Pagination
const path = require('path');
const QueryLinesReader = require('query-lines-reader');

let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './test.txt'), {
    pageSize: 10
});

queryLinesReader.queryLines({
    currentPage: 0
}).then(res => {
    res.lineList // ['xx', 'xxxx', ...]
});

```

## Others

```js 
QueryLinesReader.setProcessNumberOfSingleCpu(10);
```
* This api is global api, set process‘s maximum of one cpu. If the maximum number is exceeded, a another strategy of reader will be used
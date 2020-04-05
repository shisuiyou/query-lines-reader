# query-lines-reader
Query multi lines by reading file. Support big file for nodejs

## Install

```
$ npm install query-lines-reader
```


## Options

```
let queryLinesReader = new QueryLinesReader(filePath, options);
queryLinesReader.queryLines(options).then(res => {});

```
#### filePath
1. file absolute path, example : path.resolve(__dirname, './test.txt')

2. stream, the stream path is must be absolute, example : fs.createReadStream(path.resolve(__dirname, './test.txt'))

3. buffer, example: Buffer.from(path.resolve(__dirname, './test.txt'))

4. URL, example new URL('file:///tmp/hello')

#### options
##### start && end:
Type: Number<br>
start: you need first line number (Default 0)<br>
end: you need last line number (Default 10)<br>

the line include `start` exclude `end`.  [start, end) ！！！！

##### pageSize && currentPage
Type: Number<br>
pageSize: number of pages per page (Default 0)<br>
currentPage: current page (Default 10)<br>

#### needTotal
Type: Boolean<br>
true will return total lines or not<br>

#### reverse
Type: Boolean<br>
Read direction<br>
if false, from top to bottom<br>
if true, from bottom to top<br>

#### include
Type: String or RegExp<br>
string or regular expression<br>
you can neen it to search file <br>


## Example

```
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

```
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

```
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
# query-lines-reader
Query multi lines or pagination by reading file. Support big file for nodejs

[![npm](https://img.shields.io/npm/v/query-lines-reader?style=flat-square)](https://www.npmjs.com/package/query-lines-reader)

## Install

```
$ npm install query-lines-reader
```

## [中文文档](#Chinese)

## Usage

General usage
```js

let queryLinesReader = new QueryLinesReader(filePath, options);

queryLinesReader.queryLines(options).then(lineRes => {});

queryLinesReader.getTotal().then(totalRes => {});

```


You can use the api set a file size.<br>
The ‘fileSize‘ for different decisions to improve efficiency

We use ‘readline’ module to read the file when less than then the size<br>
We use system command to get file info when greater than the size<br>
default 1.5 * 1024 K
```js

let queryLinesReader = new QueryLinesReader(filePath, options);

queryLinesReader.setMinSizeOfCommand(fileSize)

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
* pageSize: number of pages per page (Default 10)<br>
* currentPage: current page (Default 0)<br>

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

// first page
queryLinesReader.queryLines({
    currentPage: 0
}).then(res => {
    res.lineList // ['xx', 'xxxx', ...]
});

// third page
queryLinesReader.queryLines({
    currentPage: 2
}).then(res => {
    res.lineList // ['xx', 'xxxx', ...]
});

```

## Others

This api is global api, set process‘s maximum of one cpu. If the maximum number is exceeded, a another strategy of reader will be used
```js 
QueryLinesReader.setProcessNumberOfSingleCpu(2);
```



<a id="Chinese"></a>
# query-lines-reader
高效分页、按行读取文件，支持大文件

## 安装

```
$ npm install query-lines-reader
```

## 使用

一般用法
```js

let queryLinesReader = new QueryLinesReader(filePath, options);

queryLinesReader.queryLines(options).then(lineRes => {});

queryLinesReader.getTotal().then(totalRes => {});

```


setMinSizeOfCommand 这个 API 是设置文件大小的一个值，用不同策略来提高效率

小于这个值的时候，我们用 ‘readline’ 这个模块来读取文件
大于这个值的时候，我们使用 系统内部命令 读取文件
默认是 1.5 * 1024 k
```js

let queryLinesReader = new QueryLinesReader(filePath, options);

queryLinesReader.setMinSizeOfCommand(fileSize)

```


## 参数

### filePath
1. 文件的绝对路径，例如: <br>
path.resolve(__dirname, './test.txt')

2. stream 流, 流的路径也必须是绝对路径, 例如: <br>
fs.createReadStream(path.resolve(__dirname, './test.txt'))

3. Buffer, 例如: <br>
Buffer.from(path.resolve(__dirname, './test.txt'))

4. URL, 例如: <br>
new URL('file:///tmp/hello')

### options
#### start && end:
* 类型: Number<br>
* start: 读取的第一行的行数 (Default 0)<br>
* end: 读取的最后一行 (Default 10)<br>

读取结果 包含 `start` 不包含 `end`.  [start, end) ！！！！

#### pageSize && currentPage
* 类型: Number<br>
* pageSize: 每页的数量 (Default 10)<br>
* currentPage: 当前页 (Default 0)<br>

#### needTotal
* 类型: Boolean<br>
* 如果你设置它为 true 会返回总数<br>

#### reverse
* 类型: Boolean, 文件读取方向<br>
* 如果是 false, 从上往下读<br>
* 如果是 true, 从下往上读<br>

#### include
* 类型: String or RegExp, 包含的字符串或者正则表达式<br>
* 可以使用这个值去搜索文件<br>

### lineRes
* lineList: 读取文件的结果<br>
* total: 如果 options.needTotal 是 true, 将会返回这个值<br>

### totalRes
* 类型: Number, 文件的总行数<br>

## 例子

```js
// 从上往下读
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
// 从下往上读
const path = require('path');
const QueryLinesReader = require('query-lines-reader');

let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './test.txt'), {
    reverse: true,
    // include: /xxxx/g
});

queryLinesReader.queryLines({
    start: 0,
    end: 2,
    // reverse: true     // 你也能在这里设置它
    // include: /xxxx/g  // 你也能在这里设置它
}).then(res => {
    res.lineList // ['xxxx', 'xx']
})

```

```js
// 分页
const path = require('path');
const QueryLinesReader = require('query-lines-reader');

let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './test.txt'), {
    pageSize: 10
});

// 第一页
queryLinesReader.queryLines({
    currentPage: 0
}).then(res => {
    res.lineList // ['xx', 'xxxx', ...]
});

// 第三页
queryLinesReader.queryLines({
    currentPage: 2
}).then(res => {
    res.lineList // ['xx', 'xxxx', ...]
});

```

## Others

这个是全局 api, 并发较大时一个 cpu 可以开两个子进程。当进程数都占满后 会通过 ‘readline’ 模块去读文件。
```js 
QueryLinesReader.setProcessNumberOfSingleCpu(2);
```

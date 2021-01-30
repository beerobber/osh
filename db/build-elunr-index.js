var elasticlunr = require('elasticlunr'),
    stdin = process.stdin,
    stdout = process.stdout,
    buffer = []

var oshStopWords = [
    "",
    "a",
    "and",
    "as",
    "at",
    "be",
    "but",
    "by",
    "can",
    "do",
    "for",
    "or",
    "so",
    "the",
    "to",
    "us"
];

// Manage stop words
elasticlunr.clearStopWords();
elasticlunr.addStopWords(oshStopWords);

// Name of the reference field
refField = process.argv[2];

// List of columns to be found in data stream
columnListStr = process.argv[3];
let columnList = columnListStr.split(':');

stdin.resume();
stdin.setEncoding('utf8');

// Read from stdin
stdin.on('data', function (data) {
    buffer.push(data);
})

// After input stream ends, generate index
stdin.on('end', function () {

    // Parse data stream into list of hymns
    var hymns = JSON.parse(buffer.join(''));

    // Create index
    var idx = elasticlunr(function () {

        // Set the reference field
        this.setRef(refField);

        // Prepare fields for all columns in data stream
        columnList.forEach(function (column, i) {
            this.addField(column)
        }, this)

        // Parse each hymn as an index document
        hymns.forEach(function (hymn) {
            this.addDoc(hymn)
        }, this)
    })

    // Serialize index
    stdout.write(JSON.stringify(idx))
})

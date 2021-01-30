var elasticlunr = require('elasticlunr'),
    stdin = process.stdin,
    stdout = process.stdout,
    buffer = []

var oshStopWords = [
    "",
    "a",
    // "able",
    // "about",
    // "across",
    // "after",
    "all",
    // "almost",
    // "also",
    "am",
    // "among",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    // "because",
    // "been",
    "but",
    "by",
    "can",
    // "cannot",
    "could",
    "dear",
    "did",
    "do",
    // "does",
    // "either",
    // "else",
    // "ever",
    // "every",
    "for",
    "from",
    "get",
    "got",
    "had",
    "has",
    "have",
    "he",
    "her",
    "hers",
    // "him",
    // "his",
    "how",
    // "however",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    // "just",
    // "least",
    // "let",
    // "like",
    // "likely",
    // "may",
    "me",
    // "might",
    // "most",
    // "must",
    "my",
    // "neither",
    "no",
    "nor",
    "not",
    "of",
    "off",
    // "often",
    "on",
    "only",
    "or",
    // "other",
    "our",
    "own",
    // "rather",
    "said",
    "say",
    "says",
    "she",
    // "should",
    // "since",
    "so",
    "some",
    "than",
    "that",
    "the",
    // "their",
    "them",
    // "then",
    // "there",
    // "these",
    // "they",
    // "this",
    // "tis",
    "to",
    "too",
    // "twas",
    "us",
    "wants",
    "was",
    "we",
    "were",
    // "what",
    // "when",
    // "where",
    // "which",
    // "while",
    "who",
    "whom",
    // "why",
    // "will",
    // "with",
    // "would",
    "yet",
    "you",
    "your"
];

// Manage stop words
elasticlunr.clearStopWords();
elasticlunr.addStopWords(oshStopWords);

// Name of the single field to be indexed (along with the hymn number)
// (Could upgrade this script to handle multiple fields if needed later)
refField = process.argv[2];
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
    var documents = JSON.parse(buffer.join(''));

    var idx = elasticlunr(function () {
        this.setRef(refField);
        // Future enhancement: loop through all fields passed
        columnList.forEach(function (column, i) {
            this.addField(column)
        }, this)

        documents.forEach(function (doc) {
            this.addDoc(doc)
        }, this)
    })

    stdout.write(JSON.stringify(idx))
})

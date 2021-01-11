var lunr = require('lunr'),
    stdin = process.stdin,
    stdout = process.stdout,
    buffer = []

// Name of the single field to be indexed (along with the hymn number)
// (Could upgrade this script to handle multiple fields if needed later)
var field = process.argv[2]

stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', function (data) {
  buffer.push(data)
})

stdin.on('end', function () {
  var documents = JSON.parse(buffer.join(''))

  var idx = lunr(function () {
    this.ref('ceNumber')
    // Future enhancement: loop through all fields passed
    this.field(field)

    documents.forEach(function (doc) {
      this.add(doc)
    }, this)
  })

  stdout.write(JSON.stringify(idx))
})

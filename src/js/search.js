// TODO: recreate ElasticSearch POC using Luna.js index
// Iteration 1
// Title index only: deserialize index and run a search against it, no input

var maindiv = $('#maindiv');

// https://osh100-search-app.s3.amazonaws.com/lunr/db/titleIndex.json

function fetchIndexData(url, callback){
    var obj;
    fetch(url)
        .then(res => res.json())
        .then(data => obj = data)
        .then(() => callback(obj))
}

fetchIndexData('https://osh100-search-app.s3.amazonaws.com/lunr/db/titleIndex.json', loadIndexData);

function loadIndexData(arrOfObjs){
    console.log({ arrOfObjs });
    var idx = lunr.Index.load(arrOfObjs);
    searchArray = idx.search('Grace');
    var results = "";
    searchArray.forEach( (x) => {
        results += "<p> Id: " + x.ref + "<ul>"
        Object.keys(x).forEach( (p) => {
            results += "<li>" + (p + ": " + x[p]) + "</li>";
        });
        results += "</ul> </p> <hr>"
    })
    results += "";
    console.log({results});
    maindiv.empty();
    maindiv.append(results);
}
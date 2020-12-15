// TODO: recreate ElasticSearch POC using Luna.js index
// Iteration 1: complete
//      Title index only: deserialize index and run a search against it, no input
// Iteration 2:
//      Repeat pattern to load first line body and chorus indexes

var maindiv = $('#maindiv');
var lunrTitleIndex;
var lunrFirstLineBodyIndex;
var lunrFirstLineChorusIndex;

function fetchIndexData(url, callback){
    var obj;
    fetch(url)
        .then(res => res.json())
        .then(data => obj = data)
        .then(() => callback(obj))
}

fetchIndexData('https://osh100-search-app.s3.amazonaws.com/lunr/db/titleIndex.json', loadTitleIndex);
fetchIndexData('https://osh100-search-app.s3.amazonaws.com/lunr/db/firstLineBodyIndex.json', loadFirstLineBodyIndex);
fetchIndexData('https://osh100-search-app.s3.amazonaws.com/lunr/db/firstLineChorusIndex.json', loadFirstLineChorusIndex);

function loadTitleIndex(arrOfObjs){
    lunrTitleIndex = lunr.Index.load(arrOfObjs);
    // console.log({ arrOfObjs });
    // searchArray = lunrTitleIndex.search('Grace');
    // var results = "";
    // searchArray.forEach( (x) => {
    //     results += "<p> Id: " + x.ref + "<ul>"
    //     Object.keys(x).forEach( (p) => {
    //         results += "<li>" + (p + ": " + x[p]) + "</li>";
    //     });
    //     results += "</ul> </p> <hr>"
    // })
    // results += "";
    // console.log({results});
    // maindiv.empty();
    // maindiv.append(results);
}

function loadFirstLineBodyIndex(arrOfObjs){
    lunrFirstLineBodyIndex = lunr.Index.load(arrOfObjs);
}

function loadFirstLineChorusIndex(arrOfObjs){
    lunrFirstLineChorusIndex = lunr.Index.load(arrOfObjs);
}
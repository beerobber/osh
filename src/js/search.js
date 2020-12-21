// Hymn search using pre-serialized, static Lunr.js index instead of live ElasticSearch.
// Dec 2020
// Chris Taylor
//
// Iteration 1: complete
//      Title index only: deserialize index and run a search against it, no input
// Iteration 2: complete
//      Repeat pattern to load first line body and chorus indexes
// Iteration 3: complete 12/15 8:15pm
//      Bring in Webflow search HTML and adapt ElasticSearch POC to Lunr, returning hits w/o lookup
// Iteration 4: complete 12/15 9:10pm
//      Look up Lunr hit references in full JSON index and format as HTML search results

// After iteration 4, the approach seemed viable and I integrated it with Webflow.
// The local search.html file mirrors key structural elements of the Webflow home page,
// so this script works with both.

// Iteration 5:
//      Incorporate all 3 indices + hymn numbers in search and group results accordingly

var searchdiv = $("#osh-search-div")
var lunrTitleIndex;
var lunrFirstLineBodyIndex;
var lunrFirstLineChorusIndex;
var fullIndex;

function fetchIndexData(url, callback){
    var obj;
    fetch(url)
        .then(res => res.json())
        .then(data => obj = data)
        .then(() => callback(obj))
}

fetchIndexData('https://osh100-search-app.s3.amazonaws.com/db/lunr/titleIndex.json', loadTitleIndex);
fetchIndexData('https://osh100-search-app.s3.amazonaws.com/db/lunr/firstLineBodyIndex.json', loadFirstLineBodyIndex);
fetchIndexData('https://osh100-search-app.s3.amazonaws.com/db/lunr/firstLineChorusIndex.json', loadFirstLineChorusIndex);
fetchIndexData('https://osh100-search-app.s3.amazonaws.com/db/full/fullIndex.json', loadFullIndex);

function loadTitleIndex(arrOfObjs){
    lunrTitleIndex = lunr.Index.load(arrOfObjs);
}

function loadFirstLineBodyIndex(arrOfObjs){
    lunrFirstLineBodyIndex = lunr.Index.load(arrOfObjs);
}

function loadFirstLineChorusIndex(arrOfObjs){
    lunrFirstLineChorusIndex = lunr.Index.load(arrOfObjs);
}

function loadFullIndex(arrOfObjs){
    fullIndex = arrOfObjs;
}

function generateSearchUI(){
    var html = "";
    html += "<input ";
    html += "type = \"text\" ";
    html += "className = \"w-input\" ";
    html += "autoFocus = \"true\" ";
    html += "maxLength = \"256\" ";
    html += "name = \"search\" ";
    html += "data-name = \"search\" ";
    html += "placeholder = \"Hymn number or words appearing in the hymn\" ";
    html += "id = \"osh-search-dynamic\" / >";

    searchdiv.append(html);
}

var loadingtext = $('#loading');
var noresultstext = $('#noresults');
var resultsdiv = $('#osh-results-div');

generateSearchUI();
// This input box exists only after it is generated
var searchbox = $('input#osh-search-dynamic');

var timer = 0;

// Executes the search function 250 milliseconds after user stops typing
searchbox.keyup(function () {
    clearTimeout(timer);
    timer = setTimeout(search, 250);
});

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

async function search() {
    // Clear results before searching
    noresultstext.hide();
    resultsdiv.empty();
    loadingtext.show();
    // Get the query from the user
    let query = searchbox.val();
    // Only run a query if the string contains at least three characters
    if ((query.length > 2) || (isNumeric(query))) {
        let searchArray = lunrTitleIndex.search(query);
        if (searchArray.length > 0) {
            loadingtext.hide();
            // Sort results -- the JSON comes back sorted by score but
            // that is not guaranteed to be honored in all clients because
            // the JSON spec doesn't require preservation of order in objects.
            // searchArray.sort(function(a, b) {
            //     // Score, descending
            //     return b._score - a._score;
            // });
            // Iterate through the results and write them to HTML
            resultsdiv.append('<p>Found ' + searchArray.length + '.</p>');
            var results = "<div class=\"result\">";
            searchArray.forEach( (x) => {
                // Look up title
                let i = fullIndex.findIndex((hymn) => {
                    return hymn.ceNumber == x.ref;
                });

                // Format results
                results += "<div><h3><a href=\"/hymn?number=" + x.ref + "\">";
                results += x.ref + " &mdash; " + fullIndex[i].title  + "</a></h3>";
                results += "<p>" + fullIndex[i].lyricsFirstLineBody + "</p>";
                // Object.keys(x).forEach( (p) => {
                //     results += "<p>" + (p + ": " + x[p]) + "</p>";
                // });
                results += "</div>";
            });
            results += "</div>";
            resultsdiv.append(results);
            // resultsdiv.append('<div class="result">' +
            //         '<div><h3><a href="/hymn?number=' + number + '">' + number +' &mdash; ' + title + '</a></h3><p>' + firstline + '</p></div></div>');
        } else {
            noresultstext.show();
        }
    }
    loadingtext.hide();
}
// Hymn search using pre-serialized, static elasticlunr index instead of live ElasticSearch.
// Dec 2020
// Chris Taylor

var searchdiv = $("#osh-search-div")
var elunrFullIndex;
var fullIndex;
let resultsFound = 0;

// Words to remove from searches
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
elasticlunr.clearStopWords();
elasticlunr.addStopWords(oshStopWords);

// This fetch function is asynchronous in design; data will load in the background
function fetchIndexData(url, callback) {
    var obj;
    fetch(url)
        .then(res => res.json())
        .then(data => obj = data)
        .then(() => callback(obj))
}

// Call for the biggest files first; all of them will load in the background
fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/elunr/fullIndex.json', loadElunrIndex);
fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/full/fullIndex.json', loadFullIndex);

//
// Callback functions below will populate globals with data once loaded
//
function loadElunrIndex(arrOfObjs) {
    elunrFullIndex = elasticlunr.Index.load(arrOfObjs);
}
function loadFullIndex(arrOfObjs) {
    fullIndex = arrOfObjs;
}

// Webflow doesn't like form elements outside of forms so we create the input element dynamically.
// The CSS class name is known to Webflow.
function generateSearchUI() {
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

// Get some references to the search page HTML for communicating results
let loadingtext = $('#loading');
let noresultstext = $('#noresults');
let resultsdiv = $('#osh-results-div');

// Create the search box
generateSearchUI();

// Get a reference to the search input box; it exists only after it is generated
let searchbox = $('input#osh-search-dynamic');

// Executes the search function 250 milliseconds after user stops typing
let timer = 0;
searchbox.keyup(function () {
    clearTimeout(timer);
    timer = setTimeout(search, 250);
});

function runQuery(query, theFields) {
    // Prepare query instructions
    // Run elasticlunr search
    return elunrFullIndex.search(query, {
        fields: theFields,
        bool: "AND",
        expand: true
    });
}
function htmlHymnTitle(hymnNum, title) {
    return ("<h4><a href=\"/hymn?number=" + hymnNum + "\">" + hymnNum + " &mdash; " + title + "</a></h4>");
}

function htmlContext(context) {
    return ("<span>" + context + "</span>");
}
function renderHtmlResults(searchHits, header) {
    // Present results
    if (searchHits.length > 0) {
        resultsFound = 1;
        loadingtext.hide();
        // Sort combined results by score.
        searchHits.sort(function(a, b) {
            // Score, descending
            return b._score - a._score;
        });
        // Iterate through the results and write them to HTML
        let results = "<div class=\"result\"><h3>" + header + "</h3>";
        searchHits.forEach( (x) => {
            // console.log(x);
            // Look up title
            let i = fullIndex.findIndex((hymn) => {
                return hymn.ceNumber == x.ref;
            });
            let hymnNum = x.ref;
            let title = fullIndex[i].title;
            let context = fullIndex[i].lyricsFirstLineBody;
            if (fullIndex[i].lyricsFirstLineChorus) {
                context += "... " + fullIndex[i].lyricsFirstLineChorus;
            }

            // Format results
            results += "<div>";
            results += htmlHymnTitle(hymnNum, title);
            results += htmlContext(context);
            results += "</div>";
        });
        results += "</div>";
        resultsdiv.append(results);
    }
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

async function search() {
    // Clear results before searching
    resultsFound = 0;
    noresultstext.hide();
    resultsdiv.empty();
    loadingtext.show();
    // Get the query from the user
    let query = searchbox.val();
    // Only run a query if the string contains at least three characters, or is a number
    if ((query.length > 2) || (isNumeric(query))) {
        console.log(":" + query + ":");
        let titleResult = [];
        if (isNumeric(query)) {
            // An all-numeric query is interpreted as a hymn number, let's see if it's in the index
            let i = fullIndex.findIndex((hymn) => {
                return hymn.ceNumber == query;
            });
            if (i >= 0) {
                // Emulating the Lunr return payload, in case something downstream cares about that
                titleResult = [{
                    "ref": (i + 1.0),
                    "score": 1.0,
                    "matchData": {"metadata": {query: {"ceNumber": {}}}}
                }];
                renderHtmlResults(titleResult, "Hymn Number");
            }
        } else {
            renderHtmlResults(runQuery(query, {title: {boost: 3}}), "Titles");
            renderHtmlResults(runQuery(query, {lyricsFirstLineBody: {boost: 2}}), "First-Line Matches");
            renderHtmlResults(runQuery(query, {lyricsFirstLineChorus: {boost: 2}}), "First-Line-Chorus Matches");
            renderHtmlResults(runQuery(query, {hymnText: {boost: 1}}), "Full-Text Matches");
            if (!resultsFound) {
                noresultstext.show();
            }
        }
    }
    loadingtext.hide();
}
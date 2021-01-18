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

function hasSpaces(s) {
    return (s.indexOf(' ') >= 0);
}

// Invoked on multi-word queries; takes the raw set of query words and constructs a Lunr search string.
// We're abstracting the complexities of boolean search syntax and making some assumptions to get what is
// hopefully a reasonable result for most inputs.
function lunrLogicalAnd(q) {
    var qnew = "";
    var res = q.split(" ");
    res.forEach( (word) => {
        // For significant words, make them mandatory, not optional, with a "+" prefix; short words remain optional
        if (word.length > 3) {
            word = "+" + word;
        }
        qnew += " " + word;
    })
    // Final word treated like a fragment, add a wildcard
    qnew += "*";

    // No leading spaces
    qnew = qnew.trimLeft();

    // Remove any wildcard appended to a space, whether input by user or added by our algorithm
    return qnew.replace(/ \*/, "");
}

// Merge an index search result object into an existing array of such objects, if there is a match
function mergeHit(existingArray, newhit) {
    let existing = existingArray.find(o => o.ref === newhit.ref);
    if (existing) {

        // Add score of new hit to existing compiled result score for this hymn
        existing.score = existing.score + newhit.score;

        // Merge metadata; might munge it, but it isn't currently being used for anything....
        existing.matchData.metadata = {
            ...existing.matchData.metadata,
            ...newhit.matchData.metadata
        };
        return true;
    } else {
        return false;
    }
}

async function search() {
    // Clear results before searching
    noresultstext.hide();
    resultsdiv.empty();
    loadingtext.show();
    // Get the query from the user
    let query = searchbox.val();
    // Only run a query if the string contains at least three characters, or is a number
    if ((query.length > 2) || (isNumeric(query))) {

        // For non-numeric searches, build a query based on user input
        if (!hasSpaces(query) && !isNumeric(query)) {
            // If there aren't any numbers or spaces (just one word fragment)
            // then search for both the unmodified fragment/word and a wildcard variant
            query += "* " + query;
        } else if (hasSpaces(query) && !isNumeric(query)) {
            // There are multiple words in this query; make them logical AND terms for Lunr
            query = lunrLogicalAnd(query);
        }

        console.log(":" + query + ":");
        let resultsCompiled = [];
        if (isNumeric(query)) {
            // An all-numeric query is interpreted as a hymn number, let's see if it's in the index
            let i = fullIndex.findIndex((hymn) => {
                return hymn.ceNumber == query;
            });
            if (i > 0) {
                // Emulating the Lunr return payload, in case something downstream cares about that
                resultsCompiled = [{"ref": (i + 1.0), "score": 1.0, "matchData": {"metadata": {query: {"ceNumber":{}}}}}];
            }
        } else {
            let resultsTitles = lunrTitleIndex.search(query);
            let resultsFirstLines = lunrFirstLineBodyIndex.search(query);
            let resultsChoruses = lunrFirstLineChorusIndex.search(query);

            // Combine searches into a single, simplified array. Add scores. Merge metadata.

            // Start with titles
            if (resultsTitles.length > 0) {
                resultsCompiled = resultsTitles;
            }

            // Examine and merge first line matches
            if (resultsFirstLines.length > 0) {
                if (resultsCompiled.length > 0) {
                    resultsFirstLines.forEach( (newhit) => {
                        if (!mergeHit(resultsCompiled, newhit)) {
                            // Unique hit for this index
                            resultsCompiled.push(newhit);
                        }
                    });
                } else {
                    resultsCompiled = resultsFirstLines;
                }
            }

            // Examine and merge chorus matches
            if (resultsChoruses.length > 0) {
                if (resultsCompiled.length > 0) {
                    resultsChoruses.forEach( (newhit) => {
                        if (!mergeHit(resultsCompiled, newhit)) {
                            // Unique hit for this index
                            resultsCompiled.push(newhit);
                        }
                    });
                } else {
                    resultsCompiled = resultsChoruses;
                }
            }
        }

        // Present results
        if (resultsCompiled.length > 0) {
            loadingtext.hide();
            // Sort combined results by score.
            resultsCompiled.sort(function(a, b) {
                // Score, descending
                return b._score - a._score;
            });
            // Iterate through the results and write them to HTML
            var results = "<div class=\"result\">";
            resultsCompiled.forEach( (x) => {
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
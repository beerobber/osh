// Hymn search using pre-serialized, static elasticlunr index instead of live ElasticSearch.
// Dec 2020
// Chris Taylor

var searchdiv = $("#osh-search-div")
var lunrLyricsIndex;
var lunrTitleIndex;
var lunrFirstLineBodyIndex;
var lunrFirstLineChorusIndex;
var elunrFullIndex;
var fullIndex;

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
// fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/lunr/lyricsIndex.json', loadLyricsIndex);
// fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/lunr/titleIndex.json', loadTitleIndex);
// fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/lunr/firstLineBodyIndex.json', loadFirstLineBodyIndex);
// fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/lunr/firstLineChorusIndex.json', loadFirstLineChorusIndex);
fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/full/fullIndex.json', loadFullIndex);

//
// Callback functions below will populate globals with data once loaded
//
function loadElunrIndex(arrOfObjs) {
    elunrFullIndex = elasticlunr.Index.load(arrOfObjs);
}

function loadLyricsIndex(arrOfObjs) {
    lunrLyricsIndex = lunr.Index.load(arrOfObjs);
}

function loadTitleIndex(arrOfObjs) {
    lunrTitleIndex = lunr.Index.load(arrOfObjs);
}

function loadFirstLineBodyIndex(arrOfObjs) {
    lunrFirstLineBodyIndex = lunr.Index.load(arrOfObjs);
}

function loadFirstLineChorusIndex(arrOfObjs) {
    lunrFirstLineChorusIndex = lunr.Index.load(arrOfObjs);
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
var loadingtext = $('#loading');
var noresultstext = $('#noresults');
var resultsdiv = $('#osh-results-div');

// Create the search box
generateSearchUI();

// Get a reference to the search input box; it exists only after it is generated
var searchbox = $('input#osh-search-dynamic');

var timer = 0;

// Executes the search function 250 milliseconds after user stops typing
searchbox.keyup(function () {
    clearTimeout(timer);
    timer = setTimeout(elunrSearch, 250);
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
    var words = q.split(" ");

    // Remove and save the final word, it gets special treatment
    var finalWord = words.pop();

    words.forEach((word) => {
        // For significant words, make them mandatory, not optional, with a "+" prefix; short words remain optional
        if (word.length > 3) {
            word = "+" + word;
        }
        qnew += " " + word;
    })
    // Final word duplicated as an optional fragment with a wildcard
    qnew += " " + finalWord + " " + finalWord + "*";

    // No leading spaces
    qnew = qnew.trimLeft();

    // Remove any wildcard appended to a space, whether input by user or added by our algorithm
    return qnew.replace(/ \*/, "");
}

// Merge an index search result object into an existing array of such objects, if there is a match
function mergeLunrHit(existingArray, newhit) {
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
    } else {
        noresultstext.show();
    }
}

async function elunrSearch() {
    // Clear results before searching
    noresultstext.hide();
    resultsdiv.empty();
    loadingtext.show();
    // Get the query from the user
    let query = searchbox.val();
    // Only run a query if the string contains at least three characters, or is a number
    if ((query.length > 2) || (isNumeric(query))) {
        console.log(":" + query + ":");
        let resultsCompiled = [];
        if (isNumeric(query)) {
            // An all-numeric query is interpreted as a hymn number, let's see if it's in the index
            let i = fullIndex.findIndex((hymn) => {
                return hymn.ceNumber == query;
            });
            if (i >= 0) {
                // Emulating the Lunr return payload, in case something downstream cares about that
                resultsCompiled = [{
                    "ref": (i + 1.0),
                    "score": 1.0,
                    "matchData": {"metadata": {query: {"ceNumber": {}}}}
                }];
                renderHtmlResults(resultsCompiled, "Hymn");
            }
        } else {
            renderHtmlResults(runQuery(query, {title: {boost: 3}}), "Titles");
            renderHtmlResults(runQuery(query, {lyricsFirstLineBody: {boost: 2}}), "First-Line Matches");
            renderHtmlResults(runQuery(query, {lyricsFirstLineChorus: {boost: 2}}), "First-Line-Chorus Matches");
            renderHtmlResults(runQuery(query, {hymnText: {boost: 1}}), "Full-Text Matches");
        }
    }
    loadingtext.hide();
}

async function lunrSearch() {
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
            if (i >= 0) {
                // Emulating the Lunr return payload, in case something downstream cares about that
                resultsCompiled = [{
                    "ref": (i + 1.0),
                    "score": 1.0,
                    "matchData": {"metadata": {query: {"ceNumber": {}}}}
                }];
            }
        } else {
            let resultsLyrics = lunrLyricsIndex.search(query);
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
                    resultsFirstLines.forEach((newhit) => {
                        if (!mergeLunrHit(resultsCompiled, newhit)) {
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
                    resultsChoruses.forEach((newhit) => {
                        if (!mergeLunrHit(resultsCompiled, newhit)) {
                            // Unique hit for this index
                            resultsCompiled.push(newhit);
                        }
                    });
                } else {
                    resultsCompiled = resultsChoruses;
                }
            }

            // Examine and merge lyrics matches
            if (resultsLyrics.length > 0) {
                if (resultsCompiled.length > 0) {
                    resultsLyrics.forEach((newhit) => {
                        if (!mergeLunrHit(resultsCompiled, newhit)) {
                            // Unique hit for this index
                            resultsCompiled.push(newhit);
                        }
                    });
                } else {
                    resultsCompiled = resultsLyrics;
                }
            }
        }

        // Present results
        if (resultsCompiled.length > 0) {
            loadingtext.hide();
            // Sort combined results by score.
            resultsCompiled.sort(function (a, b) {
                // Score, descending
                return b._score - a._score;
            });
            // Iterate through the results and write them to HTML
            var results = "<div class=\"result\">";
            resultsCompiled.forEach((x) => {
                // Look up title
                let i = fullIndex.findIndex((hymn) => {
                    return hymn.ceNumber == x.ref;
                });

                // Format results
                results += "<div><h3><a href=\"/hymn?number=" + x.ref + "\">";
                results += x.ref + " &mdash; " + fullIndex[i].title + "</a></h3>";
                results += "<p>" + fullIndex[i].lyricsFirstLineBody + "</p>";
                // Object.keys(x).forEach( (p) => {
                //     results += "<p>" + (p + ": " + x[p]) + "</p>";
                // });
                results += "</div>";
            });
            results += "</div>";
            resultsdiv.append(results);
        } else {
            noresultstext.show();
        }
    }
    loadingtext.hide();
}
// Integrated with detail.html or with the Hymn Detail page in Webflow.
// Dec 2020
// Chris Taylor

let fullIndex;
let videoIndex;

// It is generally bad practice to put keys in source-controlled JavaScript.
// Webflow does not currently support hiding secrets in environment variables, or through any other means.
// This key is constrained to work against exactly one spreadsheet, read-only.
// When Webflow improves secret management, we'll have a better approach.
const sheetsURL = 'https://sheets.googleapis.com/v4/spreadsheets/14pDRUNx9TBZ7iqjZHELo3_ToKa4VNU9BNhLxRvJwln4/values/Sheet1!A1:B503?key=AIzaSyBmsF8a1Gfl4NTQtFvUsqtxpLOVWDszagI';

$.extend({
    getUrlVars: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name){
        return $.getUrlVars()[name];
    }
});

async function fetchIndexData(url){
    let res = await fetch(url);
    if (res.ok) {
        fullIndex = await res.json();
    }
}
async function fetchVideoData(url){
    let res = await fetch(url);
    if (res.ok) {
        videoIndex = await res.json();
    }
}

async function buildPracticeTrackLinks(hymnNum) {
    const urlPrefix = "https://osh-ce-practice-tracks.s3.amazonaws.com/";
    const suffix = ".m4a";
    // Pad hymn number with 1 or 2 leading zeroes if less than 100
    let stringNum = hymnNum.toString();
    let hymnString = urlPrefix + "000".substring(0, 3 - stringNum.length) + stringNum;
    let trackLinks = [
        {divid: "#hymnptsoprano", url: hymnString + "S" + suffix},
        {divid: "#hymnptalto", url: hymnString + "A" + suffix},
        {divid: "#hymnpttenor", url: hymnString + "T" + suffix},
        {divid: "#hymnptbass", url: hymnString + "B" + suffix},
        {divid: "#hymnptfull", url: hymnString + "F" + suffix}
    ];
    // Fetch only the headers of the practice track, just confirming it exists and is accessible
    for (let i in trackLinks) {
        let result = "Not yet available";
        // Appending a querystring parameter to URL to avoid using browser's cached req/res resources
        fetch(trackLinks[i].url + "?notcached=1", {method: 'HEAD', mode: "cors"})
            .then(response => {
                if (response.ok) {
                    result = "<a href='" + trackLinks[i].url + "'>Play</a>";
                }
                $(trackLinks[i].divid).html(result);
            })
    }
}

const checkUrl = async (url) => {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
}

const calculateHymnNumber = async (hymnNumber) => {
    const newUrl = `?number=${hymnNumber}`;

    if (!await checkUrl(newUrl)) {
        window.location.search = '?number=1';
    } else {
        window.location.search = newUrl;
    }
}

function hydrateHymnalNavButtons() {
    // Get current hymn number from URL
    const url = new URL(window.location);
    const currentHymn = parseInt(url.searchParams.get('number'));

    // Get previous and next hymn numbers, wrapping around
    const prevHymn = currentHymn - 1;
    const nextHymn = currentHymn + 1;

    // Add event listeners for prev/next buttons
    // Calculation checks if hymn exists, and if not, wraps around
    // Always to 1 though, so if you're on 1, doesn't wrap to end
    document.getElementById('backward-button').addEventListener('click', () => {
        calculateHymnNumber(prevHymn);
    });

    document.getElementById('forward-button').addEventListener('click', () => {
        calculateHymnNumber(nextHymn);
    });
}

async function search() {
    // Get hymn number from querystring
    let hymnNumber = $.getUrlVar('number');

    await fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/full/fullIndex.json');
    await fetchVideoData(sheetsURL);

    if (hymnNumber) {
        // Look up hymn in index
        let i = fullIndex.findIndex((hymn) => {
            return hymn.ceNumber == hymnNumber;
        });
        let videoLink = 'No video available.';

        // If a video exists, show the link
        if (videoIndex.values[hymnNumber].length > 1) {
            videoLink = "<a href=\"" + videoIndex.values[hymnNumber][1] + "\">View video</a>";
        }

        if (i>=0) {
            $('#hymnnumber').html(hymnNumber);
            $('#hymntitle').html(fullIndex[i]['title']);
            $('#hymntune').html(fullIndex[i]['tune']);
            $('#hymnfirstlinebody').html(fullIndex[i]['lyricsFirstLineBody']);
            $('#hymnfirstlinechorus').html(fullIndex[i]['lyricsFirstLineChorus']);
            $('#hymncopyright').html(fullIndex[i]['creditCopyright']);
            // Practice tracks: full, soprano, alto, tenor, bass (filled in after load)
            $('#hymnlyrics').html(fullIndex[i]['creditLyrics']);
            $('#hymnmusic').html(fullIndex[i]['creditMusic']);
            $('#hymnarrangement').html(fullIndex[i]['creditArrangement']);
            $('#hymnfirstappeared').html(fullIndex[i]['firstAppeared']);
            $('#hymnscripturereference').html(fullIndex[i]['scriptureReference']);
            $('#hymninscription').html(fullIndex[i]['inscription']);
            $('#hymnvideo').html(videoLink);
        }

        // Show detail
        $('#hymndetail').show();
        hydrateHymnalNavButtons();

        // Add links to practice tracks, if any are available
        buildPracticeTrackLinks(hymnNumber);
    }
}

search();
hydrateHymnalNavButtons();

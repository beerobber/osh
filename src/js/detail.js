// Integrated with detail.html or with the Hymn Detail page in Webflow.
// Dec 2020
// Chris Taylor

let fullIndex;

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
                    result = "<a href='" + trackLinks[i].url + "'>Download</a>";
                }
                $(trackLinks[i].divid).html(result);
            })
    }
}

async function search() {
    // Get hymn number from querystring
    let hymnNumber = $.getUrlVar('number');

    await fetchIndexData('https://osh100-search-app.s3.amazonaws.com/db/full/fullIndex.json');

    if (hymnNumber) {
        // Look up hymn in index
        let i = fullIndex.findIndex((hymn) => {
            return hymn.ceNumber == hymnNumber;
        });
        
        if (i>=0) {
            $('#hymnnumber').html(fullIndex[i]['ceNumber']);
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
        }

        // Show detail
        $('#hymndetail').show();

        // Add links to practice tracks, if any are available
        buildPracticeTrackLinks(hymnNumber);
    }
}

search();

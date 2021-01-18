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

async function search() {
    // Get hymn number from querystring
    let hymnNumber = $.getUrlVar('number');

    await fetchIndexData('https://osh100-search-app.s3.amazonaws.com/db/full/fullIndex.json');

    if (hymnNumber) {
        // Look up hymn in index
        let i = fullIndex.findIndex((hymn) => {
            return hymn.ceNumber == hymnNumber;
        });
        
        if (i>0) {
            // TODO: update keywords to new values from spreadsheet
            $('#hymnarrangement').html(fullIndex[i]['creditArrangement']);
            $('#hymncopyright').html(fullIndex[i]['creditCopyright']);
            $('#hymnfirstappeared').html(fullIndex[i]['firstAppeared']);
            $('#hymnfirstlinebody').html(fullIndex[i]['lyricsFirstLineBody']);
            $('#hymnfirstlinechorus').html(fullIndex[i]['lyricsFirstLineChorus']);
            $('#hymninscription').html(fullIndex[i]['inscription']);
            $('#hymnlyrics').html(fullIndex[i]['creditLyrics']);
            $('#hymnlyricsedited').html(fullIndex[i]['creditLyricsEdits']);
            $('#hymnmusic').html(fullIndex[i]['creditMusic']);
            $('#hymnnumber').html(fullIndex[i]['ceNumber']);
            $('#hymnscripturereference').html(fullIndex[i]['scriptureReference']);
            $('#hymnsource').html(fullIndex[i]['source']);
            $('#hymntitle').html(fullIndex[i]['title']);
            $('#hymntune').html(fullIndex[i]['tune']);
        }

        // Show detail
        $('#hymndetail').show();
    }
}

search();

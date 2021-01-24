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

async function render() {

    await fetchIndexData('https://osh-web-assets.s3.amazonaws.com/db/full/fullIndex.json');

    if (fullIndex.length > 0) {
        let hymnTemplate = $( $('#prototype') );

        // Sort the hymns
        fullIndex.sort(function(a, b) {
            // By number, ascending
            return a.ceNumber - b.ceNumber;
        });

        // Iterate through hymns
        for (let item in fullIndex) {

            // Extract and format the hymn information
            let title = fullIndex[item].title;
            let number = fullIndex[item].ceNumber;
            let url = '/hymn?number=' + number;
            let tune = fullIndex[item].tune;
            // if (tune === "nan") { tune = ""; }
            let firstLine = fullIndex[item]["lyricsFirstLineBody"];

            // Duplicate prototype template, still a JQuery object
            let hymnEntry = hymnTemplate.clone().attr('id', number);

            // Operate on JQuery object to fill in index values, identified with class selectors
            hymnEntry.find( '.hymnnumber' ).html('<a href="' + url + '">' + number + '</a>');
            hymnEntry.find( '.hymntitle' ).html(title);
            hymnEntry.find( '.hymntune' ).html((tune));
            hymnEntry.find( '.hymnfirstline' ).html(firstLine);

            // Add the JQuery object as HTML at the end of the current set
            $('#indexsection > div:last').after(hymnEntry);
        }
        $('#prototype').remove();
        $('#indexsection').show();

    }
}

render();
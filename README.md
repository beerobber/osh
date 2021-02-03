# Overview
This project implements search for the Old School Hymnal Centennial Edition.
It is integrated in the hymnal's Webflow website, at https://www.oldschoolhymnal.com. 

Our key dependency is on Lunr (https://lunrjs.com/) for hymn searches local to clients.
The following are all Lunr indices and their fields.

* `titleIndex.json`: `ceNumber`,  `title`
* `firstLineBodyIndex.json`: `ceNumber`, `lyricsFirstLineBody`
* `firstLineChorusIndex.json`: `ceNumber`, `lyricsFirstLineChorus`
* `lyricsIndex.json`: `ceNumber`, `hymnText`

These are searched separately, and results grouped, sorted, and combined.

## Data Preparation
In the `db` directory:
* `main.py` is a Python script that orchestrates the entire data preparation pipeline. 
  It will look for `raw/OSH100.csv` and produce all derivative indices.
* `raw/OSH100.csv` is the unmodified Google Sheets export of OSH metadata
* `full/fullIndex.json` contains all index data, with keys matching Lunr schema.
  Use it to look up titles, etc. given a hymn number.
* `lunr/*` contains the targeted Lunr indices listed above
* `texts/*` contains raw text files for each hymn, e.g. `001.txt` with leading zeroes.

The hymn text files were extracted directly from a print-ready format, and have some
formatting and spelling oddities that might cause some search misses. 
These will have to improve over time.  

The Python environment tested was 3.6.3. It needs the Pandas data management library
to manipulate CSV data. See `requirements.txt` for the full Python module list.

## Other Dependencies
The project has non-breaking dependencies on some additional data sources.
These are used for supplemental hymn details in detailed search results.
See `src/js/detail.js` for specifics.
* S3 bucket `osh-ce-practice-tracks` contains practice tracks named according to a specific convention.
The hymn detail page pings these expected files and links to them if present.
* A Google Sheets document lists videos of congregations singing, indexed by hymn number.
The hymn detail page uses a Google Cloud Platform v4 API to fetch those details.

## Testing and Deploying
The JavaScript files are designed to integrate with a Webflow-hosted site.
Each has a corresponding HTML file in the parent directory to support local testing.
The HTML structure is copied directly from Webflow-generated source, but isn't styled.

Several `npm` scripts are provided in `package.json` to deploy the JavaScript and database
assets to S3 locations where Webflow expects them.
Clone this repository to an AWS CloudShell environment for simplest use.
Otherwise, configure the AWS CLI context with IAM credentials before running them.
* `npm run deploy-js` will deploy all JavaScript files
* `npm run deploy-idx` will deploy all JSON index files

## Integration with Webflow
In the Webflow designer, view the properties of pages with integrations.
Add `<script>` references to each page for the Lunr library on the unpkg CDN
and for the S3 location of the appropriate custom script. 
The references should be in the pre-`</body>` region in the Webflow designer UI.

While editing in the Webflow Designer, preserve the DIV IDs expected by the JavaScript.
Style as desired. Some containers are styled with no visibility as their initial states.
They will be visible in the Webflow component tree navigator.
Make them visible to change styles, but restore the no-visibility style to publish.

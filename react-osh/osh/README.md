# Overview
First approach to test Lunr will be to build multiple, small, targeted indexes
rather than one index like ElasticSearch used.

* `titleIndex.json`: `ceNumber`,  `title`
* `firstLineBodyIndex.json`: `ceNumber`, `lyricsFirstLineBody`
* `firstLineChorusIndex.json`: `ceNumber`, `lyricsFirstLineChorus`
* `lyricsIndex.json`: `ceNumber`, `lyricsFull` (future)

These can be searched separately, and results grouped, sorted, and combined.

The `title` will not be repeated in all the various indexes, 
so we will want a function to return title given a `ceNumber`.

## Data Preparation
In the `db` directory:
* `main.py` is a Python script that orchestrates the entire data preparation pipeline. 
  It will look for `raw/OSH100.csv` and produce all derivative indices.
* `raw/OSH100.csv` is the unmodified Google Sheets export of OSH metadata
* `full/fullIndex.json` contains all index data, with keys matching Lunr schema
* `lunr/*` contains the targeted Lunr indices listed above

The Python environment tested was 3.6.3. It needs the Pandas data management library
to manipulate CSV data. See `requirements.txt` for the full Python module list.

## Testing and Deploying
The JavaScript files are designed to integrate with a Webflow-hosted site.
Each has a corresponding HTML file to support local testing.
The HTML structure is copied directly from Webflow-generated source, but isn't styled.

Several `npm` scripts are provided in `package.json` to deploy the JavaScript and database
assets to S3 locations where Webflow expects them.
Clone this repository to an AWS CloudShell environment for simplest use.
Otherwise, configure the AWS CLI context with IAM credentials before running them.
* `npm run deploy-js` will deploy all JavaScript files
* `npm run deploy-idx` will deploy all JSON index files

## Integration with Webflow
In the Webflow designer, view the properties of pages with integrations.
Add `<script>` references to each page for the Lunr library
and for the S3 location of the appropriate custom script. 
The references should be in the pre-`</body>` region in the Webflow designer UI.

Preserve the DIV IDs expected by the JavaScript.
Style as desired. Some containers are styled with no visibility as their initial states.
They will be visible in the Webflow component tree navigator.
Make them visible to change styles, but restore the no-visibility style to publish.
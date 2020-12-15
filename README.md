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
* `OSH100.csv` is the unmodified Google Sheets export of OSH metadata
* ? 
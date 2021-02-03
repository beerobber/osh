import pandas as pd
import json
import string
import collections
import os
from subprocess import Popen, PIPE, STDOUT
printable = set(string.printable)

columns = ['ceNumber',
           'title',
           'source',
           'firstAppeared',
           'tune',
           'creditMusic',
           'creditArrangement',
           'creditLyrics',
           'creditLyricsEdits',
           'creditCopyright',
           'lyricsFirstLineBody',
           'lyricsFirstLineChorus',
           'scriptureReference',
           'inscription'
           ]

# Searchable index column list will include full text of hymns, in addition to all index fields
elunr_columns = columns.copy()
elunr_columns.append('hymnText')

# Parse CSV of full index
osh_data = pd.read_csv(r'raw/OSH100.csv',
                       header=0,
                       names=columns,
                       usecols=columns,
                       nrows=502)

# Save entire index as JSON, simple conversion of CSV; preserves formatting and typographic glyphs
json_buf = osh_data.to_json(orient="records")
f = open("full/fullIndex.json", "w")
f.write(json_buf)
f.close()

# Also save the same data set as CSV
osh_data.to_csv("full/fullIndex.csv")

# Strip typographic glyph characters before generating index
# Remove curly apostrophes, left quotes, right quotes
osh_data = osh_data.replace('\u2019', '', regex=True)
osh_data = osh_data.replace('\u201c', '', regex=True)
osh_data = osh_data.replace('\u201d', '', regex=True)

hymns = {}

# Read full text files
for hymn_text_file in os.scandir(r'texts'):
    if hymn_text_file.path.endswith(".txt"):
        with open(hymn_text_file, 'r', encoding='latin-1') as file:

            hymn_text = file.read()

            # Remove non-printable characters: typographic glyphs like apostrophes and curly quotes
            hymn_text = ''.join(filter(lambda x: x in printable, hymn_text))

            # Remove any leading zeroes from file name to get hymn number
            hymn_number = int(os.path.splitext(os.path.basename(hymn_text_file))[0])

            # Add hymn text to collection
            hymns[hymn_number] = hymn_text

            file.close()

# Add hymn text collection to dataframe: sort both data sets, then combine
ordered_hymns = collections.OrderedDict(sorted(hymns.items()))
osh_data.sort_values(by='ceNumber', inplace=True)
osh_data = osh_data.assign(hymnText=ordered_hymns.values())
json_buf = osh_data.to_json(orient="records")

# Spawn subprocess to invoke elasticlunr via Node, create and serialize elasticlunr index
p = Popen(["node", "build-elunr-index.js", 'ceNumber', ':'.join(elunr_columns)], stdout=PIPE, stdin=PIPE, stderr=PIPE)
serializable_index_bytes = ""
(serializable_index_bytes, error_output) = p.communicate(input=json_buf.encode())
print("Errors: {}".format(error_output))
print("serializable_index_bytes length: " + str(len(serializable_index_bytes)))
serializable_index = json.loads(serializable_index_bytes)
f = open("elunr/fullIndex.json", "w")
f.write(json.dumps(serializable_index))
f.close()
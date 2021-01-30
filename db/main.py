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


def write_lunr_index(column_name, json_buffer, file_name):

    # For debugging pipeline stages
    # f = open("raw/pre" + file_name, "w")
    # f.write(json_buffer)
    # f.close()

    # Spawn subprocess to invoke Lunr via Node, create and serialize Lunr index
    p = Popen(["node", "build-lunr-index.js", column_name], stdout=PIPE, stdin=PIPE, stderr=PIPE)
    serializable_index_bytes = ""
    (serializable_index_bytes, error_output) = p.communicate(input=json_buffer.encode())
    print("Errors: {}".format(error_output))
    print("serializable_index_bytes length: " + str(len(serializable_index_bytes)))
    serializable_index = json.loads(serializable_index_bytes)

    # Write Lunr index
    f = open("lunr/" + file_name, "w")
    f.write(json.dumps(serializable_index))
    f.close()


# Create and serialize a Lunr index based on a column list subset.
# Current implementation assumes 2 columns per index.
# First column is of interest, second is hymn number.
def generate_lunr_index(column, file_name):

    # Create a subset of data specified by column list
    index_df = pd.DataFrame(osh_data, columns=[column, 'ceNumber'])
    buffer = index_df.to_json(orient="records")
    write_lunr_index(column, buffer, file_name)


# Title index
generate_lunr_index('title', 'titleIndex.json')

# First line of body index
generate_lunr_index('lyricsFirstLineBody', 'firstLineBodyIndex.json')

# First line of chorus index
generate_lunr_index('lyricsFirstLineChorus', 'firstLineChorusIndex.json')

hymn_numbers = []
hymn_texts = []
texts_dict = {}

# Read full text files
for hymn_text_file in os.scandir(r'texts'):
    if hymn_text_file.path.endswith(".txt"):
        with open(hymn_text_file, 'r', encoding='latin-1') as file:

            hymn_text = file.read()

            # Remove non-printable characters: typographic glyphs like apostrophes and curly quotes
            hymn_text = ''.join(filter(lambda x: x in printable, hymn_text))

            # Remove any leading zeroes from file name to get hymn number
            hymn_number = int(os.path.splitext(os.path.basename(hymn_text_file))[0])

            # Add text to data lists
            hymn_numbers.append(hymn_number)
            hymn_texts.append(hymn_text)
            texts_dict[hymn_number] = hymn_text

            file.close()

hymn_text_dict = {
    'hymnText': hymn_texts,
    'ceNumber': hymn_numbers
}

# Prepare a data frame with two columns: text and ceNumber
hymn_df = pd.DataFrame(hymn_text_dict, columns=['hymnText', 'ceNumber'])

# Generate and write a Lunr index from the data frame
json_buf = hymn_df.to_json(orient="records")
write_lunr_index('hymnText', json_buf, 'lyricsIndex.json')

# Add hymn text dictionary to dataframe
ordered_texts = collections.OrderedDict(sorted(texts_dict.items()))
osh_data.sort_values(by='ceNumber', inplace=True)
osh_data = osh_data.assign(hymnText=ordered_texts.values())
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
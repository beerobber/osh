import pandas as pd
import json
from subprocess import Popen, PIPE, STDOUT

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

# Parse CSV
osh_data = pd.read_csv(r'raw/OSH100.csv',
                       header=0,
                       names=columns,
                       usecols=columns,
                       nrows=502)

# Save entire index as JSON
json_buf = osh_data.to_json(orient="records")
f = open("full/fullIndex.json", "w")
f.write(json_buf)
f.close()


# Create and serialize a Lunr index based on a column list subset.
# Current implementation assumes 2 columns per index.
# First column is of interest, second is hymn number.
def generate_index(columns, file_name):

    # Create a subset of data specified by column list
    index_df = pd.DataFrame(osh_data, columns=columns)
    json_buf = index_df.to_json(orient="records")

    # Spawn subprocess to invoke Lunr via Node, create and serialize Lunr index
    p = Popen(["node", "build-lunr-index.js", columns[0]], stdout=PIPE, stdin=PIPE, stderr=PIPE)
    serializable_index_bytes = ""
    (serializable_index_bytes, error_output) = p.communicate(input=json_buf.encode())
    print("Errors: " + str(error_output))
    print("serializable_index_bytes length: " + str(len(serializable_index_bytes)))
    serializable_index = json.loads(serializable_index_bytes)

    # Write Lunr index
    f = open("lunr/" + file_name, "w")
    f.write(json.dumps(serializable_index))
    f.close()


# Title index
generate_index(columns=[
    'title',
    'ceNumber'
    ], file_name="titleIndex.json")

# First line of body index
generate_index(columns=[
    'lyricsFirstLineBody',
    'ceNumber'
    ], file_name="firstLineBodyIndex.json")

# First line of chorus index
generate_index(columns=[
    'lyricsFirstLineChorus',
    'ceNumber'
    ], file_name="firstLineChorusIndex.json")

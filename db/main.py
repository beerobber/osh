import pandas as pd
import json
import string
import os
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

# Parse CSV of full index
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

osh_data.to_csv("full/fullIndex.csv")


def write_index(column_name, json_buffer, file_name):
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
def generate_index(column, file_name):

    # Create a subset of data specified by column list
    index_df = pd.DataFrame(osh_data, columns=[column, 'ceNumber'])
    json_buf = index_df.to_json(orient="records")
    write_index(column, json_buf, file_name)


# Title index
generate_index('title', 'titleIndex.json')

# First line of body index
generate_index('lyricsFirstLineBody', 'firstLineBodyIndex.json')

# First line of chorus index
generate_index('lyricsFirstLineChorus', 'firstLineChorusIndex.json')

hymn_numbers = []
hymn_texts = []
printable = set(string.printable)

# Read full text files
for hymn_text_file in os.scandir(r'texts'):
    if hymn_text_file.path.endswith(".txt"):
        with open(hymn_text_file, 'r', encoding='latin-1') as file:
            hymn_number = int(os.path.splitext(os.path.basename(hymn_text_file))[0])
            print(hymn_number)
            hymn_text = file.read()

            # Remove non-printable characters: typographic glyphs like apostrophes and curly quotes
            hymn_text = ''.join(filter(lambda x: x in printable, hymn_text))

            # Add text to data lists
            hymn_numbers.append(hymn_number)
            hymn_texts.append(hymn_text)

            file.close()

# Prepare a data frame with two columns: text and ceNumber
hymn_text_dict = {
    'hymnText': hymn_texts,
    'ceNumber': hymn_numbers
}
hymn_df = pd.DataFrame(hymn_text_dict, columns=['hymnText', 'ceNumber'])

# Generate and write a Lunr index from the data frame
json_buf = hymn_df.to_json(orient="records")
write_index('hymnText', json_buf, 'lyricsIndex.json')


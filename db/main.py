import pandas as pd
import json

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
osh_data = pd.read_csv(r'OSH100.csv',
                       header=0,
                       names=columns,
                       usecols=columns,
                       nrows=502)

title_index_df = pd.DataFrame(osh_data, columns= [
    'ceNumber',
    'title'
])

#print("Min hymn number", title_index_df['ceNumber'].min())
#print("Max hymn number", title_index_df['ceNumber'].max())
#print(title_index_df.head())

json_buf = title_index_df.to_json(orient='records')
title_index = json.loads(json_buf)
#print(json.dumps(title_index))

f = open("pre/titleIndex.json", "w")
f.write(json.dumps(title_index))
f.close()
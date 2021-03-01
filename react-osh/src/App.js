import React, { Component } from 'react';
import lunr from "lunr";

import './App.css';
import Result from './Items/result';
import Details from './Items/Detail';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function hasSpaces(s) {
  return (s.indexOf(' ') >= 0);
}

function lunrLogicalAnd(q) {
  var qnew = "";
  var res = q.split(" ");
  res.forEach( (word) => {
      // For significant words, make them mandatory, not optional, with a "+" prefix; short words remain optional
      if (word.length > 3) {
          word = "+" + word;
      }
      qnew += " " + word;
  })
  // Final word treated like a fragment, add a wildcard
  qnew += "*";

  // No leading spaces
  qnew = qnew.trimLeft();

  // Remove any wildcard appended to a space, whether input by user or added by our algorithm
  return qnew.replace(/ \*/, "");
}

function mergeHit(existingArray, newhit) {
  let existing = existingArray.find(o => o.ref === newhit.ref);
  if (existing) {

      // Add score of new hit to existing compiled result score for this hymn
      existing.score = existing.score + newhit.score;

      // Merge metadata; might munge it, but it isn't currently being used for anything....
      existing.matchData.metadata = {
          ...existing.matchData.metadata,
          ...newhit.matchData.metadata
      };
      return true;
  } else {
      return false;
  }
}


class App extends Component {

  // Helpful framing
  /*
<label onClick={props.clicked}>{props.title}</label>
            <label>{props.number}</label>
            <label>{props.url}</label>
            <label>{props.tune}</label>
            <label>{props.firstLine}</label>
  */
 /*
      {title: "Oh!", number: 5, url: ".com", tune: "The tune", firstLine: "the first line"},
      {title: "--49nibnoipasd-2", number: 500, url: "web.com", tune: "The 2cd tune", firstLine: "the second line"}
    */
  state = {
    s_fullIndex: "",
    s_titleIndex: "",
    s_bodyIndex: "",
    s_chorusIndex: "",
    IndexHymns: [],
    searchedHymnsState: [],
    detailHymn: [],
    isSearching: false,
    isDetails: false,
    isIndex: true, // default to index page
    // Lunr Data
    searchDataReady: false,
    lunrTitleIndex: "",
    lunrFirstLineBodyIndex: "",
    lunrFirstLineChorusIndex: "",
    lunrDataReady: false,
    // CSS styling
    resultStyle: "search-result"
  }

  // Setting all state variables to the database data

  componentDidMount() {
    this.onSetHymnData();
  }

  onSetHymnData = async () => {
    try {
      let fullIndex;
      let lunrTitleIndex;
      let lunrFirstLineBodyIndex;
      let lunrFirstLineChorusIndex;
      // Full Index
      let resFull = await fetch('https://osh100-search-app.s3.amazonaws.com/db/full/fullIndex.json');
      if (resFull.ok) {
        fullIndex = await resFull.json();
        this.setState({
          s_fullIndex: fullIndex,
          searchDataReady: true
        })
      }
      // Title
      let resTitle = await fetch('https://osh100-search-app.s3.amazonaws.com/db/lunr/titleIndex.json');
      if (resTitle.ok) {
        lunrTitleIndex = await resTitle.json();
        this.setState({
          s_titleIndex: lunrTitleIndex
        })
      }
      // Body
      let resBody = await fetch('https://osh100-search-app.s3.amazonaws.com/db/lunr/firstLineBodyIndex.json');
      if (resBody.ok) {
        lunrFirstLineBodyIndex = await resBody.json();
        this.setState({
          s_bodyIndex: lunrFirstLineBodyIndex
        })
      }
      // Chorus
      let resChorus = await fetch('https://osh100-search-app.s3.amazonaws.com/db/lunr/firstLineChorusIndex.json');
      if (resChorus.ok) {
        lunrFirstLineChorusIndex = await resChorus.json();
        this.setState({
          s_chorusIndex: lunrFirstLineChorusIndex
        })
      }
    } catch (err) {
      this.setState({
        searchDataReady: false
      })
      // TODO Find suitable errors to catch, and write valid response
    }

    let fullIndex = this.state.s_fullIndex;
    // Index Set
    if (fullIndex.length > 0) {
      // Sort the hymns
      fullIndex.sort(function (a, b) {
        // By number, ascending
        return a.ceNumber - b.ceNumber;
      });
  
      let hymnList = [];
      for (let item in fullIndex) {
        hymnList = [...hymnList,
        {
          title: fullIndex[item].title,
          number: fullIndex[item].number,
          url: fullIndex[item].url,
          tune: fullIndex[item].tune,
          firstLine: fullIndex[item].firstLine
        }]
      }
      this.setState({
        IndexHymns: hymnList
      })
    }
    this.generateLunrData();
  }

  generateLunrData = async () => {
    let titleData;
    let bodyData;
    let chorusData;
    while(!this.state.searchDataReady){
      console.log("Not Ready");
    }
    try{
      titleData = lunr.Index.load(this.state.s_titleIndex);
      bodyData = lunr.Index.load(this.state.s_bodyIndex);
      chorusData = lunr.Index.load(this.state.s_chorusIndex);
    }
    catch (err) {
      console.log("error");
    }
    this.setState({
      lunrTitleIndex: titleData,
      lunrFirstLineBodyIndex: bodyData,
      lunrFirstLineChorusIndex: chorusData,
      lunrDataReady: true
    })
  }

 
  searchHymns = async (usrIn) => {
    // Get the query from the user
    let query = usrIn;
    // Only run a query if the string contains at least three characters, or is a number
    if ((query.length > 2) || (isNumeric(query))) {
        // For non-numeric searches, build a query based on user input
        if (!hasSpaces(query) && !isNumeric(query)) {
            // If there aren't any numbers or spaces (just one word fragment)
            // then search for both the unmodified fragment/word and a wildcard variant
            query += "* " + query;
        } else if (hasSpaces(query) && !isNumeric(query)) {
            // There are multiple words in this query; make them logical AND terms for Lunr
            query = lunrLogicalAnd(query);
        }
        let resultsCompiled = [];
        if (isNumeric(query)) {
            // An all-numeric query is interpreted as a hymn number, let's see if it's in the index
            let i = this.state.s_fullIndex.findIndex((hymn) => {
                return hymn.ceNumber === query;
            });
            if (i > 0) {
                // Emulating the Lunr return payload, in case something downstream cares about that
                resultsCompiled = [{"ref": (i + 1.0), "score": 1.0, "matchData": {"metadata": {query: {"ceNumber":{}}}}}];
            }
        } else {
            let resultsTitles = this.state.lunrTitleIndex.search(query);
            let resultsFirstLines = this.state.lunrFirstLineBodyIndex.search(query);
            let resultsChoruses = this.state.lunrFirstLineChorusIndex.search(query);

            // Combine searches into a single, simplified array. Add scores. Merge metadata.
            // Start with titles
            if (resultsTitles.length > 0) {
                resultsCompiled = resultsTitles;
            }
            // Examine and merge first line matches
            if (resultsFirstLines.length > 0) {
                if (resultsCompiled.length > 0) {
                    resultsFirstLines.forEach( (newhit) => {
                        if (!mergeHit(resultsCompiled, newhit)) {
                            // Unique hit for this index
                            resultsCompiled.push(newhit);
                        }
                    });
                } else {
                    resultsCompiled = resultsFirstLines;
                }
            }

            // Examine and merge chorus matches
            if (resultsChoruses.length > 0) {
                if (resultsCompiled.length > 0) {
                    resultsChoruses.forEach( (newhit) => {
                        if (!mergeHit(resultsCompiled, newhit)) {
                            // Unique hit for this index
                            resultsCompiled.push(newhit);
                        }
                    });
                } else {
                    resultsCompiled = resultsChoruses;
                }
            }
        }
        // Present results
        if (resultsCompiled.length > 0) {
          // Sort combined results by score.
          resultsCompiled.sort(function(a, b) {
              // Score, descending
              return b._score - a._score;
          });
          let fullIndex = this.state.s_fullIndex;
          let hymnList = [];
          for (let item in resultsCompiled) {
            hymnList = [...hymnList,
            {
              title: fullIndex[item].title,
              number: fullIndex[item].number,
              url: fullIndex[item].url,
              tune: fullIndex[item].tune,
              firstLine: fullIndex[item].firstLine
            }]
          }
          this.setState({
            searchedHymnsState: hymnList
          })
        } else {
        }
        
        
        
    } else {
      this.setState({
        searchedHymnsState: [],
        detailHymn: []
      })
      this.displaySet(false, false, true);
    }


  }

  displayDetails(hymn) {
    this.setState({
      searchedHymnsState: [],
      detailHymn: [{}, hymn]
    })
    this.displaySet(true, false, false);
  }

  displaySet(details, index, search) {
    this.setState({
      isSearching: search,
      isIndex: index,
      isDetails: details
    })
  }

  render() {

    let hymns = (
      this.state.IndexHymns.map((hymn, index) => {
        return <Result
            // Each result has an ascending unique id associated with it
            // Must be named 'key'
            key={index}

            title={hymn.title}
            number={hymn.number}
            url={hymn.url}
            tune={hymn.tune}
            firstLine={hymn.firstLine}
            class={this.state.resultStyle}
            clicked={() => this.displayDetails(hymn)}
          />
      })
    );

    let searchedHymns = (
      this.state.searchedHymnsState.map((hymn, index) => {
        return <Result
          key={index}

          title={hymn.title}
          number={hymn.number}
          url={hymn.url}
          tune={hymn.tune}
          firstLine={hymn.firstLine}
          clicked={() => this.displayDetails(hymn)}
        />
      })
    );

    let detailHymn = (
      this.state.detailHymn.map((hymn, index) => {
          return <Details
          // Each result has an ascending unique id associated with it
            // Must be named 'key'
            key={index}

            title={hymn.title}
            number={hymn.number}
            url={hymn.url}
            tune={hymn.tune}
            firstLine={hymn.firstLine}
            class={this.state.resultStyle}
          />
      })
    );

    // let search = (
    //   <div className="search-bar-cont">
    //     <div><hr></hr></div>
    //     <input className="text-input" onChange={(event) => this.searchHymns(event.target.value)}></input>
    //     <div><hr></hr></div>
    //   </div>
    //   );

      let currentDisplay = null;
      if(this.state.isIndex) currentDisplay = hymns;
      //if(this.state.isSearching) currentDisplay = searchedHymns;
      if(this.state.isDetails) currentDisplay = detailHymn;
      

    return (
      <div className="center">
        <div className="nav-bar">
          <h1>OSH React</h1>
          {/* <div className="btns">
            <button className="btn-1" onClick={() => this.displaySet(false, false, true)}>Search</button>
            <button className="btn-1" onClick={() => this.displaySet(false, true, false)}>Index</button>
          </div> */}
          {/*search*/}
        </div>
        <div>{currentDisplay}</div>
      </div>
    );

  }

}

export default App;
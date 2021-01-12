import React, { Component } from 'react';

import './App.css';
import Result from './Items/result';

async function initAllHymns(context) {
  let fullIndex;
  let res = await fetch('https://osh100-search-app.s3.amazonaws.com/db/full/fullIndex.json');
  if (res.ok) {
    fullIndex = await res.json();
  }

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
    context.setState({
      hymns: hymnList
    })
  }
}

class App extends Component {

  /*
<label onClick={props.clicked}>{props.title}</label>
            <label>{props.number}</label>
            <label>{props.url}</label>
            <label>{props.tune}</label>
            <label>{props.firstLine}</label>
  */
  state = {
    hymns: [

      /*
      {title: "Oh!", number: 5, url: ".com", tune: "The tune", firstLine: "the first line"},
      {title: "--49nibnoipasd-2", number: 500, url: "web.com", tune: "The 2cd tune", firstLine: "the second line"}
    */
    ],
    isSearching: true
  }


  searchOrIndex = (setVar) => {
    this.setState({
      isSearching: setVar
    })
  }

  render() {
    if(this.searchOrIndex) initAllHymns(this);

    let hymns = (

      this.state.hymns.map((hymn) => {
        return <Result
          title={hymn.title}
          number={hymn.number}
          url={hymn.url}
          tune={hymn.tune}
          firstLine={hymn.firstLine}
        />
      })
    );

    let search = (<div></div>);

    return (
      <div>
        <h1>OSH React</h1>
        <button onClick={() => this.searchOrIndex(false)}>Search</button>
        <button onClick={() => this.searchOrIndex(true)}>Index</button>
        <div>
          {this.state.isSearching ? hymns : search}
        </div>
      </div>
    );

  }

}

export default App;
import React from 'react';
import './Detail.css';

const Details = (props) => {
    if(props.tune === "nan") {
        props.tune = "";
    }
    if(!props.title) return null;
    return (
        <div className="details">

            {/* <label className="title" onClick={props.clicked}>{props.title}</label>
            <label>{props.number}</label>
            <label>{props.url}</label>
            <label>{props.tune}</label>
            <label>{props.firstLine}</label> */}
            <div id="num-and-title">
                <label className="number">222</label>
                <div className="details-title">
                    <label>Oh for a thousand letters in the title for a good test</label>
                </div>
                
            </div>


            <div id="verse">

                <div id="verse-and-bars">
                    <div id="vl"></div>
                    <div id="verse-and-horizontal">
                        <div className="h-bars"></div>
                            <br></br>
                            <label id="firstLine"><em>Westward from the Davis Strait 'tis there 'twas said to lie</em></label>
                            <br></br>
                        <div className="h-bars"></div>
                    </div>
                </div>
                


                <label id="chorus">Ah for just one time, I would take the northwest passage</label>
            </div>

            <div id="info-cont">
                
                <div className="vert" id="words">
                    <label className="info">Some Old Guy</label>
                    <label className="description"><b><em>Words</em></b></label>
                </div>

                <div className="vert" id="music">
                    <label className="info">Probably Matthew</label>
                    <label className="description"><b><em>Music</em></b></label>
                </div>

                <div className="vert" id="tune">
                    <label className="info">The Wellerman And Friends</label>
                    <label className="description"><b><em>Tune</em></b></label>
                </div>
            </div>
            
            
            <label className="url">asonghasaurl?.com</label>
        </div>
    );
}


export default Details;
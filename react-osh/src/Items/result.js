import React from 'react';
import './Detail.css';

const Result = (props) => {
    if(props.tune === "nan") {
        props.tune = "";
    }
    return (
        <div className={props.class}>

            <label className="title" onClick={props.clicked}>{props.title}</label>
            <label>{props.number}</label>
            <label>{props.url}</label>
            <label>{props.tune}</label>
            <label>{props.firstLine}</label>
            
        </div>
    );
}


export default Result;
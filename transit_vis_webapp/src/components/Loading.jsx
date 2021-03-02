import React from "react";


const Loading = () => {
    return (
    <div
        style={{height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}
    >
        <div className="spinner-grow text-dark" role="status">
            <span className="visually-hidden"></span>
        </div>
        <div className="spinner-grow text-dark" role="status">
            <span className="visually-hidden"></span>
        </div>
        <div className="spinner-grow text-dark" role="status">
            <span className="visually-hidden"></span>
        </div>
    </div>);
};

export default Loading;
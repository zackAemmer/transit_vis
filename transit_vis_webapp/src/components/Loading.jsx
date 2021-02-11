import React from 'react';

const Loading = () => {
    return (
    <div
    style={{height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}
    >
        <div className="spinner-grow text-primary" role="status">
            <span class="visually-hidden"></span>
        </div>
        <div className="spinner-grow text-primary" role="status">
            <span class="visually-hidden"></span>
        </div>
        <div className="spinner-grow text-primary" role="status">
            <span class="visually-hidden"></span>
        </div>
    </div>);
}

export default Loading;
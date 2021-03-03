var route_compkey_dict = require("../data/route_compkey_dict.json");


const MapControls = (props) => {

    function handleMetricChange(event) {
        props.onMetricChange(event.target.value);
        console.log(event.target.value);
    }

    function handleRouteChange(event) {
        props.onRouteChange(event.target.value);
        console.log(event.target.value);
    }

    function handleTimeChange(event) {
        props.onTimeChange(event.target.value);
        console.log(event.target.value);
    }

    function handleGradientChange(event) {
        props.onGradientChange(event.target.value);
        console.log(event.target.value);
    }

    function handleBinsChange(event) {
        props.onBinChange(event.target.value);
        console.log(event.target.value);
    }

    function handleScaleTypeChange(event) {
        props.onScaleTypeChange(event.target.value);
        console.log(event.target.value);
    }

    return (
        <div className="map-controls info">
            <h4>Performance Metric</h4>
            <select className="info" onChange={handleMetricChange} defaultValue="SPEED">
                <option value="SPEED_MED">Median Speed (mph)</option>
                <option value="SPEED_STD">Standard Deviation Speed (mph)</option>
                <option value="SPEED_PCT_95">95th Percentile Speed (mph)</option>
                <option value="SPEED_PCT_5">5th Percentile Speed (mph)</option>
                <option value="DEVIATION_MED">Median Schedule Change (s)</option>
                <option value="DEVIATION_STD">Standard Deviation Schedule Change (s)</option>
                <option value="TRAVERSALS">Number of Traversals</option>
            </select>
            <h4>Filter</h4>
            <select className="info" onChange={handleRouteChange} defaultValue="allRoutes">
                <option value="allRoutes">All Routes</option>
                {Object.keys(route_compkey_dict).map(key => (
                    <option value={`${key}`}>{key}</option>
                ))};
            </select>
            <select className="info" onChange={handleTimeChange} defaultValue="FULL_DAY">
                <option value="FULL_DAY">All Times</option>
                <option value="AM">AM Peak (6-9AM)</option>
                <option value="PM">PM Peak (4-7PM)</option>
            </select>
            <h4>Classes</h4>
            <select className="info" onChange={handleGradientChange} defaultValue="QUANTILES">
                <option value="QUANTILES">Quantiles</option>
                <option value="EQUAL_INTERVALS">Equal Intervals</option>
            </select>
            <select className="info" onChange={handleBinsChange} defaultValue="6">
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
            </select>
            <select className="info" onChange={handleScaleTypeChange} defaultValue="ADAPTIVE">
                <option value="ADAPTIVE">Adaptive</option>
                <option value="FIXED">Fixed</option>
            </select>
        </div>
    );
};

export default MapControls;
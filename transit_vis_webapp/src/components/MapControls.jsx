const MapControls = (props) => {

    function handleChange(event) {
        props.onChange(event.target.value);
        console.log(event.target.value);
    }

    return (
        <div className="map-controls info">
            <h4>Performance Metric</h4>
            <select className="info" onChange={handleChange} defaultValue="SPEED">
                <option value="SPEED_MED">Median Speed (mph)</option>
                <option value="SPEED_STD">Standard Deviation Speed (mph)</option>
                <option value="SPEED_PCT_95">95th Percentile Speed (mph)</option>
                <option value="SPEED_PCT_5">5th Percentile Speed (mph)</option>
                <option value="DEVIATION_MED">Median Schedule Change (s)</option>
                <option value="DEVIATION_STD">Standard Deviation Schedule Change (s)</option>
                <option value="TRAVERSALS">Number of Traversals</option>
            </select>
            <h4>Filters</h4>
        </div>
    );
};

export default MapControls;

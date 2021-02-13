const MapControls = (props) => {

    function handleChange(event) {
        props.onChange(event.target.value);
        console.log(props.metric);
    }

    return (
        <div className="mapControls info">
            <h4>Performance Metric</h4>
            <select className="info" onChange={handleChange}> \
                <option selected value="SPEED">Median Speed (m/s)</option> \
                <option value="SPEED_PCT">95th Percentile Speed (m/s)</option> \
                <option value="SPEED_VAR">Variance Speed (m/s)</option> \
                <option value="DEVIATION">Median Schedule Deviation Change (s)</option> \
                <option value="TRAVERSALS">Number of Traversals</option> \
            </select>
        </div>
    );
};

export default MapControls;
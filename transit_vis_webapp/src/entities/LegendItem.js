class LegendItem {
    constructor(title, color, isFor, textColor) {
        this.title = title;
        this.color = color;
        this.isFor = isFor;
        this.textColor = textColor != null ? textColor : 'black';
    }
}

export default LegendItem;
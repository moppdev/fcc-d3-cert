document.addEventListener("DOMContentLoaded", async () => {
    //// Generating a bar chart using D3.js ////

    // set width and height of SVG
    const width = 700;
    const height = 460;
    const padding = 80;

    // get the dataset
    const dataset = await fetchGDPData();
    if (!dataset) {
        console.error("Could not load dataset. Chart cannot be drawn.");
        return;
    }

    // 0 is date, 1 is GDP value

    // create and append the SVG
    const svg = d3.select("body").append("svg").attr("class", "svg").attr("width", width).attr("height", height);

    // Use <text> element for visible titles
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', padding / 2)
        .attr('text-anchor', 'middle')
        .attr("id", "title")
        .text("United States GDP");

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 20)
        .attr('text-anchor', 'middle')
        .attr("id", "x-title")
        .text("Years and Quarters");

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2))
        .attr('y', padding / 2 - 15)
        .attr('text-anchor', 'middle')
        .attr("id", "y-title")
        .text("GDP ($ billions)");

    // generate the x and y axes
    // set domain (min and max vals in dataset) and range
    const parseDate = d3.timeParse("%Y-%m-%d");
    const xScale = d3.scaleTime()
    .domain([
        d3.min(dataset, d => parseDate(d[0])),
        d3.max(dataset, d => parseDate(d[0]))
    ])
    .range([padding, width - padding]);

    const yScale = d3.scaleLinear().domain([0, d3.max(dataset, (d) => d[1])]).range([height - padding, padding]);

    svg.append("g").attr("id", "x-axis").attr("transform", `translate(0,${height - padding})`).call(d3.axisBottom(xScale));

    svg.append("g").attr("id", "y-axis").attr("transform", `translate(${padding}, 0)`).call(d3.axisLeft(yScale));

    // get the tooltip
    const tooltip = d3.select("#tooltip");

    // generate the bars
    svg.selectAll("rect").data(dataset).enter().append("rect")
    .attr("x", (d, i) => {
        // set x coordinate of the bar
        return xScale(parseDate(d[0]));
    })
    .attr("y", (d) => {
        // set y coordinate of the bar
        return yScale(d[1]);
    })
    .attr("width", (d) => {
        return 12; // set width of the bar
    })
    .attr("height", (d) => {
        // set height of the bar
        return height - padding - yScale(d[1]);
    })
    .attr("class", "bar")
    .attr("data-date", d => d[0])
    .attr("data-gdp", d => d[1])
    .on("mouseover", (event, d) => {
        // when hovering over the rect, show tooltip
        const splitDate = d[0].split("-");
        const year = splitDate[0];
        const month = splitDate[1];
        let quarter = "";

        switch (month) 
        {
            case "01":
                quarter = "Q1";
                break;
            case "04":
                quarter = "Q2";
                break;
            case "07":
                quarter = "Q3";
                break;
            case "10":
                quarter = "Q4";
                break;
        }

        tooltip.attr("data-date", d[0]).style("opacity", 0.8).style("border", "1px solid black")
        .text(`${year} ${quarter}: $${d[1].toFixed(2)} Billion`).attr("y", yScale(d[0]) - 20).attr("x", xScale(d[1]));
    })
    .on("mouseout", (event, d) => {
        // remove tooltip when leaving the rect
        tooltip.style("opacity", 0);
    })
});

// get the GDP data dynamically
async function fetchGDPData() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json");
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Failed to fetch GDP data:", error);
        return null;
    }
}
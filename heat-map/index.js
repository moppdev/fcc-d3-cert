document.addEventListener("DOMContentLoaded", async () => {
    //// Generating a heat map using D3.js ////

    // get the data
    const data = await fetchHeatData();

    const dataset = data.monthlyVariance;
    const baseTemp = data.baseTemperature;
    if (!dataset)
    {
        console.error("Data couldn't be found. Map can't be drawn.");
        return;
    }

    // Monthly Global Land-Surface Temperature
    // 1753 - 2015: base temperature 8.66℃

    // declare the constants
    const width = 1200
    const height = 800;
    const padding = 100;

    // generate svg
    const svg = d3.select("body").append("svg").attr("width", width).attr("height", height).attr("class", "svg");

    // add the titles
    svg.append("text").text("Monthly Global Land-Surface Temperature").attr("text-anchor", "middle").attr("x", width / 2).attr("y", padding - 50).attr("id", "title");    
    svg.append("text").text("1753 - 2015: base temperature 8.66℃").attr("text-anchor", "middle").attr("x", width / 2).attr("y", padding - 25).attr("id", "description");

    svg.append("text").text("Months")        
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2))
        .attr('y', padding / 2 - 15)
        .attr('text-anchor', 'middle')
        .attr("id", "y-title")
        
    svg.append("text").text("Years").attr("x", width / 2 + 120).attr("y", height - 60);

    // generate scales and axes
    const parseYear = d3.timeParse("%Y");

    const formatMonth = (d) => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return months[d - 1];
    };

    const xScale = d3.scaleTime().domain([
        d3.min(dataset, d => parseYear(d["year".toString()])),
        d3.max(dataset, d => parseYear(d["year".toString()])),
    ]
    ).range([padding, width - padding]);

    const yScale = d3.scaleBand().domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reverse()).range([height - padding, padding]);

    svg.append("g").attr("id", "x-axis").attr("transform", `translate(0, ${height - padding})`).call(d3.axisBottom(xScale).ticks(d3.timeYear.every(10)));
    svg.append("g").attr("id", "y-axis").attr("transform", `translate(${padding}, 0)`).call(d3.axisLeft(yScale).tickFormat(formatMonth));

    const tooltip = d3.select("#tooltip");

    // generate cells

    // scale changes color of each cell
    const colorScale = d3.scaleLinear().domain([
        d3.min(dataset, d => d["variance"]),
        0,
        d3.max(dataset, d =>  d["variance"]),
    ]).range(["blue", "#ffffbf", "red"]);

    const cellWidth = 5;
    const cellHeight = (height - padding * 2) / 12;

    svg.selectAll("rect").data(dataset).enter().append("rect")
    .attr("class", "cell").attr("x", d => xScale(parseYear(d["year"].toString()))).attr("y", d => yScale(d["month"]))
    .attr("width", cellWidth).attr("height", cellHeight).attr("fill", d => colorScale(d["variance"]))
    .attr("data-month", d => d['month'] - 1) .attr("data-year", d => d['year']) .attr("data-temp", d => baseTemp + d['variance'])
    .on("mouseover", (event, d) => {
        const [x, y] = d3.pointer(event);
        tooltip.style("opacity", 0.6).attr("data-year", d['year'])
        .text(`${formatMonth(d["month"])} ${d["year"]}\n${(baseTemp + d["variance"]).toFixed(2)}℃\nVariance: ${d["variance"].toFixed(2)}℃`)
        .style("left", `${x + 30}px`)  // adjust offset
        .style("top", `${y + 20}px`);
    })
    .on("mouseout", (event) => {
        tooltip.style("opacity", 0)
    });

    // generate legend
    const legendColors = d3.schemeRdYlBu[5].reverse(); // At least 4 colors
    const legendWidth = 300;
    const legendHeight = 30;

    const tempMin = d3.min(dataset, d => baseTemp + d.variance);
    const tempMax = d3.max(dataset, d => baseTemp + d.variance);

    const legendThreshold = d3.scaleThreshold()
    .domain(d3.range(tempMin, tempMax, (tempMax - tempMin) / legendColors.length))
    .range(legendColors);

    // Linear scale for positioning the rects
    const legendScale = d3.scaleLinear()
    .domain([tempMin, tempMax])
    .range([0, legendWidth]);

    // Append legend group
    const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${height - 50})`);

    // Append rects
    legend.selectAll("rect")
    .data(legendThreshold.range().map(color => {
        const [x0, x1] = legendThreshold.invertExtent(color);
        return { color, x0, x1 };
    }))
    .enter().append("rect")
    .attr("x", d => legendScale(d.x0))
    .attr("y", 0)
    .attr("width", d => legendScale(d.x1) - legendScale(d.x0))
    .attr("height", legendHeight)
    .attr("fill", d => d.color)
    .attr("stroke", "black");

    // Add axis below the rects
    const legendAxis = d3.axisBottom(legendScale)
    .tickValues(legendThreshold.domain())
    .tickFormat(d3.format(".1f"));

    legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

});

// function that gets the data we need
async function fetchHeatData()
{
    try {
        const response = await fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json");
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Something went wrong with retrieving heat data: " + error)
        return null;
    }
}
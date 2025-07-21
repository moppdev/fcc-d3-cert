document.addEventListener("DOMContentLoaded", async () => {
    //// Generating a scatter plot chart using D3.js ////

    // get the dataset
    const dataset = await fetchCyclingData();
    if (!dataset) {
        console.error("Could not load dataset. Chart cannot be drawn.");
        alert("Could not load dataset. Chart cannot be drawn.");
        return;
    }

    // declare constants
    const width = 750;
    const height = 500;
    const padding = 50;
    const radius = 5;

    // create the svg element
    const svg = d3.select("body").append("svg").attr("class", "svg").attr("width", width).attr("height", height);

    // add graph titles
    svg.append("text").text("Doping in Professional Bicycle Racing").attr("id", "title").attr("text-anchor", "middle").attr("x", width / 2).attr("y", padding - 20);
    svg.append("text").text("35 Fastest times up Alpe d'Huez").attr("text-anchor", "middle").attr("x", width / 2).attr("y", padding + 2);


    // generate the x and y axes
    // set domain (min and max vals in dataset) and range
    const formatTime = (d) => {
        const minutes = Math.floor(d / 60);
        const seconds = d % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };
    const parseDate = d3.timeParse("%Y");

    // Y-Axis: Time in minutes:seconds
    const yScale = d3.scaleLinear()
        .domain([
            d3.max(dataset, d => d["Seconds"]),
            d3.min(dataset, d => d["Seconds"])
        ])
        .range([height - padding, padding]);

    // X-Axis: Year
    const xScale = d3.scaleTime()
        .domain([
            d3.min(dataset, d => parseDate((d["Year"]).toString())),
            d3.max(dataset, d => parseDate(d["Year"].toString()))
        ])
        .range([padding, width - padding]);

    svg.append("g").attr("id", "x-axis").attr("transform", `translate(0,${height - padding})`).call(d3.axisBottom(xScale));

    // use formatTime and tickFormat to get the right labels on y
    svg.append("g").attr("id", "y-axis").attr("transform", `translate(${padding}, 0)`).call(d3.axisLeft(yScale).tickFormat(formatTime));

    // generate the legend
    svg.append("g").attr("id", 'legend').attr("x", padding + 5).attr("y", padding + 15).append("rect").style("fill", "orange").append("text").text("No doping allegations").attr("width", 100).attr("height", 20);

    // get the tooltip
    const tooltip = d3.select("#tooltip");

    // generate the dots
    svg.selectAll("circle").data(dataset).enter().append("circle")
    .attr("cx", d => xScale(parseDate(d["Year"]))).attr("cy", d => yScale(d["Seconds"]))
    .attr("r", radius).attr("class", d => {
        return (d["Doping"] !== "") ? "dot" : "dot-nodope"; 
    }).attr("data-xvalue", d => d["Year"]).attr("data-yvalue", d => new Date(d["Seconds"] * 1000))
    .on("mouseover", (event, d) => {
        tooltip.attr("data-year", d["Year"]).style("opacity", 0.8).style("border", "1px solid black")
        .text(`${d["Name"]}: ${d["Nationality"]}\n Year: ${d["Year"]} Time: ${d["Time"]} \n ${d["Doping"]}`)
        .attr("left", `${event.pageX + 10}px`).attr("top", `${event.pageY - 10}px`);
    })
    .on("mouseout", (event, d) => {
        tooltip.style("opacity", 0)
    });
    

});

// get the dataset we need
async function fetchCyclingData()
{
    try {
        const response = await fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json");
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(`Something went wrong with retrieving cycling data: ${error}`);
        return null;
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    //// Generate a treemap diagram with D3.js ////

    // get data needed
    const dataset = await fetchVGData();
    if (!dataset)
    {
        console.error("Can't create treemap");
        return;
    }
    console.log(dataset);

    // set up constants
    const width = 1500;
    const height = 800;
    const padding = 300;

    // Set up SVG
    const svg = d3.select("body")
        .append("svg")
        .attr("class", "svg")
        .attr("width", width)
        .attr("height", height);

    // Define color scale
    const color = d3.scaleOrdinal(d3.schemeSet1);

    // Create hierarchy and apply treemap layout
    const root = d3.hierarchy(dataset)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width - padding, height - padding])
        .padding(1)
        (root);

    const tooltip = d3.select("#tooltip");

    // Create group for each leaf node
    const nodes = svg.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0 + padding / 2}, ${d.y0 + 150})`);

    // Add rectangles
    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("class", "tile")
        .attr("data-name", d => d.data.name)
        .attr("data-category", d => d.data.category)
        .attr("data-value", d => d.data.value)
        .attr("fill", d => color(d.parent.data.name))
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", "0.7");
            tooltip.text(`${d.data.name}\nGenre: ${d.data.category}\nSales: ${d.data.value}`)
            tooltip.style("left", `${event.pageX + 12}px`)
            tooltip.style("top", `${event.pageY + 7}px`)
            tooltip.attr("data-value", d.data.value)
        })
        .on("mouseout", () => {
            tooltip.style("opacity", "0");
        });

    // Add text
    nodes.append("text")
        .attr("x", 4)
        .attr("y", 10)
        .attr("font-size", "8px")
        .style("pointer-events", "none")
        .each(function(d) {
            const tileHeight = d.y1 - d.y0;
            const words = d.data.name.split(/\s+/);
            const maxLines = Math.floor(tileHeight / 10); // Adjust based on font-size
            const lines = words.slice(0, maxLines);

            const text = d3.select(this);
            lines.forEach((line, i) => {
                text.append("tspan")
                    .attr("x", 4)
                    .attr("dy", i === 0 ? "0em" : "1.1em")
                    .text(line);
            });
        });
    // add the legend
    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${width - 120}, ${height / 2})`);

    const legendItem = legend.selectAll(".legend-item")
        .data(color.domain())
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItem.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 18)
        .attr("class", "legend-item")
        .attr("height", 18)
        .style("fill", d => color(d));

    legendItem.append("text")
        .attr("x", 24)
        .attr("y", 14)
        .text(d => d);

    // append text after treemap, otherwise it'll be displayed behind treemap
    svg.append("text")
        .text("Video Game Sales")
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("y", padding  - 250)
        .attr("id", "title");

    svg.append("text")
        .text("Top 100 Most Sold Video Games Grouped by Platform")
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("y", padding - 210)
        .attr("id", "description");
});

async function fetchVGData() {
    try {
        const response = await fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json");
        if (!response)
        {
            console.error("Can't fetch data");
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error()
        return null;
    }
}
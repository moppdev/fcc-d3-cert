document.addEventListener("DOMContentLoaded", async () => {
    //// Generating a chloropleth map using D3.js ////

    // get the data
    const counties = await fetchChloroCountyData();
    const eduData = await fetchChloroEduData();

    if (!counties || !eduData)
    {
        console.error("Can't generate chloropleth map");
        return;
    }
    console.log(eduData);

    const width = 1000;
    const height = 700;
    const padding = 200;

    const svg = d3.select("body").append("svg").attr("class", "svg").attr("width", width).attr("height", height);
    
    svg.append("text").text("United States Educational Attainment")
    .attr("x", width / 2).attr("y", padding - 150)
    .attr("text-anchor", "middle").attr("id", "title");

    svg.append("text").text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)")
    .attr("x", width / 2).attr("y", padding - 120)
    .attr("text-anchor", "middle").attr("id", "description");

    // get the color scale you need
    const colors = d3.scaleQuantize([
        d3.min(eduData, d => d.bachelorsOrHigher),
        d3.max(eduData, d => d.bachelorsOrHigher)
    ], d3.schemeBlues[9]);

    // map the values you need to use
    const path = d3.geoPath();
    const format = d => `${d}%`;
    
    // store full data for tooltip (array elems are id, ...values)
    const eduMap = new Map(eduData.map(d => [d.fips, d]));

    // store only percentage for color (array elems are id, ...values)
    const colorMap = new Map(eduData.map(d => [d.fips, d.bachelorsOrHigher]));


    // define the country map
    const countiesGeo = topojson.feature(counties, counties.objects.counties);
    const states = topojson.feature(counties, counties.objects.states);
    const statemap = new Map(states.features.map(d => [d.id, d]));
    const statemesh = topojson.mesh(counties, counties.objects.states, (a, b) => a !== b);

    // create a legend
    drawLegend(colors, padding);

    // get the tooltip
    const tooltip = d3.select("#tooltip");

    // generate the map
    svg.append("g")
    .attr("transform", `translate(0, ${padding - 120})`)
    .selectAll("path")
    .data(topojson.feature(counties, counties.objects.counties).features)
    .join("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", d => colors(colorMap.get(d.id)))
    .attr("data-fips", d => d.id)
    .attr("data-education", d => colorMap.get(d.id))
    .on("mouseover", (event, d) => {
        const data = eduMap.get(d.id);
        tooltip
        .text(`${data.area_name}, ${data.state}: ${format(data.bachelorsOrHigher)}`)
        .attr("data-education", data.bachelorsOrHigher)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`)
        .transition()
        .duration(200)
        .style("opacity", 0.9);
    })
    .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
    });

    // add internal borders
    svg.append("path")
    .attr("transform", `translate(0, ${padding - 120})`)
    .datum(topojson.mesh(counties, counties.objects.states, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-linejoin", "round")
    .attr("d", path);

})

async function fetchChloroCountyData()
{
    try 
    {
        const response = await fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json");
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();
        return data;
    }
    catch (error)
    {
        console.error(`Couldn't fetch data: ${error}`);
        return null;
    }
}

async function fetchChloroEduData()
{
    try 
    {
        const response = await fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json");
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();
        return data;
    }
    catch (error)
    {
        console.error(`Couldn't fetch data: ${error}`);
        return null;
    }
}



function drawLegend(colors ,padding) {
  const legendWidth = 300;
  const legendHeight = 10;

  const legendScale = d3.scaleLinear()
    .domain(colors.domain())
    .range([0, legendWidth]);

  const legend = d3.select("svg")
    .append("g")
    .attr("id", "legend") // FCC test looks for this ID
    .attr("transform", `translate(600, ${padding - 100})`);

  const legendRects = legend.selectAll("rect")
    .data(colors.range().map(d => {
      const [start, end] = colors.invertExtent(d);
      return { color: d, start, end };
    }))
    .enter().append("rect")
    .attr("x", d => legendScale(d.start))
    .attr("y", 0)
    .attr("width", d => legendScale(d.end) - legendScale(d.start))
    .attr("height", legendHeight)
    .attr("fill", d => d.color);

  const legendAxis = d3.axisBottom(legendScale)
    .tickSize(10)
    .tickFormat(d => `${Math.round(d)}%`)
    .tickValues(colors.range().map(d => colors.invertExtent(d)[0]));

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .select(".domain").remove();
}
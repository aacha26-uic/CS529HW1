import React, { useRef, useMemo } from "react";
import useSVGCanvas from "./useSVGCanvas.js";
import * as d3 from "d3";

export default function Whitehat(props) {
  //this is a generic component for plotting a d3 plot
  const d3Container = useRef(null);
  //this automatically constructs an svg canvas the size of the parent container (height and width)
  //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
  //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
  const [svg, height, width, tTip] = useSVGCanvas(d3Container);
  var isZoomed = false;

  //TODO done: change the line below to change the size of the white-hat maximum bubble size
  const maxRadius = width / 100;

  //albers usa projection puts alaska in the corner
  //this automatically convert latitude and longitude to coordinates on the svg canvas
  const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]);

  //set up the path generator to draw the states
  const geoGenerator = d3.geoPath().projection(projection);

  //we need to use this function to convert state names into ids so we can select individual states by name using javascript selectors
  //since spaces makes it not work correctly
  function cleanString(string) {
    return string.replace(" ", "_").replace(" ", "_");
  }

  //This is the main loop that renders the code once the data loads
  //TODO done: edit or replace this code to create your white-hat version of the map view; for example, change the color map based on colorbrewer2,
  // Memo for drawing the map and returning the group
  const mapGroupSelection = useMemo(() => {
    //wait until the svg is rendered and data is loaded
    if (
      svg !== undefined &&
      props.map !== undefined &&
      props.data !== undefined
    ) {
      const stateData = props.data.states;

      // Use deaths per 100,000 population for normalization
      const getEncodedFeature = (d) => (d.count / d.population) * 100000;

      // Get normalized rates for all states
      const stateRates = Object.values(stateData).map(getEncodedFeature);
      const [rateMin, rateMax] = d3.extent(stateRates);

      // 3-class BuPu palette from ColorBrewer2
      const buPu3 = ["#e0ecf4", "#9ebcda", "#8856a7"];
      // Use quantiles to keep color distribution visually similar
      const quantiles = [
        d3.quantile(stateRates, 1 / 3),
        d3.quantile(stateRates, 2 / 3),
      ];
      // Color scale and legend both by deaths per 100,000
      const stateScale = d3.scaleThreshold().domain(quantiles).range(buPu3);

      // For legend: use [rateMin, ...quantiles, rateMax]
      const legendBreaks = [rateMin, ...quantiles, rateMax];

      // This function takes a state name and returns deaths per 100,000
      function getCount(name) {
        name = cleanString(name);
        let entry = stateData.filter((d) => d.state === name);
        if (entry === undefined || entry.length < 1) {
          return 0;
        }
        return getEncodedFeature(entry[0]);
      }
      function getStateColor(d) {
        return stateScale(getCount(d.properties.NAME));
      }

      //clear earlier drawings
      svg.selectAll("g").remove();

      //OPTIONAL: EDIT THIS TO CHANGE THE DETAILS OF HOW THE MAP IS DRAWN
      //draw borders from map and add tooltip
      let mapGroup = svg.append("g").attr("class", "mapbox");
      mapGroup
        .selectAll("path")
        .filter(".state")
        .data(props.map.features)
        .enter()
        .append("path")
        .attr("class", "state")
        //ID is useful if you want to do brushing as it gives you a way to select the path
        .attr("id", (d) => cleanString(d.properties.NAME))
        .attr("d", geoGenerator)
        .attr("fill", getStateColor)
        .attr("stroke", "black")
        .attr("stroke-width", 0.1)
        .on("mouseover", (e, d) => {
          let state = cleanString(d.properties.NAME);
          //this updates the brushed state
          if (props.brushedState !== state) {
            props.setBrushedState(state);
          }
          let sname = d.properties.NAME;
          // Find the entry for this state
          let entry = props.data.states.filter(
            (s) => cleanString(s.state) === cleanString(sname)
          );
          let count = entry.length > 0 ? entry[0].count : 0;
          let population = entry.length > 0 ? entry[0].population : 0;
          let rate = population > 0 ? (count / population) * 100000 : 0;
          let text =
            sname +
            "</br>Gun Deaths: " +
            count +
            "</br>Deaths per 100,000: " +
            rate.toFixed(2);
          tTip.html(text);
        })
        .on("mousemove", (e) => {
          //see app.js for the helper function that makes this easier
          props.ToolTip.moveTTipEvent(tTip, e);
        })
        .on("mouseout", (e, d) => {
          props.setBrushedState();
          props.ToolTip.hideTTip(tTip);
        });

      //TODO done : replace or edit the code below to change the city marker being used. Hint: think of the cityScale range (perhaps use area rather than radius).
      //draw markers for each city
      const cityData = props.data.cities;
      const cityMax = d3.max(cityData.map((d) => d.count));
      // Area proportional scale: area = k * count, so radius = sqrt(k * count / pi)
      const maxArea = Math.PI * Math.pow(maxRadius, 2);
      const cityAreaScale = d3
        .scaleLinear()
        .domain([0, cityMax])
        .range([0, maxArea]);

      mapGroup.selectAll(".city").remove();

      //TODO done : Add code for a tooltip when you mouse over the city (hint: use the same code for the state tooltip events .on... and modify what is used for the tTip.html)
      //OPTIONAL: change the color or opacity
      mapGroup
        .selectAll(".city")
        .data(cityData)
        .enter()
        .append("circle")
        .attr("class", "city")
        .attr("id", (d) => d.key)
        .attr("cx", (d) => projection([d.lng, d.lat])[0])
        .attr("cy", (d) => projection([d.lng, d.lat])[1])
        .attr("r", (d) => Math.sqrt(cityAreaScale(d.count) / Math.PI))
        .attr("fill", "red")
        .attr("opacity", 0.7)
        .on("mouseover", (e, d) => {
          // Show tooltip for city
          let text = d.city + "</br>Gun Deaths: " + d.count;
          tTip.html(text);
        })
        .on("mousemove", (e) => {
          props.ToolTip.moveTTipEvent(tTip, e);
        })
        .on("mouseout", (e, d) => {
          props.ToolTip.hideTTip(tTip);
        });

      //draw a color legend, but show total deaths (d.count) in legend - done
      function drawLegend() {
        let bounds = mapGroup.node().getBBox();
        const barHeight = Math.min(height / 10, 40);
        let legendX = bounds.x + 10 + bounds.width;
        const barWidth = Math.min((width - legendX) / 3, 40);
        const fontHeight = Math.min(barWidth / 2, 16);
        let legendY = bounds.y + 2 * fontHeight;
        // Use BuPu palette and legendBreaks for deaths per 100,000
        let colorLData = buPu3.map((color, i) => {
          let min = legendBreaks[i];
          let max = legendBreaks[i + 1];
          // For all but the last bin, show [min, max)
          // For the last bin, show [min, max]
          let text =
            i < buPu3.length - 1
              ? `${min.toFixed(1)} - ${(max - 0.1).toFixed(1)} per 100k`
              : `${min.toFixed(1)} - ${max.toFixed(1)} per 100k`;
          return {
            x: legendX,
            y: legendY + i * barHeight,
            min: min,
            max: max,
            color: color,
            text: text,
          };
        });
        svg.selectAll(".legendRect").remove();
        svg
          .selectAll(".legendRect")
          .data(colorLData)
          .enter()
          .append("rect")
          .attr("class", "legendRect")
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y)
          .attr("fill", (d) => d.color)
          .attr("height", barHeight)
          .attr("width", barWidth);
        svg.selectAll(".legendText").remove();
        const legendTitle = {
          x: legendX - barWidth,
          y: bounds.y,
          text: "Gun Deaths per 100,000",
        };
        svg
          .selectAll(".legendText")
          .data([legendTitle].concat(colorLData))
          .enter()
          .append("text")
          .attr("class", "legendText")
          .attr("x", (d) => d.x + barWidth + 5)
          .attr("y", (d) => d.y + barHeight / 2 + fontHeight / 4)
          .attr("font-size", (d, i) => (i == 0 ? 1.2 * fontHeight : fontHeight))
          .text((d) => d.text);
      }

      drawLegend();
      return mapGroup;
    }
  }, [svg, props.map, props.data, width, height]);

  // Set up zoom and click handlers in useEffect after mapGroupSelection is created
  React.useEffect(() => {
    if (!mapGroupSelection) return;
    function zoomed(event) {
      const { transform } = event;
      mapGroupSelection
        .attr("transform", transform)
        .attr("stroke-width", 1 / transform.k);
    }
    const zoom = d3.zoom().on("zoom", zoomed);
    function clicked(event, d) {
      event.stopPropagation();
      if (isZoomed) {
        mapGroupSelection
          .transition()
          .duration(300)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(0, 0),
            d3.pointer(event, svg.node())
          );
      } else {
        const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
        mapGroupSelection
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(
                Math.min(
                  8,
                  0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)
                )
              )
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
          );
      }
      isZoomed = !isZoomed;
      if (isZoomed) {
        props.setZoomedState(d.properties.NAME);
      } else {
        props.setZoomedState(undefined);
      }
    }
    mapGroupSelection
      .selectAll(".state")
      .attr("cursor", "pointer")
      .on("click", clicked);
  }, [mapGroupSelection, svg, width, height, geoGenerator, isZoomed, props]);

  //OPTIONAL: EDIT HERE TO CHANGE THE BRUSHING BEHAVIOUR IN THE MAP WHEN MOUSING OVER A STATE
  //WILL UPDATE WHEN THE "BRUSHEDSTATE" VARIABLE CHANGES
  //brush the state by altering it's opacity when the property changes
  //brushed state can be on the same level but that makes it harder to use in linked views
  //so its in the parent app to simplify the "whitehat" part which uses linked views.
  useMemo(() => {
    if (mapGroupSelection !== undefined) {
      const isBrushed = props.brushedState !== undefined;
      mapGroupSelection
        .selectAll(".state")
        .attr("opacity", isBrushed ? 0.4 : 0.8)
        .attr("strokeWidth", isBrushed ? 1 : 2);
      if (isBrushed) {
        mapGroupSelection
          .select("#" + props.brushedState)
          .attr("opacity", 1)
          .attr("strokeWidth", 3);
      }
    }
  }, [mapGroupSelection, props.brushedState]);

  return (
    <div
      className={"d3-component"}
      style={{ height: "99%", width: "99%" }}
      ref={d3Container}
    ></div>
  );
  // removed extra closing brace
}

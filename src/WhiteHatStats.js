import React, { useEffect, useRef, useMemo } from "react";
import useSVGCanvas from "./useSVGCanvas.js";
import * as d3 from "d3";

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props) {
  //this is a generic component for plotting a d3 plot
  const d3Container = useRef(null);
  //this automatically constructs an svg canvas the size of the parent container (height and width)
  //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
  //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
  const [svg, height, width, tTip] = useSVGCanvas(d3Container);

  const margin = 50;
  const radius = 10;

  //TODO done: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
  //this loop updates when the props.data changes or the window resizes
  //we can edit it to also use props.brushedState if you want to use linking
  useEffect(() => {
    if (svg === undefined || props.data === undefined) {
      return;
    }

    // Preparing data for stacked bar chart
    const data = props.data.states;
    // Adding stat variables for gender
    const plotData = data.map((state) => {
      const female_count = state.count - state.male_count;
      return {
        name: state.state,
        male: state.male_count,
        female: female_count,
        total: state.count,
      };
    });

    // Sort by total deaths descending
    plotData.sort((a, b) => b.total - a.total);

    // Set up scales
    const xScale = d3
      .scaleBand()
      .domain(plotData.map((d) => d.name))
      .range([margin, width - margin])
      .padding(0.2);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(plotData, (d) => d.total)])
      .range([height - margin, margin]);

    // Stack the data
    const stack = d3.stack().keys(["male", "female"]);
    const stackedData = stack(plotData);

    // Color for genders
    const color = d3
      .scaleOrdinal()
      .domain(["male", "female"])
      .range(["#377eb8", "#e41a1c"]); // blue for male, red for female

    // Clear previous
    svg.selectAll("*").remove();

    // Draw bars
    svg
      .selectAll("g.layer")
      .data(stackedData, (d) => d.key)
      .join("g")
      .attr("class", "layer")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d, i) => xScale(plotData[i].name))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .on("mouseover", (e, d) => {
        const i = d3.select(e.target).datum().data
          ? d3.select(e.target).datum().data
          : d;
        const state =
          plotData[
            d3.select(e.target).datum().index ??
              plotData.findIndex((s) => s.name === d.data.name)
          ];
        let gender = "";
        if (d3.select(e.target.parentNode).attr("fill") === color("male"))
          gender = "Male";
        else gender = "Female";
        let count = gender === "Male" ? state.male : state.female;
        let string = `${state.name}<br>${gender} Deaths: ${count}<br>Total Deaths: ${state.total}`;
        props.ToolTip.moveTTipEvent(tTip, e);
        tTip.html(string);
      })
      .on("mousemove", (e) => {
        props.ToolTip.moveTTipEvent(tTip, e);
      })
      .on("mouseout", (e) => {
        props.ToolTip.hideTTip(tTip);
      });

    // Draw axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d) => d.replace("_", " "))
          .tickSizeOuter(0)
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg
      .append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(yScale));

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin - 100},${margin})`);
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color("male"));
    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("Male")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color("female"));
    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 32)
      .text("Female")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", margin / 2)
      .attr("font-weight", "bold")
      .text("Gun Deaths by Gender and State");
  }, [props.data, svg, height, width, tTip, props.ToolTip]);

  return (
    <div
      className={"d3-component"}
      style={{ height: "99%", width: "99%" }}
      ref={d3Container}
    ></div>
  );
}
//END of TODO #1.

const drawingDifficulty = {
  IL: 9,
  AL: 2,
  AK: 1,
  AR: 3,
  CA: 9.51,
  CO: 0,
  DE: 3.1,
  DC: 1.3,
  FL: 8.9,
  GA: 3.9,
  HI: 4.5,
  ID: 4,
  IN: 4.3,
  IA: 4.1,
  KS: 1.6,
  KY: 7,
  LA: 6.5,
  MN: 2.1,
  MO: 5.5,
  ME: 7.44,
  MD: 10,
  MA: 6.8,
  MI: 9.7,
  MN: 5.1,
  MS: 3.8,
  MT: 1.4,
  NE: 1.9,
  NV: 0.5,
  NH: 3.7,
  NJ: 9.1,
  NM: 0.2,
  NY: 8.7,
  NC: 8.5,
  ND: 2.3,
  OH: 5.8,
  OK: 6.05,
  OR: 4.7,
  PA: 4.01,
  RI: 8.4,
  SC: 7.1,
  SD: 0.9,
  TN: 3.333333,
  TX: 8.1,
  UT: 2.8,
  VT: 2.6,
  VA: 8.2,
  WA: 9.2,
  WV: 7.9,
  WY: 0,
};

import React, {useEffect} from 'react';
import * as d3 from 'd3';
import {ChartProps, Question} from "../Types.ts";

// Calculate the average of an array of numbers
function average(arr: number[]) {
  return arr.reduce((a, b) => a + b) / arr.length;
}

// Calculate the slope (m) and the y-intercept (b) for the line of best fit
function calculateBestFitLine(data : Data[]) {
  const xAvg = average(data.map(d => d.votes));
  const yAvg = average(data.map(d => d.views));

  let m = 0;
  let b = 0;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < data.length; i++) {
    numerator += (data[i].votes - xAvg) * (data[i].views - yAvg);
    denominator += Math.pow(data[i].votes - xAvg, 2);
  }

  m = numerator / denominator;
  b = yAvg - m * xAvg;

  return { m, b };
}

// Create a line function using the slope and y-intercept
function lineFunction(slope: number, intercept: number) {
  return (x: any) => slope * x + intercept < 0 ? 0 : slope * x + intercept;
}



interface Data {
  votes: number
  views: number
}

function mapToChartData(questions: Question[], filterTag?: string) {
  let chartDataArray: Map<number, number[]> = new Map<number, number[]>();

  if (questions.length > 0) {
    for (let question of questions) {
      if (!!filterTag && !question.tags.includes(filterTag)) {
        continue;
      }
      if (chartDataArray.has(question.votes)) {
        chartDataArray.get(question.votes)!.push(question.views);
      } else {
        chartDataArray.set(question.votes, [question.views]);
      }
    }
  }

  let aggregated: Map<number, number> = new Map<number, number>();
  for (let [key, value] of chartDataArray.entries()) {
    aggregated.set(key, value.reduce((a, b) => a + b) / value.length);
  }

  return Array.from(aggregated.entries())
  .sort((a, b) => a[0] - b[0])
  .map(([key, value]) => ({votes: key, views: value}));
}

const ViewsVSVotesLineChart: React.FC<ChartProps> = ({questions, width, height}) => {
  let chartData = mapToChartData(questions, undefined);
  const margin = 40;


  useEffect(() => {
    const svg = d3.select('#line-chart')
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // @ts-ignore
    const x = d3.scaleLinear([d3.min(chartData, d => d.votes), d3.max(chartData, d => d.votes)], [margin, width - margin]);

    // @ts-ignore
    const y = d3.scaleLinear([d3.min(chartData, d => d.views), d3.max(chartData, d => d.views)], [height - margin, margin]);

    // Declare the line generator.
    const line = d3.line<Data>()
    .x(d => x(d.votes))
    .y(d => y(d.views));

    // Add the x-axis.
    svg.append("g")
    .attr("transform", `translate(0,${height - margin})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
    .attr("x", width - margin * 1.35)
    .attr("y", margin / 1.5)
    .attr("fill", "currentColor")
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .text("Rating"));

    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(y).ticks(height / 20).tickSizeOuter(0))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
    .attr("x2", width - margin - margin)
    .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
    .attr("x", -margin / 1.35)
    .attr("y", margin / 1.5)
    .attr("fill", "currentColor")
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .text("Views"));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Append a path for the line.
          const linePath = svg.append("path")
          .datum(chartData)
          .attr("fill", "none")
          .attr("stroke", "aquamarine")
          .attr("stroke-width", 1.5)
          .attr("d", line(chartData));

          // Animate the line
          const totalLength = linePath.node()!.getTotalLength();

          linePath.attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(5000)
          .attr("stroke-dashoffset", 0);

          // Code to add a dashed line showing approximation.
          const { m, b } = calculateBestFitLine(chartData);
          const bestFitLine = lineFunction(m, b);

          const lineOfBestFit = d3.line<Data>()
          .x((d) => x(d.votes))
          .y((d) => y(bestFitLine(d.votes)));

          const bestFitLinePath = svg.append("path")
          .datum(chartData)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "5,5") // creates dashed effect
          .attr("d", lineOfBestFit(chartData));

          // Animate the line of best fit
          const totalLengthBestFit = bestFitLinePath.node()!.getTotalLength();

          bestFitLinePath.attr("stroke-dasharray", totalLengthBestFit + " " + totalLengthBestFit)
          .attr("stroke-dashoffset", totalLengthBestFit)
          .transition()
          .duration(5000)
          .attr("stroke-dashoffset", 0);

          // Stop observing after the first intersection.
          observer.disconnect();
        }
      });
    });

    observer.observe(document.querySelector("#line-chart")!);
  }, []);

  return <div className="flex flex-col items-center justify-center">
    <svg id="line-chart" width={width} height={height}/>
  </div>;
};

export default ViewsVSVotesLineChart;

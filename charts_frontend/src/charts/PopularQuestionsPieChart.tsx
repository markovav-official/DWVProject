import React, {useEffect} from 'react';
import * as d3 from 'd3';
import {ChartProps, Question} from "../Types.ts";

function mapToChartData(questions: Question[]) {
  let chartData: Map<string, number> = new Map<string, number>();

  if (questions.length > 0) {
    for (let question of questions) {
      if (chartData.has(question.user.user)) {
        chartData.set(question.title, chartData.get(question.user.user)! + 1);
      } else {
        chartData.set(question.title, 1);
      }
    }
  }

  return questions
  .sort((a, b) => a.views - b.views)
  .reverse()
  .slice(0, 10)
  .reverse()
  .map((q) => ({question: q.title, views: q.views, link: q.url}));
}

const PieChart: React.FC<ChartProps> = ({questions, width, height}) => {
  const chartData = mapToChartData(questions);

  useEffect(() => {
    const svg = d3.select('#pie-chart')
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const color = d3.scaleOrdinal()
    .domain(chartData.map(d => d.question))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), chartData.length).reverse())

    // Create the pie layout and arc generator.
    const pie = d3.pie()
    .sort(null)
    .value(d => (d as unknown as { views: number }).views);

    const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(Math.min(width, height) / 2 - 1);

    // @ts-ignore
    const labelRadius = arc.outerRadius()() * 0.8;

    // A separate arc generator for labels.
    const arcLabel = d3.arc()
    .innerRadius(labelRadius)
    .outerRadius(labelRadius);

    // @ts-ignore
    const arcs = pie(chartData);

    // Add a sector path for each value.
    // Add a sector path for each value.
    const path = svg.append("g")
    .attr("stroke", "white")
    .attr("class", "cursor-pointer")
    .selectAll("path")
    .data(arcs)
    .join("path")
    // @ts-ignore
    .attr("fill", d => color((d.data as unknown as { question: string }).question))
    .on("click", d => window.open(d.target.getAttribute('data-link'), "_blank"))
    .attr("data-link", d => 'https://stackoverflow.com' + (d.data as unknown as { link: string }).link);

    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          path.transition()
          .duration(3000)
          .attrTween("d", function (d) {
            const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
            return function (t) {
              d.endAngle = i(t);
              // @ts-ignore
              return arc(d);
            }
          });
          observer.disconnect();
        }
      });
    });

    observer.observe(document.querySelector("#pie-chart")!);

    path.append("title")
    .text(d => `${(d.data as unknown as { question: string }).question}: ${(d.data as unknown as {
      views: number
    }).views.toLocaleString()}`);

    // Create a new arc generator to place a label close to the edge.
    // The label shows the value if there is enough room.
    svg.append("g")
    .attr("text-anchor", "middle")
    .selectAll()
    .data(arcs)
    .join("text")
    .style('fill', '#121826')
    // @ts-ignore
    .attr("transform", d => `translate(${arcLabel.centroid(d)}) rotate(${((d.startAngle + d.endAngle) / 2 * 180 / Math.PI - 90)})`)
    .call(text => text.append("tspan")
    .attr("y", "-0.4em")
    .attr("x", 5)
    .attr("font-weight", "bold")
    .text(d => (d.data as unknown as { question: string }).question.substring(0, 20) + "..."))
    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
    .attr("x", 0)
    .attr("y", "1em")
    .attr("fill-opacity", 0.7)
    .text(d => (d.data as unknown as { views: number }).views));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg id="pie-chart" width={width} height={height}/>
    </div>
  );
};

export default PieChart;

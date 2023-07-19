import React, {useEffect} from 'react';
import * as d3 from 'd3';
import {ChartProps, Question} from "../Types.ts";

function mapToChartData(questions: Question[]) {
  let chartData: Map<string, {
    count: number,
    link: string
  }> = new Map<string, {
    count: number,
    link: string
  }>();

  if (questions.length > 0) {
    for (let question of questions) {
      if (chartData.has(question.user.user)) {
        chartData.get(question.user.user)!.count++;
      } else {
        chartData.set(question.user.user, {count: 1, link: question.user.user_url});
      }
    }
  }

  return Array.from(chartData.entries())
  .sort((a, b) => a[1].count - b[1].count)
  .reverse()
  .slice(0, 30)
  .reverse()
  .map(([key, value]) => ({username: key, count: value.count, link: value.link}));
}

const TopUsersBarChart: React.FC<ChartProps> = ({questions, width, height}) => {
  const chartData = mapToChartData(questions);
  const margin = {top: 20, right: 40, bottom: 30, left: 60},
    drawWidth = width - margin.left - margin.right,
    drawHeight = height - margin.top - margin.bottom;
  useEffect(() => {

    const svg = d3.select('#bar-chart')
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

    const y = d3.scaleBand()
    .range([drawHeight, 0])
    .padding(0.1);

    const x = d3.scaleLinear()
    .range([0, drawWidth]);

    x.domain([0, d3.max(chartData, d => d.count)!]);
    y.domain(chartData.map(d => d.username));

    const bars = svg.selectAll(".bar")
    .data(chartData)
    .enter().append("rect")
    .attr("class", "bar cursor-pointer")
    // color depends on the index of the data
    .attr("fill", (_, i) => d3.schemeCategory10[i % 10])
    .attr("width", 0)
    .attr("y", d => y(d.username)!)
    .attr("height", y.bandwidth())
    .on("click", d => window.open(d.target.getAttribute('data-link'), "_blank"))
    .attr("data-link", d => 'https://stackoverflow.com' + d.link);


    const texts = svg.selectAll(".text")
    .data(chartData)
    .enter().append("text")
    .attr("class", "text")
    .attr("fill", "white")
    .attr("x", 0)
    .attr("y", d => y(d.username)! + y.bandwidth() / 2)
    .attr("dy", ".35em")
    .text(d => d.count);

    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Animate bars
          bars.transition()
          .duration(5000)
          .attr("width", d => x(d.count));

          // Animate text
          texts.transition()
          .duration(5000)
          .attr("x", d => x(d.count) + 5);

          observer.disconnect();
        }
      });
    });

    observer.observe(document.querySelector('#bar-chart')!);

    svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + drawHeight + ")")
    .call(d3.axisBottom(x));

    svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg id="bar-chart" width={width} height={height}/>
    </div>
  );
}

export default TopUsersBarChart;

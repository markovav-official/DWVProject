import React, {useEffect, useState} from 'react';
import * as d3 from 'd3';
import {ChartProps, Question} from "../Types.ts";

interface Data {
  name: string
  value: number
}

function mapToChartData(questions: Question[]) {
  let chartData: Map<string, number> = new Map<string, number>();

  if (questions.length > 0) {
    for (let question of questions) {
      for (let tag of question.tags) {
        if (chartData.has(tag)) {
          chartData.set(tag, chartData.get(tag)! + 1);
        } else {
          chartData.set(tag, 1);
        }
      }
    }
  }
  return chartData;
}

function filterChartData(chartData: Map<string, number>, threshold: number) {
  return Array.from(chartData.entries()).filter(([_, value]) => value >= threshold)
  .map(([key, value]) => ({name: key, value: value}));
}

const TagsBubbleChart: React.FC<ChartProps> = ({questions, width, height}) => {
  let chartData = mapToChartData(questions);
  const [threshold, setThreshold] = useState<number>(100);
  const [filteredData, setFilteredData] = useState<Data[]>(filterChartData(chartData, threshold));
  const [animated, setAnimated] = useState<boolean>(false);

  useEffect(() => {
    setFilteredData(filterChartData(chartData, threshold));
  }, [threshold]);

  useEffect(() => {
    const svg = d3.select('#bubble-chart');

    const pack = d3
    .pack()
    .size([width, height])
    .padding(1.5);

    const root = d3.hierarchy({children: filteredData} as unknown)
    .sum((d) => (d as unknown as Data).value);

    const nodes = pack(root).leaves();

    svg.selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('class', 'cursor-pointer')
    .attr('data-link', (d) => {
      const bcd = d.data as Data;
      return `https://stackoverflow.com/questions/tagged/${bcd.name}`;
    })
    .on("click", d => window.open(d.target.getAttribute('data-link'), "_blank"))
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    // start from radius 0
    .attr('r', animated ? (d) => (d as {
      r: number
    }).r : 0)
    .style('fill', (_) => d3.schemeCategory10[Math.floor(Math.random() * 10)])
    .append('title')
    .text((d) => {
      const bcd = d.data as Data;
      return `${bcd.name}: ${bcd.value}`;
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          // add transition to animate circles
          svg.selectAll('circle')
          .transition()
          .duration(2000)
          .attr('r', (d) => (d as {
            r: number
          }).r);
          setAnimated(true);
        }
      });
    });

    observer.observe(document.querySelector('#bubble-chart')!);

    svg.selectAll('text')
    .data(nodes)
    .join('text')
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('fill', '#121826')
    .style('font-size', (d) =>
      `${d.r / Math.log((d.data as Data).name.length * 7)}px`)
    .text((d) => {
      const bcd = d.data as Data;
      if (bcd.value! > threshold) {
        return bcd.name;
      }
      return "";
    });
  }, [filteredData]);

  return <div className="flex flex-col items-center justify-center">
    <svg id="bubble-chart" width={width} height={height}/>
    <div className="flex flex-row items-center justify-center gap-3">
      <input type="range" id="cowbell" name="cowbell"
             min={1} max={200} value={threshold}
             onChange={(e) => setThreshold(parseInt(e.target.value))}
      />
      <label htmlFor="cowbell">Threshold {threshold}</label>
    </div>
  </div>;
};

export default TagsBubbleChart;

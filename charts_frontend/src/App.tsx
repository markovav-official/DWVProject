import axios from 'axios';
import {useEffect, useState} from 'react';
import {Question, QuestionResponse} from "./Types.ts";
import QuestionsBubbleChart from "./charts/TagsBubbleChart.tsx";
import ViewsVSVotesLineChart from "./charts/ViewsVSVotesLineChart.tsx";
import TopUsersBarChart from "./charts/TopUsersBarChart.tsx";
import PieChart from "./charts/PopularQuestionsPieChart.tsx";
import classNames from "classnames";
// @ts-ignore
import avatar from "./assets/ava.jpg";


function NextChartButton(props: {
  chartNumber: number,
  text?: string,
  disabled?: boolean
}) {
  return <button
    className={classNames("bg-sky-700 text-white font-bold py-2 px-4 rounded",
      props.disabled ? "bg-gray-700 cursor-not-allowed" : "hover:bg-sky-800")}
    onClick={() => {
      if (!props.disabled) {
        if (history.pushState) {
          history.pushState(null, '', `#chart-${props.chartNumber}`);
        } else {
          location.hash = `#chart-${props.chartNumber}`;
        }
        return window.scrollTo({
          top: window.innerHeight * props.chartNumber,
          behavior: 'smooth'
        })
      }
    }}>
    {props.disabled ? "Loading..." : (props.text || 'Next Chart')}
  </button>;
}

export default function App() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [questions, setQuestions] = useState<Question[]>([]);

  async function fetchQuestions() {
    let next_page = '/api/questions/0/50000';
    let results: Question[] = [];
    while (!!next_page) {
      let response = await axios.get(next_page);
      let questionResponse = response.data as QuestionResponse;
      next_page = questionResponse.next_url;
      results = results.concat(questionResponse.questions);
    }
    return results;
  }

  useEffect(() => {
    if (window.location.hash && !!questions.length) {
      console.log(window.location.hash);
      const hash = window.location.hash;
      const chartNumber = parseInt(hash.substring(hash.length - 1, hash.length));
      if (chartNumber >= 0 && chartNumber <= 4) {
        window.scrollTo({
          top: window.innerHeight * chartNumber,
          behavior: 'smooth'
        });
      }
    }
  }, [questions]);

  useEffect(() => {
    fetchQuestions().then(r => setQuestions(r));
  }, []);

  return (
    <div id="chart-0" className="flex flex-col bg-gray-900 text-white items-center">
      <div className="flex flex-col h-screen w-1/2 justify-center p-12 gap-5">
        <h1 className="text-4xl font-bold text-center">Visualization
          of <a href="https://stackoverflow.com/" className="hover:underline">Stack Overflow</a> Data
        </h1>
        <p className="text-xl text-center">This project is a part
          of <b>Data Wrangling & Visualization</b> course <br/> at Innopolis University
          by <a href="https://rustam-lukmanov.com" className="text-sky-600 hover:underline">Rustam A. Lukmanov</a></p>
        <hr className="my-2"/>
        <h2 className="text-2xl font-bold text-center">Project Description</h2>
        <p className="text-xl text-justify">
          This web application is part of a data analysis that aims to gather and visualize the data regarding questions
          from
          the <a href="https://stackoverflow.com/questions" className="text-sky-600 hover:underline">Stack
          Overflow</a> website.
          Data is scraped
          using <a href="https://scrapy.org/" className="text-sky-600 hover:underline">Scrapy Python library</a>, then
          cleaned using <a href="https://pandas.pydata.org/" className="text-sky-600 hover:underline">Pandas</a> and
          stored in a local <a href="https://www.sqlite.org/"
                               className="text-sky-600 hover:underline">SQLite</a> database.
        </p>
        <p className="text-xl text-justify">
          Data is served
          using <a href="https://fastapi.tiangolo.com/" className="text-sky-600 hover:underline">FastAPI</a>.
          The frontend is powered
          by <a href="https://www.typescriptlang.org" className="text-sky-600 hover:underline">TypeScript</a> using <a
          href="https://react.dev/" className="text-sky-600 hover:underline">React</a> and <a
          href="https://d3js.org" className="text-sky-600 hover:underline">D3.js</a> libraries.
        </p>

        <div className="flex-grow"></div>
        <div className="flex flex-row justify-center items-center gap-10 mb-2">
          <div className="flex flex-col items-center">
            <img src={avatar} alt={"Project author - Andrei Markov"} className="rounded-full" width="130"/>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xl font-bold">Andrei Markov</p>
            <a href="tg://resolve?domain=markovav_official" className="text-[#0088cc] mb-3">
              @markovav_official
            </a>
            <p className="text-sm">Innopolis University</p>
            <p className="text-sm">2nd year student</p>
            <p className="text-sm">Group: B21-AAI-01</p>
          </div>
        </div>

        <NextChartButton chartNumber={1} text={'Start'} disabled={!questions.length}/>
      </div>
      {!!questions.length && <>
        <div id="chart-1" className="flex flex-row h-screen w-screen">
          <div className="flex flex-col w-1/2 justify-center p-20 gap-5">
            <h1 className="text-4xl font-bold">Tags Bubble Chart</h1>
            <p className="text-xl text-justify">This chart shows the most popular tags on Stack Overflow. The size of
              the
              bubble represents the number of questions with that tag. The bigger the bubble, the more questions as
              associated with that tag.</p>
            <p className="text-xl text-justify">The threshold slider allows you to filter out tags with less than a
              certain number of
              questions. The default threshold is 100.</p>
            <p className="text-xl text-justify">
              <b>Hover</b> over a bubble to see the exact number of questions with that tag.
              <br/>
              <b>Click</b> on a bubble to go to the Stack Overflow page for that tag.
            </p>
            <div className="flex-grow"></div>
            <NextChartButton chartNumber={2}/>
          </div>
          <div className="flex flex-col w-1/2 justify-center items-center">
            {!!questions.length && <QuestionsBubbleChart questions={questions} width={window.innerWidth / 2 - 100}
                                                         height={window.innerHeight - 100}/>}
          </div>
        </div>
        <div id="chart-2" className="flex flex-row h-screen w-screen">
          <div className="flex flex-col w-1/2 justify-center items-center">
            {!!questions.length && <ViewsVSVotesLineChart questions={questions} width={window.innerWidth / 2 - 100}
                                                          height={window.innerHeight - 100}/>}
          </div>
          <div className="flex flex-col w-1/2 justify-center p-20 gap-5">
            <h1 className="text-4xl font-bold">Views vs Rating Line Chart</h1>
            <p className="text-xl text-justify">This chart demonstrates the relationship between the number of views and
              the
              rating for each question. The x-axis represents the number of views and the y-axis represents the
              rating.</p>
            <p className="text-xl text-justify">The cyan line shows average views for any given rating.</p>
            <p className="text-xl text-justify">The red line approximates the rating for a given number of views.</p>
            <p className="text-xl text-justify">As we can see, people tend to view and discuss questions if they have
              higher rating.</p>
            <div className="flex-grow"></div>
            <NextChartButton chartNumber={3}/>
          </div>
        </div>
        <div id="chart-3" className="flex flex-row h-screen w-screen">
          <div className="flex flex-col w-1/2 justify-center p-20 gap-5">
            <h1 className="text-4xl font-bold">Top Users Bar Chart</h1>
            <p className="text-xl text-justify">This chart shows the top 30 users with the most questions on Stack
              Overflow. The x-axis represents the number of questions and the y-axis represents the user.</p>
            <p className="text-xl text-justify"><b>Click</b> on a bar to go to the Stack Overflow page for that user.
            </p>
            <div className="flex-grow"></div>
            <NextChartButton chartNumber={4}/>
          </div>
          <div className="flex flex-col w-1/2 justify-center items-center">
            {!!questions.length && <TopUsersBarChart questions={questions} width={window.innerWidth / 2 - 100}
                                                     height={window.innerHeight - 100}/>}
          </div>
        </div>
        <div id="chart-4" className="flex flex-row h-screen w-screen">
          <div className="flex flex-col w-1/2 justify-center items-center">
            {!!questions.length && <PieChart questions={questions} width={window.innerWidth / 2 - 100}
                                             height={window.innerHeight - 100}/>}
          </div>
          <div className="flex flex-col w-1/2 justify-center p-20 gap-5">
            <h1 className="text-4xl font-bold">Top Questions Pie Chart</h1>
            <p className="text-xl text-justify">This chart shows the top 10 questions with the most views on Stack
              Overflow. The size of
              the pie slice represents the number of views. The bigger the slice, the more views the question has.</p>
            <p className="text-xl text-justify"><b>Click</b> on a pie slice to go to the Stack Overflow page for that
              question.</p>
            <div className="flex-grow"></div>
            <NextChartButton chartNumber={0} text={'Go to the Top'}/>
          </div>
        </div>
      </>}
    </div>
  );
};
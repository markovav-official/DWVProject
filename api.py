from fastapi import FastAPI
from typing import List
from pydantic import BaseModel
import sqlite3
import uvicorn


app = FastAPI()


class User(BaseModel):
    id: str
    user: str
    user_url: str
    user_reputation: int


class Question(BaseModel):
    id: str
    title: str
    url: str
    votes: int
    answers: int
    views: int
    datetime: str
    user: User
    tags: List[str]


def run_query(query: str):
    conn = sqlite3.connect('data/stackoverflow_data.db')
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    return rows


@app.get("/api/questions/{page}/{page_size}")
async def read_questions(page: int = 0, page_size: int = 10):
    offset = page * page_size
    query = f"""
    SELECT 
        q.question_id, q.title, q.url, q.votes, q.answers, q.views, q.datetime,
        u.user_id as user_id, u.user, u.user_url, u.user_reputation,
        GROUP_CONCAT(t.tag) as tags
    FROM 
        questions q
    LEFT JOIN
        user_question qu ON q.question_id = qu.question_id
    LEFT JOIN 
        users u ON qu.user_id = u.user_id
    LEFT JOIN
        tags t ON q.question_id = t.question_id
    GROUP BY 
        q.question_id
    LIMIT {page_size} OFFSET {offset}
    """
    results = run_query(query)
    questions = [Question(id=res[0], title=res[1], url=res[2], votes=res[3], answers=res[4], views=res[5], datetime=res[6],
                          user=User(
                              id=res[7], user=res[8], user_url=res[9], user_reputation=res[10]),
                          tags=res[11].split(',')) for res in results]
    next_url = f"/api/questions/{page + 1}/{page_size}" if len(
        questions) == page_size else None
    return {
        "questions": questions,
        "next_url": next_url
    }


@app.get("/api/users/{page}/{page_size}")
async def read_users(page: int = 0, page_size: int = 10):
    offset = page * page_size
    query = f"SELECT * FROM users LIMIT {page_size} OFFSET {offset}"
    results = run_query(query)
    users = [User(**res) for res in results]
    return users

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1")

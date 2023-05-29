const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;
const databasePath = path.join(__dirname, "todoApplication.db");
const initializeDbServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB error is '${error.message}'`);
    process.exit(1);
  }
};
initializeDbServer();
const hasPropertyOfPriorityAndStatus = (dbObject) => {
  return dbObject.priority !== undefined && dbObject.status !== undefined;
};
const hasPropertyOfPriority = (dbObject) => {
  return dbObject.priority !== undefined;
};
const hasPropertyOfStatus = (dbObject) => {
  return dbObject.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPropertyOfPriorityAndStatus(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPropertyOfPriority(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasPropertyOfStatus(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const todoList = await db.get(getQuery);
  response.send(todoList);
});
//API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postQuery = `INSERT INTO todo(id, todo,priority, status) values (${id}, '${todo}','${priority}','${status}')`;
  const todoGet = await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id =${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousQuery = `select * from todo where id = ${todoId}`;
  const previousTodo = await db.get(previousQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateQuery = `update todo set todo = ${todo}, priority = '${priority}', status = '${status}' where id = ${todoId}`;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});
module.exports = app;

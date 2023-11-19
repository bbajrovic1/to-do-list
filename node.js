import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import pg from "pg";


// get the current directory path
const __dirname = dirname(fileURLToPath(import.meta.url));

// create an Express application
const app = express();
const port = 3000;

// connect to database
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "to_do_list", // insert your database name
    password: "Bake0911",   // insert your pgAdmin username
    port: 5432,             // insert selected port for the database
});
db.connect();


// serve static files from public directories
app.use(express.static("public/html"));
app.use(express.static("public/css"));
app.use(express.static("public/scripts"));
app.use(express.static("public"));

// parse JSON data in incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve the homepage
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html");
});

// get the registration form page
app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/html/register.html");
});

app.get("/home", (req, res) => {
    res.sendFile(__dirname + "/public/html/home.html");
});

// POST route for user registration
app.post("/register", async (req, res) => {
    const { email, username, password } = req.body;

    // check for required data
    if (!email || !username || !password) {
        return res.status(400).json({ error: "Missing required data" });
    }

    try {
        // insert a new user into the database
        const result = await db.query(
            "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id",
            [email, username, password]
        );

        //const newUserId = result.rows[0].id;

        //res.status(201).json({ id: newUserId });
        res.redirect("/login");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during registration" });
    }
});

// get the login form page
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/html/login.html");
});


// POST route for user login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // check for required data
    if (!username || !password) {
        return res.status(400).json({ error: "Missing required data" });
    }

    try {
        // check if the user with the given username and password exists
        const result = await db.query("SELECT * FROM users WHERE username = $1 AND password = $2", [
            username,
            password,
        ]);

        if (result.rows.length === 1) {
            // user found, redirect to the home page after successful login
            res.send(`
            <script>
                localStorage.setItem("userId", ${result.rows[0].id});
                window.location.href = "/home"; // Redirect to home.html
            </script>
            `);
        } else {
            // user not found or incorrect credentials
            res.status(401).json({ error: "Invalid login credentials" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during login" });
    }
});

// retrieve an array of to do lists
app.get("/:userId/lists", (req, res) => {
    const userId = req.params.userId;

    // fetch lists from the database based on the user ID
    db.query("SELECT * FROM lists WHERE user_id = $1", [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching lists from the database" });
        }

        const lists = result.rows;
        res.json(lists);
    });
});

// delete a list by id
app.delete("/lists/:id", async (req, res) => {
    const listId = +req.params.id;

    try {
        // delete all tasks that belonge to the deleted list
        await db.query("DELETE FROM tasks WHERE list_id = $1", [listId]);

        // delete the list from the database based on the ID
        const result = await db.query("DELETE FROM lists WHERE id = $1", [listId]);

        // check if a row was affected (list was deleted)
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "List not found" });
        }

        res.json({ message: "List successfully deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting the list" });
    }
});

// create a new list item
app.post("/newList/:userId", async (req, res) => {
    const { name } = req.body;
    const userId = req.params.userId;

    // check if there is any missing data from the body
    if (!name) {
        return res.status(400).json({ error: "Missing required data" });
    }

    try {
        // insert new list in table lists
        const result = await db.query(
            "INSERT INTO lists (name, user_id) VALUES ($1, $2) RETURNING *",
            [name, userId]
        );

        const newList = result.rows[0];

        res.json(newList); // return new list
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error saving the new list" });
    }
});


// retrieve tasks for a specific list
app.get("/tasks/:listId", async (req, res) => {
    const listId = req.params.listId;

    try {
        // get tasks from the database based on the list ID
        const result = await db.query("SELECT * FROM tasks WHERE list_id = $1", [listId]);

        const tasks = result.rows;
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching tasks from the database" });
    }
});

// retrieve a specific list by id
app.get("/lists/:listId", async (req, res) => {
    const listId = req.params.listId; // get the list id from the URL parameter

    try {
        // Fetch the list from the database based on the list ID
        const result = await db.query("SELECT * FROM lists WHERE id = $1", [listId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "List not found" });
        }

        const selectedList = result.rows[0]; // Extract the first (and only) row

        res.json(selectedList); // return the found list as a response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching the list from the database" });
    }
});



// add a new task to a specific list
app.post("/tasks/:listId/addTask", async (req, res) => {
    const listId = req.params.listId;
    const { name } = req.body;

    try {
        // insert a new task into the tasks table
        const result = await db.query(
            "INSERT INTO tasks (name, completed, list_id) VALUES ($1, $2, $3) RETURNING *",
            [name, false, listId]
        );

        const newTask = result.rows[0];

        res.json(newTask); // return the newly created task as a response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error adding a new task" });
    }
});


// delete a task
app.delete("/tasks/:listId/:taskId", async (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;

    try {
        // check if the task with the given taskId and listId exists
        const taskResult = await db.query("SELECT * FROM tasks WHERE id = $1 AND list_id = $2", [taskId, listId]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        // delete the task from the tasks table
        await db.query("DELETE FROM tasks WHERE id = $1", [taskId]);

        res.json({ message: "Task successfully deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting the task" });
    }
});


// update task
app.put("/tasks/:listId/:taskId", async (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;
    const { completed } = req.body; // updated data for the task

    try {
        // check if the list with the given listId exists
        const listResult = await db.query("SELECT * FROM lists WHERE id = $1", [listId]);

        if (listResult.rows.length === 0) {
            return res.status(404).json({ error: "List not found" });
        }

        // check if the task with the given taskId and listId exists
        const taskResult = await db.query("SELECT * FROM tasks WHERE id = $1 AND list_id = $2", [taskId, listId]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        // update the completed status of the task in the tasks table
        await db.query("UPDATE tasks SET completed = $1 WHERE id = $2", [completed, taskId]);

        res.json({ message: "Task successfully updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating the task" });
    }
});


// start the Express server and listen for incoming requests on the specified port
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
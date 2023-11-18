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

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "to_do_list",
    password: "Bake0911",
    port: 5432,
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

    // Check for required data
    if (!username || !password) {
        return res.status(400).json({ error: "Missing required data" });
    }

    try {
        // Check if the user with the given username and password exists
        const result = await db.query("SELECT * FROM users WHERE username = $1 AND password = $2", [
            username,
            password,
        ]);

        if (result.rows.length === 1) {
            // User found, redirect to the home page after successful login
            res.send(`
            <script>
                localStorage.setItem('userId', ${result.rows[0].id});
                window.location.href = '/home'; // Redirect to home.html
            </script>
            `);
        } else {
            // User not found or incorrect credentials
            res.status(401).json({ error: "Invalid login credentials" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during login" });
    }
});


const dataPath = "data/lists.json";


// retrieve an array of to do lists - json
/*app.get("/liste", (req, res) => {
    // read the content of a JSON file
    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        // parse the JSON content
        const lists = JSON.parse(data);
        res.json(lists);

    });
});*/

// retrieve an array of to do lists
app.get("/:userId/lists", (req, res) => {
    const userId = req.params.userId;

    // Fetch lists from the database based on the user ID
    db.query('SELECT * FROM lists WHERE user_id = $1', [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching lists from the database" });
        }

        const lists = result.rows;
        res.json(lists);
    });
});


// delete a list by id
app.delete("/liste/:id", (req, res) => {
    // read the content of a JSON file
    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        // parse the JSON content
        const lists = JSON.parse(data);

        // find a list by id
        const listId = +req.params.id;
        const listIndex = lists.findIndex((list) => list.id === listId);


        if (listIndex === -1) {
            return res.status(404).json({ error: "List not found" });
        }

        // remove the list from the array
        lists.splice(listIndex, 1);

        // save the updated data to the JSON file
        fs.writeFile(dataPath, JSON.stringify(lists, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error deleting the list" });
            }
            res.json({ message: "List successfully deleted" });
        });
    });
});


// create a new list item - json
/*app.post("/liste", (req, res) => {
    console.log(req.body);
    const { name } = req.body;

    // check if all required data is present in the request
    if (!name) {
        return res.status(400).json({ error: "Missing required data" });
    }

    // read the content of a JSON file
    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        // parse the JSON content
        const lists = JSON.parse(data);

        // create a new list
        const newList = {
            id: lists.length + 1, // generate id
            name,
            tasks: [] // create an empty tasks array
        };

        // add the new list to the list array
        lists.push(newList);

        // save the updated data to the JSON file
        fs.writeFile(dataPath, JSON.stringify(lists, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error saving the new list" });
            }
            res.json(newList); // return the created list as a response
        });
    });
});*/


// create a new list item
app.post("/newList/:userId", async (req, res) => {
    const { name } = req.body;
    const userId = req.params.userId;

    // check if there is any missing data from the body
    if (!name) {
        return res.status(400).json({ error: "Missing required data" });
    }

    try {
        // get user id from local storage
        //const userId = localStorage.getItem("userId");
    
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
app.get("/tasks/:listId", (req, res) => {
    const listId = req.params.listId; // get the list id from the URL parameter
    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        const lists = JSON.parse(data);
        const selectedList = lists.find((list) => list.id === parseInt(listId, 10));

        if (!selectedList) {
            return res.status(404).json({ error: "List not found" });
        }

        res.json(selectedList.tasks); // return the task array for the selected list

    });
});


// retrieve a specific list by id
app.get("/lists/:listId", (req, res) => {
    const listId = req.params.listId; // get the list id from the URL parameter

    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        const lists = JSON.parse(data);

        // find the list with the matching id
        const selectedList = lists.find((list) => list.id === parseInt(listId, 10));

        if (!selectedList) {
            return res.status(404).json({ error: "List not found" });
        }

        res.json(selectedList); // return the found list as a response
    });
});


// add a new task to a specific list
app.post("/tasks/:listId/addTask", (req, res) => {
    const listId = req.params.listId;
    const { name } = req.body;

    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        const lists = JSON.parse(data);
        const selectedList = lists.find((list) => list.id === parseInt(listId, 10));

        const newTask = {
            id: selectedList.tasks.length + 1,
            name,
            completed: false
        };

        if (!selectedList) {
            return res.status(404).json({ error: "List not found" });
        }

        selectedList.tasks.push(newTask); // add the new task to the list

        // save the updated data to the JSON file
        fs.writeFile(dataPath, JSON.stringify(lists, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error saving the new task" });
            }
            res.json(newTask); // return the updated task list as a response
        });
    });
});


// delete a task from a specific list
app.delete("/tasks/:listId/:taskId", (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;

    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        const lists = JSON.parse(data);

        const selectedList = lists.find((list) => list.id === parseInt(listId, 10));

        if (!selectedList) {
            return res.status(404).json({ error: "List not found" });
        }

        // find the index of the task you want to delete in the selected list
        const taskIndex = selectedList.tasks.findIndex((task) => task.id === parseInt(taskId, 10));

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        // remove the task from the list
        selectedList.tasks.splice(taskIndex, 1);

        // save the updated data to the JSON file
        fs.writeFile(dataPath, JSON.stringify(lists, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error deleting the task" });
            }
            res.json({ message: "Task successfully deleted" });
        });
    });
});

app.put("/tasks/:listId/:taskId", (req, res) => {
    const listId = req.params.listId; // list id
    const taskId = req.params.taskId; // task id
    const updatedTaskData = req.body; // new data for the task

    fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error reading data" });
        }

        const lists = JSON.parse(data);
        const selectedList = lists.find((list) => list.id === parseInt(listId, 10));

        if (!selectedList) {
            return res.status(404).json({ error: "List not found" });
        }

        const selectedTask = selectedList.tasks.find((task) => task.id === parseInt(taskId, 10));

        if (!selectedTask) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Update the task with new data
        Object.assign(selectedTask, updatedTaskData);

        // save the updated data to the JSON file
        fs.writeFile(dataPath, JSON.stringify(lists, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error saving updated data" });
            }
            res.json(selectedTask); // return the updated task as a response
        });
    });
});


// start the Express server and listen for incoming requests on the specified port
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
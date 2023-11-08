const popup = document.getElementById("popup");
var addNewBtn = document.getElementById("addNewBtn");
var closeBtn = document.getElementById("close-button");
var submitTaskBtn = document.getElementById("create-task");
var newTaskName = document.getElementById("task-name");

const urlParams = new URLSearchParams(window.location.search);
const listId = urlParams.get("listId");

var unfinishedTasks = 0;

// fetching selected list by id, if the list exists
if (listId) {
    fetch(`/lists/${listId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((list) => {
            // setting heading content to selected list name
            document.getElementById("list-name-header").textContent = list.name;
        })
        .catch((error) => {
            console.error("There was a problem with the fetch operation:", error);
        });
    
    // fetching tasks from the selected list
    fetch(`/tasks/${listId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((tasks) => {
            tasks.forEach((task) => {
                if(task.completed == false) {
                    unfinishedTasks++;
                }
                // creating an li element that represents a single task from the list
                // in that way tasks can be shown on the page after they have been imported from the json file
                createNewTask(task);
            });
            // function that sets the content of h2 to number of unfinished tasks
            unfinishedTasksCounter();
        })
        .catch((error) => {
            console.error("There was a problem with the fetch operation:", error);
        });
}




// showing popup after clicking on the "add new" button
addNewBtn.addEventListener("click", function () {
    popup.classList.remove("invisible");
});

// hiding popup after clicking on the close button
closeBtn.addEventListener("click", function () {
    popup.classList.add("invisible");
    newTaskName.value = "";
});



submitTaskBtn.addEventListener("click", function () {

    const newTaskNameValue = newTaskName.value.trim(); // getting the new task name from the input field

    if (newTaskNameValue) {
        // hiding popup if input field is not empty
        popup.classList.add("invisible");
    }

    // creating data object to send to server
    const data = {
        name: newTaskNameValue
    };

    // adding new task inside the current to do list
    fetch(`/tasks/${listId}/addTask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((newTask) => { 
            createNewTask(newTask);
            unfinishedTasks++;
            unfinishedTasksCounter();
        })
        .catch((error) => {
            console.error("There was a problem with the fetch operation:", error);
        });


    newTaskName.value = ""; // clearing input field

});


function unfinishedTasksCounter() {
    document.getElementById("unfinished-tasks").textContent = "Unfinished tasks: " + unfinishedTasks;
}



function createNewTask(newTask) {
    const ul = document.querySelector("section.task-list ul");

    // creating new li element
    const li = document.createElement("li");

    // creating new input element
    const newCheckbox = document.createElement("input");
    newCheckbox.type = "checkbox";
    newCheckbox.className = "checkbox";
    newCheckbox.checked = newTask.completed;
    newCheckbox.addEventListener("change", () => {
        const isChecked = newCheckbox.checked;
        if (isChecked) {
            unfinishedTasks--;
            unfinishedTasksCounter();
        }
        else {
            unfinishedTasks++;
            unfinishedTasksCounter();
        }

        // updating json file every time a task is checked or unchecked
        fetch(`/tasks/${listId}/${newTask.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ completed: isChecked })
        })
            .then(response => {
                if (response.ok) {
                    console.log("Successful update.");
                } else {
                    console.error("Error while updating.");
                }
            })
            .catch(error => {
                console.error("There was a problem with the fetch operation:", error);
            });

    });

    // creating new span element
    const span = document.createElement("span");
    span.textContent = newTask.name;

    // creating delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
        fetch(`/tasks/${listId}/${newTask.id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(() => {
                // removing li element from the list
                ul.removeChild(li);
            })
            .catch((error) => {
                console.error("Delete error:", error);
            });
    });

    // adding checkbox, span and delete btton inside the li element
    li.appendChild(newCheckbox);
    li.appendChild(span);
    li.appendChild(deleteButton);

    // adding an li element iside the list
    ul.appendChild(li);
}
const popup = document.getElementById("popup");
var addNewBtn = document.getElementById("addNewBtn");
var closeBtn = document.getElementById("close-button");
var submitBtn = document.getElementById("create-list");
var newListName = document.getElementById("list-name");
const ul = document.querySelector("section.task-list ul");
var logoutBtn = document.getElementById("logout");

const userId = localStorage.getItem('userId');
// check if userId exists in local storage
if (userId === null) {
    // if there is no user currently logged in, redirect to login page
    window.location.href = '/login';
}


function clearList() {
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }
}

// fetching lists from the json file
function fetchData() {
    clearList(); // clearing old array of to do lists in case new list has been added
    const userId = localStorage.getItem("userId");
    fetch(`/${userId}/lists`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            // creating li element for every to do list
            data.forEach((lista) => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = "./list.html?listId=" + lista.id;  // link to open list of tasks for selected to do list
                a.textContent = lista.name;

                // creating delete button
                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => {
                    // deleting list with the selected id
                    fetch(`/lists/${lista.id}`, {
                        method: "DELETE",
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Network response was not ok");
                            }
                            return response.json();
                        })
                        .then(() => {
                            // removing li element
                            ul.removeChild(li);
                        })
                        .catch((error) => {
                            console.error("Delete error:", error);
                        });
                });

                // adding a element and delete button inside li element
                li.appendChild(a);
                li.appendChild(deleteButton);
                ul.appendChild(li);
            });
        })
        .catch((error) => {
            console.error("There was a problem with the fetch operation:", error);
        });

}

// calling fetch data to import lists from json file
fetchData();

// showing popup after clicking on the "add new" button
addNewBtn.addEventListener("click", function () {
    popup.classList.remove("invisible");
});

// hiding popup after clicking on the close button
closeBtn.addEventListener("click", function () {
    popup.classList.add("invisible");
    newListName.value = "";
});




submitBtn.addEventListener("click", function () {

    const newListNameValue = newListName.value.trim(); // getting the new list name from the input field

    if (newListNameValue) {
        // hiding popup if input field is not empty
        popup.classList.add("invisible");
    }

    // creating data object to send to server
    const data = {
        name: newListNameValue
    };

    const userId = localStorage.getItem("userId");
    // adding new to do list
    fetch(`/newList/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(newList => {
            console.log("New list created:", newList);

        })
        .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
        });

    newListName.value = ""; // clearing input field
    fetchData(); // importing updated array of to do lists after adding new list

});


logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("userId");
    window.location.href = "/login";
});
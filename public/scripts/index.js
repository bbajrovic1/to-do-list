const registerButton = document.getElementById("registerButton");
const loginButton = document.getElementById("loginButton");

// adding event listeners
registerButton.addEventListener("click", () => {
    window.location.href = "/register"; // redirect to /register
});

loginButton.addEventListener("click", () => {
    window.location.href = "/login"; // redirect to /login
});
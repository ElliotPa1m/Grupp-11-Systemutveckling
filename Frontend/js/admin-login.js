const form = document.getElementById("login-form");
const error = document.getElementById("error");
const button = document.getElementById("login-button");
import { host } from "../variables";

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !password) {
    error.textContent = "Please fill in both fields.";
    return;
  }

  button.disabled = true;
  error.textContent = "";

  try {
    const response = await fetch(`${host}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({name, password})
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      error.textContent = data.error ?? "Login failed.";
      return;
    }

    localStorage.setItem("adminToken", data.token);
    window.location.href = "admin.html";
  } catch (err) {
    console.error(err);
    error.textContent = "Something went wrong. Please try again.";
  } finally {
    button.disabled = false;
  }
});
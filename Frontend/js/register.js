import { host } from "../variables";

const form = document.getElementById("register-form")
const errorMessage = document.getElementById("error-message")

form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const name = document.getElementById("register-name").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value

    try {
        const response = await fetch(`${host}/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({name, email, password})
        })

        const data = await response.json()
        if (!data.success) {
            errorMessage.textContent = data.error
            return
        }

        window.location.href = "login.html"
    } catch (error) {
        console.error(error)
        errorMessage.textContent = "Something went wrong. Please try again."
    }
})
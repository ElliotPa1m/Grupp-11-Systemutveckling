const form = document.getElementById("login-form")
const errorMessage = document.getElementById("error-message")

form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    try {
        const response = await fetch("http://localhost:3000/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password})
        })

        const data = await response.json()
        if (!data.success) {
            errorMessage.textContent = data.error
            return
        }

        localStorage.setItem("token", data.token)
        window.location.href = "index.html"

    } catch (error) {
        console.error(error)
        errorMessage.textContent = "Something went wrong. Please try again."
    }
})
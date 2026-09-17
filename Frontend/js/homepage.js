const productsContainer = document.getElementById("products-container")

const getUserTierId = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
        return 1
    }

    try {
        const response = await fetch("http://localhost:3000/api/users/me", {
            headers: {
                Authorization: "Bearer " + token
            }
        })

        const data = await response.json()

        if (!data.success) {
            return 1
        }

        return data.user.tier_id
    } catch (error) {
        console.error(error)
        return 1
    }
}

const loadProducts = async () => {
    try {
        const userTierId = await getUserTierId()

        const response = await fetch("http://localhost:3000/api/products")
        const products = await response.json()

        products.forEach((product) => {
            const productElement = document.createElement("div")
            
            const image = document.createElement("img")
            image.src = product.clothes_image || "placeholder.jpg"
            image.alt = product.name

            const text = document.createElement("p")
            text.textContent = product.name + " - $ " + product.price

            productElement.appendChild(image)
            productElement.appendChild(text)

            if (product.tier_id > userTierId) {
                productElement.title = "Upgrade your membership to view this product"
                productElement.style.opacity = "0.5"
            } else {
                productElement.style.cursor = "pointer"
                productElement.addEventListener("click", () => {
                    window.location.href = "detailed-product.html?id=" + product.id
                })
            }
            
            productsContainer.appendChild(productElement)
        })
    } catch (error) {
        console.error(error)
    }
}

loadProducts()
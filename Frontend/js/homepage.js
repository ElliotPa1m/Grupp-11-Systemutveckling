
import { host } from "../variables.js";
import { header } from "./header.js";

header();

const productsContainer = document.getElementById("products-container");

const getUserTierId = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return 1;
    }

    try {
        const response = await fetch(`${host}/api/users/me`, {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!response.ok) {
            return 1;
        }

        const data = await response.json();

        if (!data.success) {
            return 1;
        }

        return data.user.tier_id;
    } catch (error) {
        console.error("Could not load user tier:", error);
        return 1;
    }
};

// Show loading and error messages inside the products area
const showStatus = (title, message, showSpinner = false) => {
    productsContainer.replaceChildren();

    const status = document.createElement("div");
    status.className = "products-status";

    const heading = document.createElement("h2");
    heading.textContent = title;
    status.appendChild(heading);

    const description = document.createElement("p");
    description.textContent = message;
    status.appendChild(description);

    if (showSpinner) {
        const spinner = document.createElement("div");
        spinner.className = "products-spinner";
        status.appendChild(spinner);
    }

    productsContainer.appendChild(status);
};

const loadProducts = async () => {
    let loadingMessageTimer;
    let requestTimeout;
    let timedOut = false;

    showStatus(
        "Loading products...",
        "Please wait while we connect to the server.",
        true
    );

    // Change the message if the server takes a while to wake up
    loadingMessageTimer = setTimeout(() => {
        showStatus(
            "We're getting ready!",
            "The demo server is waking up. This can take up to a minute.",
            true
        );
    }, 8000);

    // Prevent the request from waiting forever
    const controller = new AbortController();

    requestTimeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, 90000);

    try {
        const userTierId = await getUserTierId();

        const response = await fetch(`${host}/api/products`, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Invalid products response");
        }

        clearTimeout(loadingMessageTimer);
        clearTimeout(requestTimeout);

        productsContainer.replaceChildren();

        if (products.length === 0) {
            showStatus(
                "No products available",
                "There are currently no products to display."
            );
            return;
        }

        products.forEach((product) => {
            const productElement = document.createElement("div");
            productElement.classList.add("product-card");

            const image = document.createElement("img");
            image.src = product.clothes_image_front || "placeholder.jpg";
            image.alt = product.name;
            image.style.width = "300px";

            const text = document.createElement("p");
            text.textContent = product.name + " - $ " + product.price;

            productElement.appendChild(image);
            productElement.appendChild(text);

            if (product.tier_id > userTierId) {
                image.classList.add("locked");

                const lockLabel = document.createElement("span");
                lockLabel.classList.add("lock-label");
                lockLabel.textContent =
                    product.tier_id === 2
                        ? "Plus membership"
                        : "Gold membership";

                productElement.appendChild(lockLabel);
            } else {
                productElement.style.cursor = "pointer";

                productElement.addEventListener("click", () => {
                    window.location.href = "/product?id=" + product.id;
                });
            }

            productsContainer.appendChild(productElement);
        });

    } catch (error) {
        clearTimeout(loadingMessageTimer);
        clearTimeout(requestTimeout);

        console.error("Could not load products:", error);

        showStatus(
            timedOut ? "Server is taking too long" : "Unable to load products",
            timedOut
                ? "The server did not respond in time. Please try again."
                : "The server may be waking up or temporarily unavailable. Please try again.",
            false
        );

        const retryButton = document.createElement("button");
        retryButton.className = "retry-button";
        retryButton.textContent = "Try again";
        retryButton.addEventListener("click", loadProducts);

        productsContainer
            .querySelector(".products-status")
            .appendChild(retryButton);
    }
};

loadProducts();

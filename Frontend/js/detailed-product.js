import { host } from "../variables.js";
import { header } from "./header.js"

header()

const params = new URLSearchParams(window.location.search)
const productId = params.get("id")

const productDetail = document.getElementById("product-detail")

let selectedPlacement = null
let selectedFrontPrintId = null
let selectedBackPrintId = null
let currentProduct = null
let userTierId = 1

const getUserTierId = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
        return 1
    }

    try {
        const response = await fetch(`${host}/api/users/me`, {
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

const updateOverlay = (shirtImage, printOverlay) => {
    if (!currentProduct) return

    if (!selectedPlacement) {
        shirtImage.src = currentProduct.clothes_image_front || "placeholder.jpg"
        printOverlay.style.display = "none"
        return
    }

    shirtImage.src = selectedPlacement === "front"
        ? currentProduct.clothes_image_front || "placeholder.jpg"
        : currentProduct.clothes_image_back || "placeholder.jpg"

    const activePrintId = selectedPlacement === "front" ? selectedFrontPrintId : selectedBackPrintId

    if (!activePrintId) {
        printOverlay.style.display = "none"
        return
    }

    const print = currentProduct.prints.find((p) => p.id === activePrintId)
    if (!print) {
        printOverlay.style.display = "none"
        return
    }

    if (selectedPlacement === "front") {
        printOverlay.src = print.small_print || "placeholder.jpg"
        printOverlay.style.display = "block"
        printOverlay.style.width = "30px"
        printOverlay.style.top = "140px"
        printOverlay.style.left = "180px"
    } else {
        printOverlay.src = print.back_print || "placeholder.jpg"
        printOverlay.style.display = "block"
        printOverlay.style.width = "150px"
        printOverlay.style.top = "110px"
        printOverlay.style.left = "175px"
    }
}

const loadProduct = async () => {
    try {
        userTierId = await getUserTierId()

        const response = await fetch(`${host}/api/products/` + productId)
        const product = await response.json()

        if (!response.ok) {
            productDetail.textContent = product.message || "Product not found"
            return
        }

        currentProduct = product

        const shirtPreview = document.createElement("div")
        shirtPreview.classList.add("shirt-preview")
        shirtPreview.style.position = "relative"

        const shirtImage = document.createElement("img")
        shirtImage.classList.add("shirt-preview-image")
        shirtImage.alt = product.name

        const printOverlay = document.createElement("img")
        printOverlay.classList.add("print-overlay")
        printOverlay.style.position = "absolute"
        printOverlay.style.display = "none"

        shirtPreview.appendChild(shirtImage)
        shirtPreview.appendChild(printOverlay)

        const name = document.createElement("h1")
        name.classList.add("product-name")
        name.textContent = product.name

        const price = document.createElement("h2")
        price.classList.add("product-price")
        price.textContent = "$ " + product.price

        const upgradePrint = document.createElement("h3")
        upgradePrint.textContent = "Become a higher tier member to add prints"

        const upgradeBack = document.createElement("h3")
        upgradeBack.textContent = "Become a Gold tier member to add back prints"

        const description = document.createElement("ul")
        description.classList.add("product-description")

        const descriptionText = product.description || ""
        const points = descriptionText
        .split("\n")
        .map((line) => line.replace(/^-\s*/, "").trim())
        .filter(Boolean)
        console.log(JSON.stringify(product.description))

        points.forEach((point) => {
            const li = document.createElement("li")
            li.textContent = point.trim()
            description.appendChild(li)
        })

        const errorMessage = document.createElement("p")
        errorMessage.classList.add("error-message")
        errorMessage.style.color = "red"

        const frontBtn = document.createElement("button")
        frontBtn.classList.add("placement-btn", "placement-btn--front")

        const backBtn = document.createElement("button")
        backBtn.classList.add("placement-btn", "placement-btn--back")

        const noPrintBtn = document.createElement("button")
        noPrintBtn.classList.add("no-print-btn")
        noPrintBtn.textContent = "No print"

        const setPlacementButtons = () => {
            frontBtn.textContent = "Add chest print" + (selectedFrontPrintId ? " ✓" : "")
            backBtn.textContent = "Add back print" + (selectedBackPrintId ? " ✓" : "")
            frontBtn.classList.toggle("placement-btn--active", selectedPlacement === "front")
            backBtn.classList.toggle("placement-btn--active", selectedPlacement === "back")
        }

        const markSelectedPrint = () => {
            const activePrintId = selectedPlacement === "front" ? selectedFrontPrintId : selectedBackPrintId
            document.querySelectorAll("[data-print-id]").forEach((el) => {
                el.style.border = Number(el.dataset.printId) === activePrintId
                    ? "2px solid black"
                    : "1px solid #ccc"
            })
        }

        const checkAccess = () => {
            const token = localStorage.getItem("token")

            if (!token) {
                errorMessage.textContent = "You need to be logged in to add a print"
                return false
            }

            if (userTierId < currentProduct.tier_id) {
                errorMessage.textContent = "Upgrade your membership to add a print to this product"
                return false
            }

            errorMessage.textContent = ""
            return true
        }

        frontBtn.addEventListener("click", () => {
            if (!checkAccess()) return

            selectedPlacement = "front"
            setPlacementButtons()
            markSelectedPrint()
            updateOverlay(shirtImage, printOverlay)
        })

        backBtn.addEventListener("click", () => {

            if (userTierId !==3) {
                errorMessage.textContent = "Back print is only available for Gold members"
                return
            }

            if (!checkAccess()) return
            
            selectedPlacement = "back"
            setPlacementButtons()
            markSelectedPrint()
            updateOverlay(shirtImage, printOverlay)
        })

        noPrintBtn.addEventListener("click", () => {
            if (selectedPlacement === "front") {
                selectedFrontPrintId = null
            } else {
                selectedBackPrintId = null
            }

            setPlacementButtons()
            markSelectedPrint()
            updateOverlay(shirtImage, printOverlay)
        })

        const quantityInput = document.createElement("input")
        quantityInput.classList.add("quantity-input")
        quantityInput.type = "number"
        quantityInput.min = "1"
        quantityInput.value = "1"

        const addToCartBtn = document.createElement("button")
        addToCartBtn.classList.add("add-to-cart-btn")
        addToCartBtn.textContent = "Add to cart"

        const cartMessage = document.createElement("p")
        cartMessage.classList.add("cart-message")

        addToCartBtn.addEventListener("click", () => {
            const hasPrint = selectedFrontPrintId !== null || selectedBackPrintId !== null
            const token = localStorage.getItem("token")

            if (hasPrint && !token) {
                window.location.href = "/login"
                return
            }

            const quantity = Number(quantityInput.value)

            if (!Number.isInteger(quantity) || quantity < 1) {
                cartMessage.textContent = "Please enter a valid quantity"
                return
            }
            
            const cartItem = {
                productId: currentProduct.id,
                productName: currentProduct.name,
                productImg: currentProduct.clothes_image_front,
                quantity,
                price: currentProduct.price,
                frontPrintId: selectedFrontPrintId,
                backPrintId: selectedBackPrintId
            }

            const cart = JSON.parse(localStorage.getItem("cart") || "[]")
            cart.push(cartItem)
            localStorage.setItem("cart", JSON.stringify(cart))

            cartMessage.textContent = "Added to cart"

        })

        const detailsWrapper = document.createElement("div")
        detailsWrapper.classList.add("product-details-wrapper")

        detailsWrapper.appendChild(shirtPreview)

        const infoColumn = document.createElement("div")
        infoColumn.classList.add("product-info")
        infoColumn.appendChild(name)
        infoColumn.appendChild(price)

        if (userTierId === 1) {
            infoColumn.appendChild(upgradePrint)
        }

        if (userTierId === 2) {
            infoColumn.appendChild(upgradeBack)
        }

        infoColumn.appendChild(description)
        infoColumn.appendChild(quantityInput)
        infoColumn.appendChild(addToCartBtn)
        infoColumn.appendChild(cartMessage)

        detailsWrapper.appendChild(infoColumn)

        const printsSection = document.createElement("div")
        printsSection.classList.add("prints-section")

        printsSection.appendChild(errorMessage)
        printsSection.appendChild(frontBtn)
        printsSection.appendChild(backBtn)
        printsSection.appendChild(noPrintBtn)

        if (userTierId === 1) {
            printsSection.style.display = "none"
        }

        const pageLayout = document.createElement("div")
        pageLayout.classList.add("page-layout")

        pageLayout.appendChild(detailsWrapper)
        pageLayout.appendChild(printsSection)

        productDetail.appendChild(pageLayout)

        setPlacementButtons()
        updateOverlay(shirtImage, printOverlay)

        const printsContainer = document.createElement("div")
        printsContainer.id = "prints-container"

        product.prints.forEach((print) => {
            const printOption = document.createElement("div")
            printOption.classList.add("print-option")
            printOption.style.cursor = "pointer"
            printOption.style.border = "1px solid #ccc"
            printOption.dataset.printId = print.id

            const printImage = document.createElement("img")
            printImage.src = print.small_print || print.back_print || "placeholder.jpg"
            printImage.alt = print.name
            printImage.style.width = "60px"

            printOption.appendChild(printImage)

            printOption.addEventListener("click", () => {
                if (!selectedPlacement) {
                    errorMessage.textContent = "Please choose chest or back print first"
                    return
                }
                
                if (!checkAccess()) return

                if (selectedPlacement === "front") {
                    selectedFrontPrintId = print.id
                } else {
                    selectedBackPrintId = print.id
                }

                setPlacementButtons()
                markSelectedPrint()
                updateOverlay(shirtImage, printOverlay)
            })

            printsContainer.appendChild(printOption)
        })

        printsSection.appendChild(printsContainer)

    } catch (error) {
        console.error(error)
        productDetail.textContent = "Something went wrong. Please try again"
    }
}

loadProduct()
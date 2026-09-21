import { header } from "./header.js"

header()

const params = new URLSearchParams(window.location.search)
const productId = params.get("id")

const productDetail = document.getElementById("product-detail")

let selectedPlacement = "front"
let selectedFrontPrintId = null
let selectedBackPrintId = null
let currentProduct = null

const updateOverlay = (shirtImage, printOverlay) => {
    if (!currentProduct) return

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
        printOverlay.style.top = "105px"
        printOverlay.style.left = "130px"
    } else {
        printOverlay.src = print.back_print || "placeholder.jpg"
        printOverlay.style.display = "block"
        printOverlay.style.width = "150px"
        printOverlay.style.top = "90px"
        printOverlay.style.left = "125px"
    }
}

const loadProduct = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/products/" + productId)
        const product = await response.json()

        if (!response.ok) {
            productDetail.textContent = product.message || "Product not found"
            return
        }

        currentProduct = product

        const shirtPreview = document.createElement("div")
        shirtPreview.style.position = "relative"
        shirtPreview.style.width = "300px"

        const shirtImage = document.createElement("img")
        shirtImage.style.width = "400px"
        shirtImage.alt = product.name

        const printOverlay = document.createElement("img")
        printOverlay.style.position = "absolute"
        printOverlay.style.display = "none"

        shirtPreview.appendChild(shirtImage)
        shirtPreview.appendChild(printOverlay)

        const name = document.createElement("h1")
        name.textContent = product.name

        const price = document.createElement("p")
        price.textContent = "$ " + product.price

        const description = document.createElement("p")
        description.textContent = product.description || ""

        const frontBtn = document.createElement("button")
        const backBtn = document.createElement("button")

        const setPlacementButtons = () => {
            frontBtn.textContent = "Add chest print" + (selectedFrontPrintId ? " ✓" : "")
            backBtn.textContent = "Add back print" + (selectedBackPrintId ? " ✓" : "")
            frontBtn.style.border = selectedPlacement === "front" ? "2px solid black" : "none"
            backBtn.style.border = selectedPlacement === "back" ? "2px solid black" : "none"
        }

        const markSelectedPrint = () => {
            const activePrintId = selectedPlacement === "front" ? selectedFrontPrintId : selectedBackPrintId
            document.querySelectorAll("[data-print-id]").forEach((el) => {
                el.style.border = Number(el.dataset.printId) === activePrintId
                    ? "2px solid black"
                    : "1px solid #ccc"
            })
        }

        frontBtn.addEventListener("click", () => {
            selectedPlacement = "front"
            setPlacementButtons()
            markSelectedPrint()
            updateOverlay(shirtImage, printOverlay)
        })

        backBtn.addEventListener("click", () => {
            selectedPlacement = "back"
            setPlacementButtons()
            markSelectedPrint()
            updateOverlay(shirtImage, printOverlay)
        })

        productDetail.appendChild(shirtPreview)
        productDetail.appendChild(name)
        productDetail.appendChild(price)
        productDetail.appendChild(description)
        productDetail.appendChild(frontBtn)
        productDetail.appendChild(backBtn)

        setPlacementButtons()
        updateOverlay(shirtImage, printOverlay)

        const printsContainer = document.createElement("div")

        product.prints.forEach((print) => {
            const printOption = document.createElement("div")
            printOption.style.cursor = "pointer"
            printOption.style.border = "1px solid #ccc"
            printOption.dataset.printId = print.id

            const printImage = document.createElement("img")
            printImage.src = print.small_print || print.back_print || "placeholder.jpg"
            printImage.alt = print.name
            printImage.style.width = "60px"

            const printName = document.createElement("p")
            printName.textContent = print.name

            printOption.appendChild(printImage)
            printOption.appendChild(printName)

            printOption.addEventListener("click", () => {
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

        productDetail.appendChild(printsContainer)

    } catch (error) {
        console.error(error)
        productDetail.textContent = "Something went wrong. Please try again"
    }
}

loadProduct()
import { header } from "./header.js"

header()

const params = new URLSearchParams(window.location.search)
const productId = params.get("id")

console.log(productId)
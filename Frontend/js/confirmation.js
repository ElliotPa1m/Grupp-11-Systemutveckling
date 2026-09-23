import { header } from "./header.js";

header();

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");
const orderNumber = document.querySelector("#order-number");

if (orderId && /^\d+$/.test(orderId)) {
    orderNumber.textContent = `#${orderId}`;
} else {
    orderNumber.textContent = "unavailable";
}
import { header } from "./header.js";

header();

const customerName = document.querySelector("#customer-name");
const customerEmail = document.querySelector("#customer-email");
const customerTier = document.querySelector("#customer-tier");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");
const placeOrderButton = document.querySelector("#place-order-button");

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "./login.html";
}

async function loadCustomerInformation() {
  try {
    const [userResponse, tiersResponse] = await Promise.all([
      fetch("http://localhost:3000/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),

      fetch("http://localhost:3000/api/tiers"),
    ]);

    if (userResponse.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "./login.html";
      return;
    }

    if (!userResponse.ok || !tiersResponse.ok) {
      throw new Error("Could not load customer information");
    }

    const userData = await userResponse.json();
    const tiers = await tiersResponse.json();

    const user = userData.user;

    const userTier = tiers.find(
      (tier) => tier.id === user.tier_id
    );

    customerName.textContent = user.name;
    customerEmail.textContent = user.email;
    customerTier.textContent =
      userTier?.name ?? "Unknown membership";
  } catch (error) {
    console.error("Could not load customer:", error);

    checkoutMessage.textContent =
      "Could not load your customer information.";
  }
}

function getCartItems() {
  try {
    const savedCart = localStorage.getItem("cart");
    const parsedCart = JSON.parse(savedCart ?? "[]");

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    return [];
  }
}

function prepareReceiptCart(cartItems) {
  return cartItems.flatMap((item) => {
    const quantity = Number(item.quantity ?? 1);

    const printIds = [
      item.frontPrintId,
      item.backPrintId,
    ].filter((printId) => printId != null);

    return Array.from(
      { length: quantity },
      () => ({
        productId: item.productId,
        printIds,
      })
    );
  });
}

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    checkoutMessage.textContent =
      "Your shopping cart is empty.";
    return;
  }

  const receiptCart = prepareReceiptCart(cartItems);

  placeOrderButton.disabled = true;
  checkoutMessage.textContent = "Processing your order...";

  try {
    const response = await fetch(
      "http://localhost:3000/api/receipts",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          cart: receiptCart,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      checkoutMessage.textContent =
        result.error ?? "Could not place order";

      placeOrderButton.disabled = false;
      return;
    }

    localStorage.removeItem("cart");

    window.location.href =
      `./confirmation.html?type=order&id=${result.data.id}`;
  } catch (error) {
    console.error("Checkout failed:", error);

    checkoutMessage.textContent =
      "Something went wrong. Please try again.";

    placeOrderButton.disabled = false;
  }
});

loadCustomerInformation();
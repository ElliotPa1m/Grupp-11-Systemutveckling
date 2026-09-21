import { header } from "./header.js";

header();

const emptyCart = document.querySelector("#empty-cart");
const cartContent = document.querySelector("#cart-content");
const cartItemsContainer = document.querySelector("#cart-items");
const subtotalElement = document.querySelector("#subtotal");
const totalPriceElement = document.querySelector("#total-price");
const checkoutLink = document.querySelector("#checkout-link");

let cartItems = getCartItems();

function getCartItems() {
    try {
        const savedCart = localStorage.getItem("cart");
        const parsedCart = JSON.parse(savedCart ?? "[]");

        return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
        return [];
    }
}

function saveCartItems() {
  localStorage.setItem("cart", JSON.stringify(cartItems));
}

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}


function renderCart() {
  const cartIsEmpty = cartItems.length === 0;

  emptyCart.hidden = !cartIsEmpty;
  cartContent.hidden = cartIsEmpty;

  if (cartIsEmpty) {
    cartItemsContainer.innerHTML = "";
    subtotalElement.textContent = "$0.00";
    totalPriceElement.textContent = "$0.00";
    return;
  }

  cartItemsContainer.innerHTML = cartItems
    .map((item, index) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity ?? 1);
      const itemTotal = price * quantity;

      return `
        <article class="cart-item">
          <img
            src="${item.image}"
            alt="${item.name}"
            class="cart-item__image"
          >

          <div class="cart-item__information">
            <h2 class="cart-item__name">
              ${item.name}
            </h2>

            <p>
              Selected print:
              ${item.printOption ?? "No print"}
            </p>

            <p>
              Quantity: ${quantity}
            </p>

            <strong>
              ${formatPrice(itemTotal)}
            </strong>
          </div>

          <button
            type="button"
            class="cart-item__remove"
            data-remove-index="${index}"
            aria-label="Remove ${item.name} from shopping cart"
          >
            <span
              class="material-symbols-rounded"
              aria-hidden="true"
            >
              delete
            </span>
          </button>
        </article>
      `;
    })
    .join("");

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity ?? 1);

    return sum + price * quantity;
  }, 0);

  subtotalElement.textContent = formatPrice(subtotal);
  totalPriceElement.textContent = formatPrice(subtotal);

  addRemoveButtonListeners();
}

function addRemoveButtonListeners() {
  const removeButtons = document.querySelectorAll(
    "[data-remove-index]"
  );

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const itemIndex = Number(button.dataset.removeIndex);

      cartItems.splice(itemIndex, 1);
      saveCartItems();
      renderCart();
    });
  });
}

checkoutLink.addEventListener("click", (event) => {
  const token = localStorage.getItem("token");

  if (!token) {
    event.preventDefault();
    window.location.href = "./login.html";
  }
});

renderCart();
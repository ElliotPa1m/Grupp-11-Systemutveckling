const container = document.getElementById('container');
const error = document.getElementById("error");
const logoutButton = document.getElementById("logout-button");
const token = localStorage.getItem("adminToken");
import { host } from "../variables";

logoutButton.addEventListener("click", () => {
  localStorage.removeItem('adminToken');
  window.location.href = "admin-login.html";
});

const getProducts = async () => {
  try {
    const response = await fetch(`${host}/api/products/`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    error.textContent = "Something went wrong. Please try again.";
  }
};

const displayProducts = (products) => {
  let content = "";

  products.forEach(product => {
    content += `
    <div class="product-card">
      <div class="img-container">
        <img src="${product.clothes_image_front}" alt="${product.name}"/>
      </div>
      <div class="product-info">
        <p> ${product.name} </p>
        <p> Price <span>$${product.price}</span></p>
        <p> Tier <span>${product.tier_id}</span></p>
      </div>
    </div>`
  });

  container.innerHTML = content;
};

const loadContent = async () => {
  const products = await getProducts();
  if (!products) return;
  displayProducts(products);
};

const init = () => {
  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }
  loadContent();
};

init();
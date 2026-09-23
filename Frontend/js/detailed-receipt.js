import { header } from "./header.js";
import { formatDate } from "./receipt.js";

header();

const container = document.getElementById('receipt-container');
const error = document.getElementById("error");
const token = localStorage.getItem('token');
let content = "";

const getReceipt = async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    const response = await fetch(`http://localhost:3000/api/receipts/${type}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (!response.ok || !data.success) {
      error.textContent = data.error ?? "Something went wrong. Please try again";
      return;
    }

    return data.data;
  } catch (err) {
    console.error(err);
    error.textContent = "Something went wrong. Please try again";
  }
};

const displayOrderReceipt = (receipt) => {
  const products = receipt.products.map(p => `
    <div class="receipt-item">
      <div class="receipt-item-row">
        <span class="receipt-item-name">${p.product_name}</span>
        <span class="receipt-item-price">$${p.price}</span>
      </div>

      ${p.prints?.length
        ? `<ul class="receipt-prints">
            ${p.prints.map(pr => `<li>+ Print: ${pr.print_name}</li>`).join("")}
          </ul>`
        : ""}
    </div>
    `).join("");
  content += `
    <article class="receipt-card">
      <div class="receipt-header">
        <h1 class="receipt-title">Receipt · Order</h1>
        <p class="receipt-date">${formatDate(receipt.date)}</p>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-items">
        ${products}
      </div>

      <div class="receipt-divider"></div>
    
      <div class="receipt-total-row">
        <span>Total</span>
        <span>$${receipt.total_price}</span>
      </div>

      <div class="receipt-footer">
        <p>Thank you for your purchase!</p>
      </div>
    </article>
  `;

  container.innerHTML = content;
};

const displayTierReceipt = (receipt) => {
  content += `
    <article class="receipt-card">
      <div class="receipt-header">
        <h1 class="receipt-meta">Kvitto · Tier Change</h1>
        <p class="receipt-date">${formatDate(receipt.date)}</p>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-items">
        <div class="receipt-item-row">
          <span class="receipt-item-name">Changed To</span>
          <span class="receipt-item-price">${receipt.tier}</span>
        </div>
      </div>

      <div class="receipt-divider"></div>
      
      <div class="receipt-total-row">
        <span>Total</span>
        <span>$${receipt.total_price}</span>
      </div>
    </article>
  `;

  container.innerHTML = content;
};

const loadContent = async () => {
  const receipt = await getReceipt();
  if (!receipt) return;

  if (receipt.type === 'order') {
    displayOrderReceipt(receipt);
  } else if (receipt.type === 'tier') {
    displayTierReceipt(receipt);
  }
};

const init = () => {
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  loadContent();
};

init();
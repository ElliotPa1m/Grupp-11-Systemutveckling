import { header } from "./header.js";
import { host } from "../variables";

header();

const container = document.getElementById('receipt-container');
const error = document.getElementById("error");
const token = localStorage.getItem('token');
let content = "";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getReceipt = async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    const response = await fetch(`${host}/api/receipts/${type}/${id}`, {
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

const groupReceiptItems = (products) => {
  const groups = new Map();

  for (const p of products) {
    const printKey = (p.prints ?? [])
      .map(pr => pr.print_name)
      .sort()
      .join("|");
    const key = `${p.product_name}::${printKey}`;

    if (groups.has(key)) {
      const group = groups.get(key);
      group.quantity += 1;
      group.totalPrice += Number(p.price);
    } else {
      groups.set(key, {
        product_name: p.product_name,
        prints: p.prints,
        quantity: 1,
        totalPrice: Number(p.price),
      });
    }
  }

  return Array.from(groups.values());
}

const displayOrderReceipt = (receipt) => {
  const products = groupReceiptItems(receipt.products).map(p => `
    <div class="receipt-item">
      <div class="receipt-item-row">
      <span class="receipt-item-name">
        ${p.product_name}${p.quantity > 1 ? ` × ${p.quantity}` : ""}
      </span>
      <span class="receipt-item-price">$${p.totalPrice.toFixed(2)}</span>
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
        <span>$${receipt.total_price.toFixed(2)}</span>
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
        <h1 class="receipt-title">Kvitto · Tier Change</h1>
        <p class="receipt-date">${formatDate(receipt.date)}</p>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-items">
        <div class="receipt-item-row">
          <span class="receipt-item-name">Changed To</span>
          <span class="receipt-item-tier">${receipt.tier}</span>
        </div>
      </div>

      <div class="receipt-divider"></div>
      
      <div class="receipt-total-row">
        <span>Total</span>
        <span>$${receipt.total_price.toFixed(2)}</span>
      </div>
      <div class="receipt-footer">
        <p>Thank you for your support!</p>
      </div>
    </article>
  `;

  container.innerHTML = content;
};

const loadContent = async () => {
  const result = await getReceipt();
  if (!result) return;
  const receipt = result.data;

  if (result.type === 'order') {
    displayOrderReceipt(receipt);
  } else if (result.type === 'tier') {
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
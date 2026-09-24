import { header } from "./header.js";

header();

const container = document.getElementById('receipt-container');
const error = document.getElementById("error");
const token = localStorage.getItem('token');

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getReceipts = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/receipts/", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data =  await response.json();

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

const displayReceipts = (receipts) => {
  let content = "";

  receipts.forEach(receipt => {
    content += `
    <a href="detailed-receipt.html?type=${receipt.type}&id=${receipt.data.id}" class="receipt-card">
      <div class="receipt-info">
        <p class="receipt-type">${receipt.type}</p>
        <p class="receipt-date">${formatDate(receipt.data.date)}</p>
        <p class="receipt-price"><span>Total price</span> $${receipt.data.total_price}</p>
      </div>
    </a>`
  });

  container.innerHTML = content;
};

const loadContent = async () => {
  const receipts = await getReceipts();
  if (!receipts) return;
  displayReceipts(receipts);
};

const init = () => {
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  loadContent();
};

init();
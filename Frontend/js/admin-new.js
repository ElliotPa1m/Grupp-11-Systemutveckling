const form = document.getElementById("add-product-form");
const button = document.getElementById("add-button");
const message = document.getElementById("form-message")
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "admin-login.html";
}

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

const showError = (text) => {
  message.textContent = text;
  message.className = "form-message error";
};

const showSuccess = (text) => {
  message.textContent = text;
  message.className = "form-message success";
};

const clearMessage = () => {
  message.textContent = "";
  message.className = "form-message";
};

const validateImageFile = (file) => {
  if (!file) return false;
  if (!allowedTypes.includes(file.type)) {
    showError("Only PNG, JPEG or WEBP images are allowed");
    return false;
  }
  return true;
}

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "product_images");

  const response = await fetch("https://api.cloudinary.com/v1_1/h8v4zfyn/image/upload", {
    method: "POST",
    body: formData
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Image upload failed");
  }
  return data.secure_url;
}

const bindFileInput = (inputId, nameSpanId) => {
  const input = document.getElementById(inputId);
  const nameSpan = document.getElementById(nameSpanId);

  input.addEventListener('change', () => {
    nameSpan.textContent = input.files.length
      ? input.files[0].name
      : 'No file chosen';
  });
};

bindFileInput('front-url', 'front-url-name');
bindFileInput('back-url', 'back-url-name');

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const name = document.getElementById("name").value;
  const inputPrice = document.getElementById("price").value;
  const tier = document.getElementById("tier-select").value;
  const frontFile = document.getElementById("front-url").files[0];
  const backFile = document.getElementById("back-url").files[0];
  const description = document.getElementById("description").value || null;

  if (!name || !inputPrice || !tier || !backFile || !frontFile) {
    showError("Please fill in all required fields.");
    return;
  }

  const price = Number(inputPrice);
  const tier_id = Number(tier);

  if (!validateImageFile(frontFile) || !validateImageFile(backFile)) {
    return;
  }
  
  if (price <= 0) {
    showError("Price has to be more than 0")
    return;
  }

  if (tier_id === 0) {
    showError("Please select a tier");
    return;
  }

  button.disabled = true;

  try {
    const clothes_image_back = await uploadToCloudinary(backFile);
    const clothes_image_front = await uploadToCloudinary(frontFile);

    const response = await fetch("http://localhost:3000/api/products/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({name, price, tier_id, clothes_image_front, clothes_image_back, description})
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message ?? "Something went wrong. Please try again.");
      return;
    }

    showSuccess("Product added successfully!");
    form.reset();
  } catch (err) {
    console.error(err);
    showError("Something went wrong. Please try again.");
  } finally {
    button.disabled = false;
  }
});
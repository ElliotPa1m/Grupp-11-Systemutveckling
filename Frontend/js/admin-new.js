const form = document.getElementById("add-product-form");
const button = document.getElementById("add-button");
const error = document.getElementById("error");
const success = document.getElementById("success");
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "admin-login.html";
}

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

const validateImageFile = (file) => {
  if (!file) return false;
  if (!allowedTypes.includes(file.type)) {
    error.textContent = "Only PNG, JPEG or WEBP images are allowed";
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const inputPrice = document.getElementById("price").value;
  const tier = document.getElementById("tier-select").value;
  const frontFile = document.getElementById("front-url").files[0];
  const backFile = document.getElementById("back-url").files[0];
  const description = document.getElementById("description").value || null;

  if (!name || !inputPrice || !tier || !backFile || !frontFile) {
    error.textContent = "Please fill in all required fields.";
    return;
  }

  const price = Number(inputPrice);
  const tier_id = Number(tier);

  if (!validateImageFile(frontFile) || !validateImageFile(backFile)) {
    return;
  }
  
  if (price <= 0) {
    error.textContent = "Price has to be more than 0";
    return;
  }

  if (tier_id === 0) {
    error.textContent = "Please select a tier";
    return;
  }

  button.disabled = true;
  error.textContent = "";

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
      error.textContent = data.message ?? "Something went wrong. Please try again.";
      return;
    }

    form.reset();
    success.textContent = "Product added successfully!";
  } catch (err) {
    console.error(err);
    error.textContent = "Something went wrong. Please try again.";
  } finally {
    button.disabled = false;
  }
});
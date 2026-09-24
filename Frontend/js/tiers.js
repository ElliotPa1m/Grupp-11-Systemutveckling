import { header } from "./header.js";

header();

let selectedTier = null;

const tiersContainer = document.querySelector("#tiers");

const tierInformation = {
    standard: {
        icon: "checkroom",
        description: "A simple way to get started.",
        benefits: [
            "Access to selected products",
            "Shop products without custom prints",
        ],
    },

    plus: {
        icon: "add_circle",
        description: "More products and more ways to customize.",
        benefits: [
            "Everything included in Standard",
            "Access to an expanded product selection",
            "Add a custom chest print",
        ],
    },

    gold: {
        icon: "workspace_premium",
        description: "Full access and maximum customization.",
        benefits: [
            "Everything included in Plus",
            "Access to all products",
            "Add custom prints to the chest and back",
        ],
    },
};

function formatPrice(price) {
    const numberPrice = Number(price);

    if (numberPrice === 0) {
        return "Free";
    }

    return `$${numberPrice.toFixed(2)} / month`;
}

async function getCurrentTierId() {
    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    const response = await fetch("http://localhost:3000/api/users/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    return Number(data.user.tier_id);
}

function createTierCard(tier, currentTierId) {
    const tierName = tier.name.toLowerCase();
    const isCurrentTier = Number(tier.id) === currentTierId;

    const information = tierInformation[tierName] ?? {
        icon: "checkroom",
        description: "Explore this membership.",
        benefits: [],
    };

    return `
        <article class="tier-card ${isCurrentTier ? "tier-card--current" : ""}">
            <span class="material-symbols-rounded tier-icon" aria-hidden="true">
                ${information.icon}
            </span>

            <h2>${tier.name}</h2>

            <p class="tier-price">${formatPrice(tier.price)}</p>

            <p class="tier-description">${information.description}</p>

            <ul class="tier-benefits">
                ${information.benefits.map((benefit) => `
                    <li>
                        <span class="material-symbols-rounded" aria-hidden="true">check</span>
                        ${benefit}
                    </li>
                `).join("")}
            </ul>

            <button type="button" class="tier-button" data-tier-id="${tier.id}">
                ${isCurrentTier ? "Current membership" : `Choose ${tier.name}`}
            </button>
        </article>
    `;
}

function addTierSelectionListeners(tiers, currentTierId) {
    const tierButtons = document.querySelectorAll(".tier-button[data-tier-id]");
    const continueButton = document.querySelector("#continue-to-payment");
    const paymentDialog = document.querySelector("#tier-payment-dialog");
    const reviewTierName = document.querySelector("#review-tier-name");
    const reviewTierPrice = document.querySelector("#review-tier-price");
    const paymentMessage = document.querySelector("#tier-payment-message");
    const cancelPaymentButton = document.querySelector("#cancel-tier-payment");
    const confirmPaymentButton = document.querySelector("#confirm-tier-payment");
    const successDialog = document.querySelector("#tier-success-dialog");
    const successReceipt = document.querySelector("#tier-success-receipt");
    const closeSuccessButton = document.querySelector("#close-tier-success");

    tierButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedTierId = Number(button.dataset.tierId);

            document.querySelectorAll(".tier-card").forEach((card) => {
                card.classList.remove("tier-card--selected");
            });

            if (selectedTierId === currentTierId) {
                selectedTier = null;
                continueButton.hidden = true;
                return;
            }

            selectedTier = tiers.find((tier) => {
                return Number(tier.id) === selectedTierId;
            });

            if (!selectedTier) {
                return;
            }

            button.closest(".tier-card").classList.add("tier-card--selected");

            continueButton.hidden = false;
            continueButton.textContent = `Continue with ${selectedTier.name}`;
        });
    });

    continueButton.addEventListener("click", () => {
        if (!selectedTier) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "./login.html";
            return;
        }

        reviewTierName.textContent = selectedTier.name;
        reviewTierPrice.textContent = formatPrice(selectedTier.price);
        paymentMessage.textContent = "";

        paymentDialog.showModal();
    });

    cancelPaymentButton.addEventListener("click", () => {
        paymentDialog.close();
    });

    closeSuccessButton.addEventListener("click", () => {
        successDialog.close();
    });

    successDialog.addEventListener("close", () => {
        renderTiers();
    });

    confirmPaymentButton.addEventListener("click", async () => {
        const token = localStorage.getItem("token");

        if (!selectedTier || !token) {
            return;
        }

        confirmPaymentButton.disabled = true;
        paymentMessage.textContent = "Processing your membership...";

        try {
            const response = await fetch("http://localhost:3000/api/tiers/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tierId: Number(selectedTier.id),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message ?? "Could not update membership");
            }

            paymentDialog.close();

            successReceipt.textContent = data.receipt.id;
            successDialog.showModal();
            
        } catch (error) {
            console.error("Could not update membership:", error);

            paymentMessage.textContent =
                error instanceof Error
                    ? error.message
                    : "Could not update membership. Please try again.";

            confirmPaymentButton.disabled = false;
        }
    });
}

async function renderTiers() {
    selectedTier = null;

    tiersContainer.innerHTML = `
        <p class="tiers-message">Loading memberships...</p>
    `;

    try {
        const [tiersResponse, currentTierId] = await Promise.all([
            fetch("http://localhost:3000/api/tiers"),
            getCurrentTierId(),
        ]);

        if (!tiersResponse.ok) {
            throw new Error("Could not load memberships");
        }

        const tiers = await tiersResponse.json();

        tiersContainer.innerHTML = `
            <section class="tiers-introduction">
                <h1>Choose your membership</h1>
                <p>Select the membership that best fits your style.</p>
            </section>

            <section class="tiers-list" aria-label="Available memberships">
                ${tiers.map((tier) => createTierCard(tier, currentTierId)).join("")}
            </section>

            <div class="tier-selection-actions">
                <button type="button" id="continue-to-payment" class="continue-to-payment" hidden>
                    Continue to payment
                </button>
            </div>

            <dialog id="tier-payment-dialog" class="tier-payment-dialog">
                <div class="tier-payment-content">
                    <button type="button" id="cancel-tier-payment" class="tier-dialog-close" aria-label="Close payment review">
                        <span class="material-symbols-rounded" aria-hidden="true">close</span>
                    </button>
                    <h2>Review your membership</h2>

                    <dl>
                        <div>
                            <dt>Membership</dt>
                            <dd id="review-tier-name"></dd>
                        </div>

                        <div>
                            <dt>Price</dt>
                            <dd id="review-tier-price"></dd>
                        </div>

                        <div>
                            <dt>Payment method</dt>
                            <dd>Invoice by email</dd>
                        </div>
                    </dl>

                    <p>
                        This is a simulated payment. The invoice will be sent
                        to your registered email address.
                    </p>

                    <p id="tier-payment-message" class="tiers-message" aria-live="polite"></p>

                    <div class="tier-payment-actions">
                        <button type="button" id="confirm-tier-payment" class="tier-button">
                            Confirm membership
                        </button>
                    </div>
                </div>
            </dialog>

            <dialog id="tier-success-dialog" class="tier-success-dialog">
                <div class="tier-success-content">
                        <button type="button" id="close-tier-success" class="tier-dialog-close" aria-label="Close confirmation">
                            <span class="material-symbols-rounded" aria-hidden="true">close</span>
                        </button>

                    <svg class="confirmation-icon" viewBox="0 0 64 64" role="img" aria-label="Success">
                        <circle class="confirmation-icon__background" cx="32" cy="32" r="30"></circle>
                        <circle class="confirmation-icon__circle" cx="32" cy="32" r="23"></circle>
                        <path class="confirmation-icon__check" d="M21 33 L28 40 L43 23"></path>
                    </svg>

                    <h2>Membership updated</h2>

                    <p>
                        Your receipt number is
                        <strong id="tier-success-receipt"></strong>.
                    </p>
                </div>
            </dialog>

            <p id="tiers-message" class="tiers-message" aria-live="polite"></p>
        `;

        addTierSelectionListeners(tiers, currentTierId);
    } catch (error) {
        console.error("Could not load memberships:", error);

        tiersContainer.innerHTML = `
            <p class="tiers-message tiers-message--error">
                Could not load memberships. Please try again.
            </p>
        `;
    }
}

renderTiers();
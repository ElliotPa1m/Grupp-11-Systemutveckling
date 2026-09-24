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
    const tierButtons = document.querySelectorAll(".tier-button");
    const continueButton = document.querySelector("#continue-to-payment");

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

        console.log("Continue with:", selectedTier);
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
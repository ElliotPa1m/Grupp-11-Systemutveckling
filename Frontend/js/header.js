import { host } from "../variables.js";

export function header() {
    const headerContainer = document.querySelector("#header");

    if (!headerContainer) {
        return;
    }

    const token = localStorage.getItem("token");

    const accountElement = token
        ? `
            <button type="button" id="logout-button" class="header-action" aria-label="Log out" title="Log out">
                <span class="material-symbols-rounded" aria-hidden="true">
                    logout
                </span>
            </button>

            <div class="header-menu">
                <button type="button" id="profile-menu-button" class="header-action" aria-label="Open profile menu" aria-expanded="false" aria-haspopup="true" aria-controls="profile-menu">
                    <span class="material-symbols-rounded" aria-hidden="true">
                        person
                    </span>
                </button>

                <nav id="profile-menu" class="header-dropdown" aria-label="Profile menu">
                    <a href="./receipt.html">Receipts</a>
                    <a href="./tiers.html">Memberships</a>
                </nav>
            </div>
        `
        : `
            <a href="./login.html" class="header-action" aria-label="Log in" title="Log in">
                <span class="material-symbols-rounded" aria-hidden="true">
                    login
                </span>
            </a>
        `;

    headerContainer.innerHTML = `
        <header class="site-header">
            <a href="./homepage.html" class="logo">
                <img src="../assets/logo/primary.webp" alt="Shirt lab">
            </a>

            <div class="header-actions">
                ${accountElement}

                <a href="./cart.html" class="header-action" aria-label="Open shopping cart" title="Shopping cart">
                    <span class="material-symbols-rounded" aria-hidden="true">
                        local_mall
                    </span>
                </a>
            </div>
        </header>
    `;

    const logoImage =
        headerContainer.querySelector(".logo img");

    async function updateLogoForTier() {
        if (!token || !logoImage) {
            return;
        }

        try {
            const response = await fetch(`${host}/api/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const userTierId = Number(data.user.tier_id);

            if (userTierId === 3) {
                logoImage.src = "../assets/logo/gold.webp";
            }
        } catch (error) {
            console.error("Could not update header logo:", error);
        }
    }

    updateLogoForTier();

    const headerLinks =
        headerContainer.querySelectorAll(".header-action[href]");

    headerLinks.forEach((link) => {
        const linkPath = new URL(link.href).pathname;

        if (linkPath === window.location.pathname) {
            link.setAttribute("aria-current", "page");
        }
    });

    const profileMenu =
        headerContainer.querySelector(".header-menu");

    const profileMenuButton =
        headerContainer.querySelector("#profile-menu-button");

    profileMenuButton?.addEventListener("click", () => {
        const menuIsOpen =
            profileMenuButton.getAttribute("aria-expanded") === "true";

        profileMenuButton.setAttribute(
            "aria-expanded",
            String(!menuIsOpen)
        );

        profileMenu?.classList.toggle(
            "header-menu--open",
            !menuIsOpen
        );
    });

    const logoutButton =
        headerContainer.querySelector("#logout-button");

    logoutButton?.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "./homepage.html";
    });
}
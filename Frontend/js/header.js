export function header () {
    const headerContainer = document.querySelector("#header");

    if (!headerContainer) {
        return;
    }

    const token = localStorage.getItem("token");

  const accountElement = token
    ? `
        <button type="button" id="logout-button" class="header-action" aria-label="Log out">
            <span class="material-symbols-rounded" aria-hidden="true">
                logout
            </span>
        </button>

        <a href="./receipt.html" class="header-action" aria-label="profile" >
            <span class="material-symbols-rounded" aria-hidden="true">
                person
            </span>
        </a>
        `
    : `
    <a href="./login.html" class="header-action" aria-label="Log in or create an account" >
    <span class="material-symbols-rounded" aria-hidden="true">
    login
    </span>
      </a>
    `;

    headerContainer.innerHTML = `
        <header class="site-header">

            <a href= "./homepage.html" class="logo">
              <img src="../assets/logo/white-on-color.svg" alt="Shirt lab">
            </a>

            <div class="header-actions">
                ${accountElement}

                <a href="./cart.html" class="header-action" aria-label="Open shopping cart">
                    <span class="material-symbols-rounded" aria-hidden="true">
                    local_mall
                    </span>
                </a>
            </div>

        </header>
        `;

  const logoutButton =
    headerContainer.querySelector("#logout-button");

  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "./homepage.html";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const VAULTWISE_ADDRESS = "0xde8365dAF3CFdF952E2F946F19a4DcAcd57eFf0F";
  const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  const AMOY_CHAIN_ID_DECIMAL = 80002;
  const AMOY_CHAIN_ID_HEX = "0x13882";
  const AMOY_RPC = "https://rpc-amoy.polygon.technology";

  const EXTRA_USDC_ABI = [
    {
      type: "function",
      name: "allowance",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
    },
  ];

  const FULL_USDC_ABI =
    typeof USDC_ABI !== "undefined" ? [...USDC_ABI, ...EXTRA_USDC_ABI] : EXTRA_USDC_ABI;

  let provider = null;
  let signer = null;
  let vaultWise = null;
  let usdc = null;
  let connectedWallet = null;
  let username = localStorage.getItem("vaultwiseUsername");
  let savedAvatar = localStorage.getItem("vaultwiseAvatar");
  let isBalanceHidden = false;

  const landingPage = document.getElementById("landingPage");
  const appContainer = document.getElementById("appContainer");
  const startAppBtn = document.getElementById("startAppBtn");

  const usernameModal = document.getElementById("usernameModal");
  const usernameInput = document.getElementById("usernameInput");
  const avatarInput = document.getElementById("avatarInput");
  const saveUsernameBtn = document.getElementById("saveUsernameBtn");

  const desktopUser = document.querySelector(".desktop-user");
  const mobileUser = document.querySelector(".mobile-username");
  const profileUsername = document.querySelector(".profile-username");
  const userAvatars = document.querySelectorAll(".user-avatar");

  const connectWalletBtns = document.querySelectorAll(
    "#connectWalletBtn, #connectWalletBtnDesktop, #modalConnectWalletBtn"
  );

  const walletBox = document.getElementById("walletBox");
  const walletDisplayBtn = document.getElementById("walletDisplayBtn");
  const walletDropdown = document.getElementById("walletDropdown");
  const walletShortText = document.getElementById("walletShortText");
  const copyWalletBtn = document.getElementById("copyWalletBtn");
  const disconnectWalletBtn = document.getElementById("disconnectWalletBtn");
  const profileWalletText = document.getElementById("profileWalletText");
  const modalWalletText = document.getElementById("modalWalletText");

  const toggleBtn = document.getElementById("toggleBalance");
  const balanceAmount = document.getElementById("balanceAmount");
  const balanceChange = document.getElementById("balanceChange");

  const vaultGrid = document.getElementById("vaultGrid");
  const createVaultModal = document.getElementById("createVaultModal");
  const openCreateVaultModal = document.getElementById("openCreateVaultModal");
  const closeCreateVaultModal = document.getElementById("closeCreateVaultModal");
  const cancelCreateVaultBtn = document.getElementById("cancelCreateVaultBtn");
  const createVaultBtn = document.getElementById("createVaultBtn");

  function getDefaultAvatar(name = "User") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffffff&color=000000`;
  }

  function setUserUI(name, avatarUrl) {
    const displayName = "@" + name;

    if (desktopUser) desktopUser.innerText = displayName;
    if (mobileUser) mobileUser.innerText = displayName;
    if (profileUsername) profileUsername.innerText = displayName;

    userAvatars.forEach((avatar) => {
      avatar.src = avatarUrl || getDefaultAvatar(name);
    });
  }

  function shortAddress(address) {
    if (!address) return "Not connected";
    return address.slice(0, 6) + "..." + address.slice(-4);
  }

  function showDashboard() {
    if (landingPage) landingPage.style.display = "none";
    if (usernameModal) usernameModal.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");
    loadUserVaults();
  }

  function showLanding() {
    if (landingPage) landingPage.style.display = "grid";
    if (appContainer) appContainer.classList.add("hidden");
  }

  async function switchToAmoy() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      });
    } catch (error) {
      if (
        error.code === 4902 ||
        error.message?.includes("Unrecognized chain ID") ||
        error.message?.includes("wallet_addEthereumChain")
      ) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: AMOY_CHAIN_ID_HEX,
              chainName: "Polygon Amoy Testnet",
              nativeCurrency: {
                name: "POL",
                symbol: "POL",
                decimals: 18,
              },
              rpcUrls: [AMOY_RPC],
              blockExplorerUrls: ["https://amoy.polygonscan.com"],
            },
          ],
        });

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: AMOY_CHAIN_ID_HEX }],
        });
      } else {
        throw error;
      }
    }
  }

  async function setupContracts() {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    connectedWallet = await signer.getAddress();

    vaultWise = new ethers.Contract(VAULTWISE_ADDRESS, VAULTWISE_ABI, signer);
    usdc = new ethers.Contract(USDC_ADDRESS, FULL_USDC_ABI, signer);
  }

  async function updateWalletBalance(wallet) {
    try {
      if (!window.ethereum || !ethers || !wallet) return;

      const balance = await provider.getBalance(wallet);
      const formattedBalance = Number(ethers.formatEther(balance)).toFixed(4);

      if (balanceAmount) {
        balanceAmount.textContent = `${formattedBalance} POL`;
        balanceAmount.dataset.real = `${formattedBalance} POL`;
      }

      if (balanceChange) {
        balanceChange.textContent = "Live wallet balance";
        balanceChange.dataset.real = "Live wallet balance";
      }
    } catch (error) {
      console.error("Balance fetch failed:", error);
    }
  }

  function showConnectedUI(wallet) {
    connectedWallet = wallet;

    connectWalletBtns.forEach((btn) => {
      btn.classList.add("hidden");
    });

    if (walletBox) walletBox.classList.remove("hidden");
    if (walletShortText) walletShortText.innerText = shortAddress(wallet);
    if (profileWalletText) profileWalletText.innerText = shortAddress(wallet);
    if (modalWalletText) modalWalletText.innerText = `Connected: ${shortAddress(wallet)}`;

    updateWalletBalance(wallet);

    if (!username) {
      if (landingPage) landingPage.style.display = "none";
      if (usernameModal) usernameModal.classList.remove("hidden");
    } else {
      setUserUI(username, savedAvatar || getDefaultAvatar(username));
      showDashboard();
    }

    lucide.createIcons();
  }

  function showDisconnectedUI() {
    connectedWallet = null;
    provider = null;
    signer = null;
    vaultWise = null;
    usdc = null;

    connectWalletBtns.forEach((btn) => {
      btn.classList.remove("hidden");
      btn.innerText = "Connect Wallet";
    });

    if (walletBox) walletBox.classList.add("hidden");
    if (walletDropdown) walletDropdown.classList.add("hidden");
    if (profileWalletText) profileWalletText.innerText = "Not connected";
    if (modalWalletText) modalWalletText.innerText = "Wallet not connected";

    if (balanceAmount) {
      balanceAmount.textContent = "0.0000 POL";
      balanceAmount.dataset.real = "0.0000 POL";
    }

    if (balanceChange) {
      balanceChange.textContent = "Connect wallet to view balance";
      balanceChange.dataset.real = "Connect wallet to view balance";
    }

    renderVaults([]);
    lucide.createIcons();
  }

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not detected. Please install MetaMask or use a wallet browser.");
      return;
    }

    try {
      await switchToAmoy();

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      await setupContracts();

      showConnectedUI(accounts[0]);
    } catch (error) {
      console.error(error);
      alert(error.shortMessage || error.message || "Wallet connection failed or rejected.");
    }
  }

  function openCreateVault() {
    if (!connectedWallet) {
      alert("Please connect your wallet first.");
      return;
    }

    if (createVaultModal) {
      createVaultModal.classList.remove("hidden");
    }
  }

  function closeCreateVault() {
    if (createVaultModal) createVaultModal.classList.add("hidden");

    const vaultNameInput = document.getElementById("vaultNameInput");
    const goalAmountInput = document.getElementById("goalAmountInput");
    const currentAmountInput = document.getElementById("currentAmountInput");
    const durationInput = document.getElementById("durationInput");

    if (vaultNameInput) vaultNameInput.value = "";
    if (goalAmountInput) goalAmountInput.value = "";
    if (currentAmountInput) currentAmountInput.value = "";
    if (durationInput) durationInput.value = "";
  }

  function parseDurationToSeconds(durationText) {
    const clean = durationText.toLowerCase().trim();
    const number = parseInt(clean.match(/\d+/)?.[0] || "30", 10);

    if (clean.includes("year")) return number * 365 * 24 * 60 * 60;
    if (clean.includes("month")) return number * 30 * 24 * 60 * 60;
    if (clean.includes("week")) return number * 7 * 24 * 60 * 60;
    if (clean.includes("day")) return number * 24 * 60 * 60;

    return 30 * 24 * 60 * 60;
  }

  function formatDuration(seconds) {
    const days = Math.floor(Number(seconds) / 86400);

    if (days >= 365) return `${Math.floor(days / 365)} year(s)`;
    if (days >= 30) return `${Math.floor(days / 30)} month(s)`;
    if (days >= 7) return `${Math.floor(days / 7)} week(s)`;
    return `${days || 1} day(s)`;
  }

  function renderVaults(vaults = []) {
    if (!vaultGrid) return;

    if (!connectedWallet) {
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="plus"></i></span>
            <h3>Create Vault</h3>
            <p>Connect wallet to create vault</p>
          </div>
        </div>
      `;

      document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);
      lucide.createIcons();
      return;
    }

    if (vaults.length === 0) {
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="plus"></i></span>
            <h3>Create Vault</h3>
            <p>Create your first savings vault</p>
          </div>
        </div>
      `;

      document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);
      lucide.createIcons();
      return;
    }

    vaultGrid.innerHTML = "";

    vaults.forEach((vault) => {
      const goalAmount = Number(ethers.formatUnits(vault.goalAmount, 6));
      const currentAmount = Number(ethers.formatUnits(vault.balance, 6));
      const progress = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;
      const remaining = Math.max(goalAmount - currentAmount, 0);
      const duration = formatDuration(vault.duration);
      const status = vault.invested ? "Invested" : "Active";

      vaultGrid.innerHTML += `
        <div class="vault-card">
          <div class="vault-head">
            <div class="vault-icon">
              <i data-lucide="badge-dollar-sign"></i>
            </div>

            <div>
              <h3>Vault #${vault.id} <span>${status}</span></h3>
              <p>Main Vault • ${duration}</p>
            </div>
          </div>

          <div class="vault-info">
            <div>
              <small>Savings Goal</small>
              <h4>$${goalAmount.toFixed(2)}</h4>
            </div>

            <div>
              <small>Current Amount</small>
              <h4 class="blue">$${currentAmount.toFixed(2)}</h4>
            </div>
          </div>

          <div class="progress-row">
            <small>Progress</small>
            <small>${progress.toFixed(2)}%</small>
          </div>

          <div class="progress">
            <span style="width: ${Math.min(progress, 100)}%"></span>
          </div>

          <small>$${remaining.toFixed(2)} to go</small>

          <button class="details-btn vault-action-btn" data-vault-id="${vault.id}">
            View vault details <i data-lucide="chevron-right"></i>
          </button>
        </div>
      `;
    });

    document.querySelectorAll(".vault-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openVaultActions(btn.dataset.vaultId);
      });
    });

    lucide.createIcons();
  }

  async function loadUserVaults() {
    if (!vaultWise || !connectedWallet) {
      renderVaults([]);
      return;
    }

    try {
      vaultGrid.innerHTML = `<p class="loading-vaults">Loading your vaults...</p>`;

      const ids = await vaultWise.getUserVaults(connectedWallet);
      const vaults = [];

      for (const id of ids) {
        try {
          const vault = await vaultWise.getVault(id);
          vaults.push({
            id: id.toString(),
            owner: vault.owner,
            goalAmount: vault.goalAmount,
            balance: vault.balance,
            createdAt: vault.createdAt,
            duration: vault.duration,
            invested: vault.invested,
            exists: vault.exists,
          });
        } catch (error) {
          console.error("Failed to load vault:", id.toString(), error);
        }
      }

      renderVaults(vaults);
    } catch (error) {
      console.error("Load vaults error:", error);
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="plus"></i></span>
            <h3>Create Vault</h3>
            <p>Could not load vaults. Try refreshing.</p>
          </div>
        </div>
      `;

      document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);
      lucide.createIcons();
    }
  }

  async function createVaultOnChain() {
    const name = document.getElementById("vaultNameInput").value.trim();
    const goalAmountValue = document.getElementById("goalAmountInput").value;
    const durationValue = document.getElementById("durationInput").value.trim();

    if (!name || !goalAmountValue || !durationValue) {
      alert("Please fill in vault name, goal amount, and duration.");
      return;
    }

    if (!connectedWallet) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      if (!vaultWise) {
        await setupContracts();
      }

      createVaultBtn.disabled = true;
      createVaultBtn.innerText = "Creating Vault...";

      const goalAmount = ethers.parseUnits(goalAmountValue.toString(), 6);
      const duration = parseDurationToSeconds(durationValue);

      const tx = await vaultWise.createVault(goalAmount, duration);
      await tx.wait();

      alert("Vault created successfully 🎉");

      closeCreateVault();

      try {
        await loadUserVaults();
      } catch (refreshError) {
        console.log("Vault refresh skipped:", refreshError);
      }

      document.querySelector('[data-page="home"]')?.click();
    } catch (error) {
      console.error("Create vault error:", error);

      if (error.code === 4001) {
        alert("Transaction rejected.");
      } else {
        alert(
          error.reason ||
            error.shortMessage ||
            error.message ||
            "Vault creation failed."
        );
      }
    } finally {
      createVaultBtn.disabled = false;
      createVaultBtn.innerText = "Create Vault";
    }
  }

  async function depositToVault(vaultId) {
    if (!connectedWallet || !vaultWise || !usdc) {
      alert("Connect wallet first.");
      return;
    }

    const amount = prompt("Enter USDC amount to deposit:");

    if (!amount || Number(amount) <= 0) return;

    try {
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);

      const allowance = await usdc.allowance(connectedWallet, VAULTWISE_ADDRESS);

      if (allowance < parsedAmount) {
        const approveTx = await usdc.approve(VAULTWISE_ADDRESS, parsedAmount);
        await approveTx.wait();
      }

      const depositTx = await vaultWise.deposit(vaultId, parsedAmount);
      await depositTx.wait();

      alert("Deposit successful.");
      await loadUserVaults();
    } catch (error) {
      console.error("Deposit error:", error);
      alert(error.reason || error.shortMessage || error.message || "Deposit failed.");
    }
  }

  async function investVault(vaultId) {
    if (!connectedWallet || !vaultWise) {
      alert("Connect wallet first.");
      return;
    }

    try {
      const tx = await vaultWise.invest(vaultId);
      await tx.wait();

      alert("Vault invested successfully.");
      await loadUserVaults();
    } catch (error) {
      console.error("Invest error:", error);
      alert(error.reason || error.shortMessage || error.message || "Invest failed.");
    }
  }

  async function withdrawFromVault(vaultId) {
    if (!connectedWallet || !vaultWise) {
      alert("Connect wallet first.");
      return;
    }

    const amount = prompt("Enter USDC amount to withdraw:");

    if (!amount || Number(amount) <= 0) return;

    try {
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);

      const tx = await vaultWise.withdraw(vaultId, parsedAmount);
      await tx.wait();

      alert("Withdrawal requested.");
      await loadUserVaults();
    } catch (error) {
      console.error("Withdraw error:", error);
      alert(error.reason || error.shortMessage || error.message || "Withdrawal failed.");
    }
  }

  function openVaultActions(vaultId) {
    const action = prompt(
      `Vault #${vaultId}\n\nType one action:\ndeposit\ninvest\nwithdraw`
    );

    if (!action) return;

    const cleanAction = action.toLowerCase().trim();

    if (cleanAction === "deposit") depositToVault(vaultId);
    else if (cleanAction === "invest") investVault(vaultId);
    else if (cleanAction === "withdraw") withdrawFromVault(vaultId);
    else alert("Invalid action. Type deposit, invest, or withdraw.");
  }

  if (username) {
    setUserUI(username, savedAvatar || getDefaultAvatar(username));
    showDashboard();
  } else {
    showLanding();
  }

  if (startAppBtn) {
    startAppBtn.addEventListener("click", () => {
      if (landingPage) landingPage.style.display = "none";
      if (usernameModal) usernameModal.classList.remove("hidden");
    });
  }

  connectWalletBtns.forEach((btn) => {
    btn.addEventListener("click", connectWallet);
  });

  if (walletDisplayBtn) {
    walletDisplayBtn.addEventListener("click", () => {
      walletDropdown.classList.toggle("hidden");
    });
  }

  if (copyWalletBtn) {
    copyWalletBtn.addEventListener("click", async () => {
      if (!connectedWallet) return;

      await navigator.clipboard.writeText(connectedWallet);

      copyWalletBtn.innerHTML = `<i data-lucide="check"></i> Copied`;
      lucide.createIcons();

      setTimeout(() => {
        copyWalletBtn.innerHTML = `<i data-lucide="copy"></i> Copy Address`;
        lucide.createIcons();
      }, 1500);
    });
  }

  if (disconnectWalletBtn) {
    disconnectWalletBtn.addEventListener("click", () => {
      showDisconnectedUI();
      showLanding();
    });
  }

  if (saveUsernameBtn) {
    saveUsernameBtn.addEventListener("click", () => {
      const name = usernameInput.value.trim();

      if (!name) {
        alert("Please enter a username.");
        return;
      }

      if (!connectedWallet) {
        alert("Please connect your wallet first.");
        return;
      }

      username = name;
      localStorage.setItem("vaultwiseUsername", name);

      const file = avatarInput.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = () => {
          const avatarData = reader.result;

          localStorage.setItem("vaultwiseAvatar", avatarData);
          savedAvatar = avatarData;

          setUserUI(name, avatarData);
          usernameModal.classList.add("hidden");
          showDashboard();
        };

        reader.readAsDataURL(file);
      } else {
        const defaultAvatar = getDefaultAvatar(name);

        localStorage.setItem("vaultwiseAvatar", defaultAvatar);
        savedAvatar = defaultAvatar;

        setUserUI(name, defaultAvatar);
        usernameModal.classList.add("hidden");
        showDashboard();
      }
    });
  }

  if (toggleBtn && balanceAmount && balanceChange) {
    toggleBtn.addEventListener("click", () => {
      isBalanceHidden = !isBalanceHidden;

      if (isBalanceHidden) {
        balanceAmount.textContent = "****";
        balanceChange.textContent = "****";
        toggleBtn.innerHTML = `<i data-lucide="eye-off"></i>`;
      } else {
        balanceAmount.textContent = balanceAmount.dataset.real;
        balanceChange.textContent = balanceChange.dataset.real;
        toggleBtn.innerHTML = `<i data-lucide="eye"></i>`;
      }

      lucide.createIcons();
    });
  }

  const navLinks = document.querySelectorAll(".nav-link");

  const pages = {
    home: document.getElementById("homePage"),
    save: document.getElementById("savePage"),
    invest: document.getElementById("investPage"),
    profile: document.getElementById("profilePage"),
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const selectedPage = link.dataset.page;

      navLinks.forEach((item) => {
        item.classList.remove("active");
      });

      document.querySelectorAll(`[data-page="${selectedPage}"]`).forEach((item) => {
        item.classList.add("active");
      });

      Object.values(pages).forEach((page) => {
        if (page) page.classList.add("hidden");
      });

      if (pages[selectedPage]) {
        pages[selectedPage].classList.remove("hidden");
      }

      lucide.createIcons();
    });
  });

  if (openCreateVaultModal) {
    openCreateVaultModal.addEventListener("click", openCreateVault);
  }

  if (closeCreateVaultModal) {
    closeCreateVaultModal.addEventListener("click", closeCreateVault);
  }

  if (cancelCreateVaultBtn) {
    cancelCreateVaultBtn.addEventListener("click", closeCreateVault);
  }

  if (createVaultModal) {
    createVaultModal.addEventListener("click", (e) => {
      if (e.target === createVaultModal) {
        closeCreateVault();
      }
    });
  }

  if (createVaultBtn) {
    createVaultBtn.addEventListener("click", createVaultOnChain);
  }

  renderVaults([]);

  const transferOverlay = document.getElementById("transferOverlay");
  const transferTitle = document.getElementById("transferTitle");
  const transferBackBtn = document.getElementById("transferBackBtn");
  const transferCloseBtn = document.getElementById("transferCloseBtn");
  const tokenSelectScreen = document.getElementById("tokenSelectScreen");
  const sendFormScreen = document.getElementById("sendFormScreen");
  const receiveScreen = document.getElementById("receiveScreen");
  const tokenSearchInput = document.getElementById("tokenSearchInput");
  const transferTokenList = document.getElementById("transferTokenList");
  const transferEmptyState = document.getElementById("transferEmptyState");
  const sendSelectedToken = document.getElementById("sendSelectedToken");
  const receiveSelectedToken = document.getElementById("receiveSelectedToken");
  const sendAddressInput = document.getElementById("sendAddressInput");
  const sendAmountInput = document.getElementById("sendAmountInput");
  const sendNextBtn = document.getElementById("sendNextBtn");
  const receiveAddressText = document.getElementById("receiveAddressText");
  const copyReceiveAddressBtn = document.getElementById("copyReceiveAddressBtn");

  const tokenAssets = [
    { symbol: "USDT", name: "Tether USD", coinClass: "usdt", icon: "₮", balance: "$1,320.7043", value: "$1,320.70" },
    { symbol: "ETH", name: "Ethereum", coinClass: "eth", icon: "◆", balance: "0.50 ETH", value: "$1,165.64" },
    { symbol: "ATOM", name: "Cosmos", coinClass: "atom", icon: "✺", balance: "20 ATOM", value: "$39.40" },
    { symbol: "TON", name: "Ton", coinClass: "ton", icon: "▽", balance: "40 TON", value: "$52.80" },
    { symbol: "AXL", name: "Axelar", coinClass: "axl", icon: "✖", balance: "100 AXL", value: "$5.92" },
    { symbol: "BTC", name: "Bitcoin", coinClass: "btc", icon: "₿", balance: "0.02 BTC", value: "$1,566.24" },
  ];

  let transferMode = "send";
  let selectedTransferToken = null;

  function tokenCardHTML(token) {
    return `
      <div class="coin ${token.coinClass}">${token.icon}</div>
      <div>
        <h3>${token.symbol}</h3>
        <p>${token.name}</p>
      </div>
    `;
  }

  function fullTokenItemHTML(token) {
    return `
      <button class="transfer-token-item" data-symbol="${token.symbol}">
        <div class="coin ${token.coinClass}">${token.icon}</div>

        <div class="token-meta">
          <h3>${token.symbol}</h3>
          <p>${token.name}</p>
        </div>

        <div class="token-right">
          <h4>${token.balance}</h4>
          <p>${token.value}</p>
        </div>
      </button>
    `;
  }

  function renderTransferTokens(filter = "") {
    const cleanFilter = filter.toLowerCase().trim();

    const filteredTokens = tokenAssets.filter((token) => {
      return (
        token.symbol.toLowerCase().includes(cleanFilter) ||
        token.name.toLowerCase().includes(cleanFilter)
      );
    });

    if (filteredTokens.length === 0) {
      transferTokenList.innerHTML = "";
      transferEmptyState.classList.remove("hidden");
      return;
    }

    transferEmptyState.classList.add("hidden");
    transferTokenList.innerHTML = filteredTokens.map(fullTokenItemHTML).join("");

    document.querySelectorAll(".transfer-token-item").forEach((item) => {
      item.addEventListener("click", () => {
        const symbol = item.dataset.symbol;
        const token = tokenAssets.find((asset) => asset.symbol === symbol);
        selectTransferToken(token);
      });
    });

    lucide.createIcons();
  }

  function showTransferScreen(screen) {
    tokenSelectScreen.classList.add("hidden");
    sendFormScreen.classList.add("hidden");
    receiveScreen.classList.add("hidden");

    screen.classList.remove("hidden");
  }

  function openTransfer(mode) {
    transferMode = mode;
    selectedTransferToken = null;

    transferTitle.innerText = mode === "send" ? "Send" : "Receive";
    tokenSearchInput.value = "";

    transferOverlay.classList.remove("hidden");
    showTransferScreen(tokenSelectScreen);
    renderTransferTokens();

    lucide.createIcons();
  }

  function closeTransfer() {
    transferOverlay.classList.add("hidden");
    sendAddressInput.value = "";
    sendAmountInput.value = "";
    sendNextBtn.disabled = true;
  }

  function selectTransferToken(token) {
    selectedTransferToken = token;

    if (transferMode === "send") {
      transferTitle.innerText = `Send ${token.symbol}`;
      sendSelectedToken.innerHTML = tokenCardHTML(token);
      showTransferScreen(sendFormScreen);
    } else {
      transferTitle.innerText = `Receive ${token.symbol}`;
      receiveSelectedToken.innerHTML = tokenCardHTML(token);
      receiveAddressText.innerText = connectedWallet || "Connect wallet first";
      showTransferScreen(receiveScreen);
    }

    lucide.createIcons();
  }

  function validateSendForm() {
    const address = sendAddressInput.value.trim();
    const amount = Number(sendAmountInput.value);

    sendNextBtn.disabled = !(address.length > 10 && amount > 0);
  }

  document.getElementById("sendActionBtn")?.addEventListener("click", () => {
    openTransfer("send");
  });

  document.getElementById("receiveActionBtn")?.addEventListener("click", () => {
    openTransfer("receive");
  });

  transferCloseBtn?.addEventListener("click", closeTransfer);

  transferBackBtn?.addEventListener("click", () => {
    if (!tokenSelectScreen.classList.contains("hidden")) {
      closeTransfer();
      return;
    }

    transferTitle.innerText = transferMode === "send" ? "Send" : "Receive";
    showTransferScreen(tokenSelectScreen);
  });

  tokenSearchInput?.addEventListener("input", () => {
    renderTransferTokens(tokenSearchInput.value);
  });

  sendAddressInput?.addEventListener("input", validateSendForm);
  sendAmountInput?.addEventListener("input", validateSendForm);

  sendNextBtn?.addEventListener("click", async () => {
    if (!selectedTransferToken) return;

    if (!connectedWallet || !usdc) {
      alert("Connect wallet first.");
      return;
    }

    if (selectedTransferToken.symbol !== "USDT") {
      alert("Only USDC transfer is connected for this hackathon demo.");
      return;
    }

    try {
      const receiver = sendAddressInput.value.trim();
      const amount = ethers.parseUnits(sendAmountInput.value, 6);

      const tx = await usdc.transfer(receiver, amount);
      await tx.wait();

      alert("Transfer successful.");
      closeTransfer();
      await updateWalletBalance(connectedWallet);
    } catch (error) {
      console.error("Transfer error:", error);
      alert(error.reason || error.shortMessage || error.message || "Transfer failed.");
    }
  });

  copyReceiveAddressBtn?.addEventListener("click", async () => {
    if (!connectedWallet) {
      alert("Connect wallet first.");
      return;
    }

    await navigator.clipboard.writeText(connectedWallet);
    copyReceiveAddressBtn.innerHTML = `<i data-lucide="check"></i>`;

    lucide.createIcons();

    setTimeout(() => {
      copyReceiveAddressBtn.innerHTML = `<i data-lucide="copy"></i>`;
      lucide.createIcons();
    }, 1200);
  });

  const demoHoldings = {
    tether: 1320.7043,
    ethereum: 0.5,
    cosmos: 20,
    "the-open-network": 40,
    axelar: 100,
    bitcoin: 0.02,
  };

  async function fetchCryptoPrices() {
    const coinIds = Object.keys(demoHoldings).join(",");

    const url =
      `https://api.coingecko.com/api/v3/coins/markets` +
      `?vs_currency=usd` +
      `&ids=${coinIds}` +
      `&order=market_cap_desc` +
      `&per_page=100` +
      `&page=1` +
      `&sparkline=false` +
      `&price_change_percentage=24h`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch crypto prices");
      }

      const coins = await response.json();

      coins.forEach((coin) => {
        const asset = document.querySelector(`[data-coin="${coin.id}"]`);
        if (!asset) return;

        const priceEl = asset.querySelector(".coin-price");
        const changeEl = asset.querySelector(".coin-change");
        const valueEl = asset.querySelector(".coin-value");

        const price = coin.current_price;
        const change = coin.price_change_percentage_24h || 0;
        const holding = demoHoldings[coin.id];
        const totalValue = price * holding;

        priceEl.textContent = `$${price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: price < 1 ? 4 : 2,
        })}`;

        changeEl.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;

        changeEl.classList.remove("positive", "negative");
        changeEl.classList.add(change >= 0 ? "positive" : "negative");

        valueEl.textContent = `$${totalValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      });
    } catch (error) {
      console.error(error);

      document.querySelectorAll(".coin-price").forEach((item) => {
        item.textContent = "Price unavailable";
      });
    }
  }

  fetchCryptoPrices();
  setInterval(fetchCryptoPrices, 60000);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (!accounts.length) {
        showDisconnectedUI();
        showLanding();
        return;
      }

      try {
        await setupContracts();
        showConnectedUI(accounts[0]);
      } catch (error) {
        console.error(error);
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
});

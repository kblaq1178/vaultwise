document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const VAULTWISE_ADDRESS = "0xde8365dAF3CFdF952E2F946F19a4DcAcd57eFf0F";
  const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  const AMOY_CHAIN_ID_DECIMAL = 80002;
  const AMOY_CHAIN_ID_HEX = "0x13882";
  const AMOY_RPC_URL = "https://rpc-amoy.polygon.technology";
  const AMOY_EXPLORER = "https://amoy.polygonscan.com";

  const FALLBACK_VAULTWISE_ABI = [
    {
      type: "function",
      name: "createVault",
      inputs: [
        { name: "goalAmount", type: "uint256" },
        { name: "duration", type: "uint256" },
      ],
      outputs: [{ name: "vaultId", type: "uint256" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "deposit",
      inputs: [
        { name: "vaultId", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "invest",
      inputs: [{ name: "vaultId", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "withdraw",
      inputs: [
        { name: "vaultId", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getVault",
      inputs: [{ name: "vaultId", type: "uint256" }],
      outputs: [
        {
          name: "",
          type: "tuple",
          components: [
            { name: "owner", type: "address" },
            { name: "goalAmount", type: "uint256" },
            { name: "balance", type: "uint256" },
            { name: "createdAt", type: "uint256" },
            { name: "duration", type: "uint256" },
            { name: "invested", type: "bool" },
            { name: "exists", type: "bool" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getUserVaults",
      inputs: [{ name: "user", type: "address" }],
      outputs: [{ name: "", type: "uint256[]" }],
      stateMutability: "view",
    },
    {
      type: "event",
      name: "VaultCreated",
      inputs: [
        { name: "owner", type: "address", indexed: true },
        { name: "vaultId", type: "uint256", indexed: true },
        { name: "goalAmount", type: "uint256", indexed: false },
        { name: "duration", type: "uint256", indexed: false },
      ],
    },
  ];

  const FALLBACK_USDC_ABI = [
    {
      type: "function",
      name: "approve",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
    },
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
      name: "balanceOf",
      inputs: [{ name: "account", type: "address" }],
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
    {
      type: "function",
      name: "decimals",
      inputs: [],
      outputs: [{ name: "", type: "uint8" }],
      stateMutability: "view",
    },
  ];

  function getVaultWiseAbi() {
    return typeof VAULTWISE_ABI !== "undefined" ? VAULTWISE_ABI : FALLBACK_VAULTWISE_ABI;
  }

  function getUsdcAbi() {
    const baseAbi = typeof USDC_ABI !== "undefined" ? USDC_ABI : FALLBACK_USDC_ABI;
    const extendedAbi = [...baseAbi];

    if (!extendedAbi.some((item) => item.name === "allowance")) {
      extendedAbi.push(FALLBACK_USDC_ABI.find((item) => item.name === "allowance"));
    }

    if (!extendedAbi.some((item) => item.name === "transfer")) {
      extendedAbi.push(FALLBACK_USDC_ABI.find((item) => item.name === "transfer"));
    }

    return extendedAbi;
  }

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
  const createVaultBtn = document.getElementById("createVaultBtn");
  const cancelCreateVaultBtn = document.getElementById("cancelCreateVaultBtn");

  let username = localStorage.getItem("vaultwiseUsername");
  let savedAvatar = localStorage.getItem("vaultwiseAvatar");
  let connectedWallet = null;
  let provider = null;
  let signer = null;
  let vaultWise = null;
  let usdc = null;
  let isBalanceHidden = false;
  let onChainVaults = [];
  let vaultMeta = JSON.parse(localStorage.getItem("vaultwiseVaultMeta")) || {};

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

  function showDashboard() {
    if (landingPage) landingPage.style.display = "none";
    if (appContainer) appContainer.classList.remove("hidden");
    renderVaults();
  }

  function showLanding() {
    if (landingPage) landingPage.style.display = "grid";
    if (appContainer) appContainer.classList.add("hidden");
  }

  function shortAddress(address) {
    if (!address) return "";
    return address.slice(0, 6) + "..." + address.slice(-4);
  }

  function metaKey(wallet, vaultId) {
    return `${wallet.toLowerCase()}-${vaultId.toString()}`;
  }

  function saveVaultMeta() {
    localStorage.setItem("vaultwiseVaultMeta", JSON.stringify(vaultMeta));
  }

  function formatUSDC(value) {
    return Number(ethers.formatUnits(value || 0n, 6));
  }

  function parseUSDC(value) {
    return ethers.parseUnits(String(value || "0"), 6);
  }

  function durationToSeconds(text) {
    const clean = String(text).toLowerCase().trim();
    const match = clean.match(/(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years|hour|hours)?/);
    if (!match) return 30 * 24 * 60 * 60;

    const amount = Number(match[1]);
    const unit = match[2] || "days";

    if (unit.startsWith("hour")) return Math.floor(amount * 60 * 60);
    if (unit.startsWith("week")) return Math.floor(amount * 7 * 24 * 60 * 60);
    if (unit.startsWith("month")) return Math.floor(amount * 30 * 24 * 60 * 60);
    if (unit.startsWith("year")) return Math.floor(amount * 365 * 24 * 60 * 60);
    return Math.floor(amount * 24 * 60 * 60);
  }

  function secondsToDuration(secondsValue) {
    const seconds = Number(secondsValue || 0n);
    const days = Math.max(Math.round(seconds / 86400), 1);
    if (days >= 365) return `${Math.round(days / 365)} year${Math.round(days / 365) > 1 ? "s" : ""}`;
    if (days >= 30) return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? "s" : ""}`;
    if (days >= 7) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? "s" : ""}`;
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  async function addAmoyNetwork() {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: AMOY_CHAIN_ID_HEX,
          chainName: "Polygon Amoy Testnet",
          nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
          rpcUrls: [AMOY_RPC_URL],
          blockExplorerUrls: [AMOY_EXPLORER],
        },
      ],
    });
  }

  async function switchToAmoy() {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (String(currentChainId).toLowerCase() === AMOY_CHAIN_ID_HEX.toLowerCase()) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      });
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      const shouldAddNetwork =
        error?.code === 4902 ||
        error?.data?.originalError?.code === 4902 ||
        message.includes("unrecognized chain") ||
        message.includes("unknown chain") ||
        message.includes("not been added");

      if (!shouldAddNetwork) {
        throw error;
      }

      await addAmoyNetwork();

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      });
    }
  }

  async function initContracts() {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== AMOY_CHAIN_ID_DECIMAL) {
      await switchToAmoy();
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    }

    connectedWallet = await signer.getAddress();
    vaultWise = new ethers.Contract(VAULTWISE_ADDRESS, getVaultWiseAbi(), signer);
    usdc = new ethers.Contract(USDC_ADDRESS, getUsdcAbi(), signer);
  }

  async function updateWalletBalance(wallet) {
    try {
      if (!window.ethereum || !ethers || !provider) return;
      const balance = await provider.getBalance(wallet);
      const formattedBalance = Number(ethers.formatEther(balance)).toFixed(4);
      const usdcBalance = usdc ? await usdc.balanceOf(wallet) : 0n;
      const formattedUsdc = formatUSDC(usdcBalance).toFixed(2);

      if (balanceAmount) {
        balanceAmount.textContent = `${formattedBalance} POL`;
        balanceAmount.dataset.real = `${formattedBalance} POL`;
      }

      if (balanceChange) {
        balanceChange.textContent = `${formattedUsdc} USDC available`;
        balanceChange.dataset.real = `${formattedUsdc} USDC available`;
      }
    } catch (error) {
      console.error("Balance fetch failed:", error);
    }
  }

  async function loadUserVaults() {
    if (!vaultWise || !connectedWallet) {
      onChainVaults = [];
      renderVaults();
      return;
    }

    try {
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder loading">
          <div class="create-vault-inner">
            <span><i data-lucide="loader-circle"></i></span>
            <h3>Loading Vaults</h3>
            <p>Reading your vaults from Polygon Amoy</p>
          </div>
        </div>
      `;
      lucide.createIcons();

      const vaultIds = await vaultWise.getUserVaults(connectedWallet);
      const vaultData = await Promise.all(
        vaultIds.map(async (id) => {
          const vault = await vaultWise.getVault(id);
          const key = metaKey(connectedWallet, id);
          const meta = vaultMeta[key] || {};

          return {
            id,
            owner: vault.owner,
            name: meta.name || `Vault #${id.toString()}`,
            goalAmount: vault.goalAmount,
            currentAmount: vault.balance,
            createdAt: vault.createdAt,
            duration: vault.duration,
            durationLabel: meta.durationLabel || secondsToDuration(vault.duration),
            invested: vault.invested,
            exists: vault.exists,
          };
        })
      );

      onChainVaults = vaultData.filter((vault) => vault.exists);
      renderVaults();
    } catch (error) {
      console.error("Vault loading failed:", error);
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="alert-circle"></i></span>
            <h3>Could not load vaults</h3>
            <p>Check your network and try again</p>
          </div>
        </div>
      `;
      document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);
      lucide.createIcons();
    }
  }

  async function showConnectedUI(wallet) {
    connectedWallet = wallet;

    connectWalletBtns.forEach((btn) => btn.classList.add("hidden"));
    if (walletBox) walletBox.classList.remove("hidden");
    if (walletShortText) walletShortText.innerText = shortAddress(wallet);
    if (profileWalletText) profileWalletText.innerText = shortAddress(wallet);
    if (modalWalletText) modalWalletText.innerText = `Connected: ${shortAddress(wallet)}`;

    await updateWalletBalance(wallet);

    if (!username) {
      if (landingPage) landingPage.style.display = "none";
      usernameModal.classList.remove("hidden");
    } else {
      setUserUI(username, savedAvatar || getDefaultAvatar(username));
      showDashboard();
      await loadUserVaults();
    }

    lucide.createIcons();
  }

  function showDisconnectedUI() {
    connectedWallet = null;
    provider = null;
    signer = null;
    vaultWise = null;
    usdc = null;
    onChainVaults = [];

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

    renderVaults();
    lucide.createIcons();
  }

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not detected. Please install MetaMask or use the MetaMask browser.");
      return;
    }

    try {
      await switchToAmoy();
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await initContracts();
      await showConnectedUI(connectedWallet);
    } catch (error) {
      console.error(error);
      alert(error?.shortMessage || error?.message || "Wallet connection failed or rejected.");
    }
  }

  function openCreateVault() {
    if (!connectedWallet) {
      connectWallet();
      return;
    }

    if (createVaultModal) createVaultModal.classList.remove("hidden");
  }

  function closeCreateVault() {
    if (!createVaultModal) return;

    createVaultModal.classList.add("hidden");

    const nameInput = document.getElementById("vaultNameInput");
    const goalInput = document.getElementById("goalAmountInput");
    const currentInput = document.getElementById("currentAmountInput");
    const durationInput = document.getElementById("durationInput");

    if (nameInput) nameInput.value = "";
    if (goalInput) goalInput.value = "";
    if (currentInput) currentInput.value = "";
    if (durationInput) durationInput.value = "";
  }

  function renderVaults() {
    if (!vaultGrid) return;

    if (!connectedWallet) {
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="plus"></i></span>
            <h3>Create Vault</h3>
            <p>Connect wallet to create your first vault</p>
          </div>
        </div>
      `;
      document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);
      lucide.createIcons();
      return;
    }

    if (onChainVaults.length === 0) {
      vaultGrid.innerHTML = `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="plus"></i></span>
            <h3>Create Vault</h3>
            <p>Create your first on-chain USDC vault</p>
          </div>
        </div>
      `;
      document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);
      lucide.createIcons();
      return;
    }

    vaultGrid.innerHTML = onChainVaults
      .map((vault) => {
        const goal = formatUSDC(vault.goalAmount);
        const balance = formatUSDC(vault.currentAmount);
        const progress = goal > 0 ? (balance / goal) * 100 : 0;
        const remaining = Math.max(goal - balance, 0);
        const statusText = vault.invested ? "Invested" : "Active";
        const statusClass = vault.invested ? "invested" : "pending";

        return `
          <div class="vault-card" data-vault-id="${vault.id.toString()}">
            <div class="vault-head">
              <div class="vault-icon">
                <i data-lucide="badge-dollar-sign"></i>
              </div>

              <div>
                <h3>${vault.name} <span class="status-pill ${statusClass}">${statusText}</span></h3>
                <p>Main Vault • ${vault.durationLabel}</p>
              </div>
            </div>

            <div class="vault-info">
              <div>
                <small>Savings Goal</small>
                <h4>$${goal.toFixed(2)}</h4>
              </div>

              <div>
                <small>Current Amount</small>
                <h4 class="blue">$${balance.toFixed(2)}</h4>
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

            <div class="vault-actions">
              <button class="deposit-vault-btn" data-vault-id="${vault.id.toString()}">Deposit</button>
              <button class="invest-vault-btn" data-vault-id="${vault.id.toString()}" ${vault.invested || balance <= 0 ? "disabled" : ""}>Invest</button>
              <button class="withdraw-vault-btn" data-vault-id="${vault.id.toString()}" ${balance <= 0 ? "disabled" : ""}>Withdraw</button>
            </div>
          </div>
        `;
      })
      .join("");

    vaultGrid.insertAdjacentHTML(
      "beforeend",
      `
        <div class="create-vault-placeholder" id="emptyCreateVaultBtn">
          <div class="create-vault-inner">
            <span><i data-lucide="plus"></i></span>
            <h3>Create Vault</h3>
            <p>Add another savings vault</p>
          </div>
        </div>
      `
    );

    document.getElementById("emptyCreateVaultBtn")?.addEventListener("click", openCreateVault);

    document.querySelectorAll(".deposit-vault-btn").forEach((btn) => {
      btn.addEventListener("click", () => depositToVault(btn.dataset.vaultId));
    });

    document.querySelectorAll(".invest-vault-btn").forEach((btn) => {
      btn.addEventListener("click", () => investVault(btn.dataset.vaultId));
    });

    document.querySelectorAll(".withdraw-vault-btn").forEach((btn) => {
      btn.addEventListener("click", () => withdrawFromVault(btn.dataset.vaultId));
    });

    lucide.createIcons();
  }

  async function ensureReady() {
    if (!connectedWallet || !vaultWise || !usdc) {
      await connectWallet();
    }

    if (!connectedWallet || !vaultWise || !usdc) {
      throw new Error("Wallet is not connected.");
    }
  }

  async function approveIfNeeded(amount) {
    const allowance = await usdc.allowance(connectedWallet, VAULTWISE_ADDRESS);
    if (allowance >= amount) return;

    const approveTx = await usdc.approve(VAULTWISE_ADDRESS, amount);
    await approveTx.wait();
  }

  async function createVaultOnChain() {
    const nameInput = document.getElementById("vaultNameInput");
    const goalInput = document.getElementById("goalAmountInput");
    const currentInput = document.getElementById("currentAmountInput");
    const durationInput = document.getElementById("durationInput");

    const name = nameInput.value.trim();
    const goalAmount = Number(goalInput.value);
    const initialDeposit = Number(currentInput.value || 0);
    const durationText = durationInput.value.trim();

    if (!name || !goalAmount || !durationText) {
      alert("Please fill in vault name, goal amount, and duration.");
      return;
    }

    if (goalAmount <= 0 || initialDeposit < 0) {
      alert("Enter a valid goal amount and initial deposit.");
      return;
    }

    try {
      await ensureReady();
      createVaultBtn.disabled = true;
      createVaultBtn.innerText = "Creating vault...";

      const goal = parseUSDC(goalAmount);
      const durationSeconds = BigInt(durationToSeconds(durationText));
      const tx = await vaultWise.createVault(goal, durationSeconds);
      const receipt = await tx.wait();

      let newVaultId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = vaultWise.interface.parseLog(log);
          if (parsed && parsed.name === "VaultCreated") {
            newVaultId = parsed.args.vaultId;
            break;
          }
        } catch (_) {}
      }

      if (newVaultId === null) {
        const ids = await vaultWise.getUserVaults(connectedWallet);
        newVaultId = ids[ids.length - 1];
      }

      vaultMeta[metaKey(connectedWallet, newVaultId)] = {
        name,
        durationLabel: durationText,
      };
      saveVaultMeta();

      if (initialDeposit > 0) {
        createVaultBtn.innerText = "Approving deposit...";
        const depositAmount = parseUSDC(initialDeposit);
        await approveIfNeeded(depositAmount);

        createVaultBtn.innerText = "Depositing...";
        const depositTx = await vaultWise.deposit(newVaultId, depositAmount);
        await depositTx.wait();
      }

      closeCreateVault();

      await loadUserVaults();
      await updateWalletBalance(connectedWallet);
      document.querySelector('[data-page="home"]')?.click();
      alert("Vault created successfully.");
    } catch (error) {
      console.error(error);
      alert(error?.shortMessage || error?.reason || error?.message || "Vault creation failed.");
    } finally {
      createVaultBtn.disabled = false;
      createVaultBtn.innerText = "Create Vault";
    }
  }

  async function depositToVault(vaultId) {
    const amount = prompt("Enter USDC amount to deposit:");
    if (!amount || Number(amount) <= 0) return;

    try {
      await ensureReady();
      const parsedAmount = parseUSDC(amount);
      await approveIfNeeded(parsedAmount);
      const tx = await vaultWise.deposit(vaultId, parsedAmount);
      await tx.wait();
      await loadUserVaults();
      await updateWalletBalance(connectedWallet);
      alert("Deposit successful.");
    } catch (error) {
      console.error(error);
      alert(error?.shortMessage || error?.reason || error?.message || "Deposit failed.");
    }
  }

  async function investVault(vaultId) {
    if (!confirm("Invest this vault into Aave V3?")) return;

    try {
      await ensureReady();
      const tx = await vaultWise.invest(vaultId);
      await tx.wait();
      await loadUserVaults();
      alert("Vault invested successfully.");
    } catch (error) {
      console.error(error);
      alert(error?.shortMessage || error?.reason || error?.message || "Investment failed.");
    }
  }

  async function withdrawFromVault(vaultId) {
    const amount = prompt("Enter USDC amount to withdraw/request:");
    if (!amount || Number(amount) <= 0) return;

    try {
      await ensureReady();
      const tx = await vaultWise.withdraw(vaultId, parseUSDC(amount));
      await tx.wait();
      await loadUserVaults();
      await updateWalletBalance(connectedWallet);
      alert("Withdrawal request submitted.");
    } catch (error) {
      console.error(error);
      alert(error?.shortMessage || error?.reason || error?.message || "Withdrawal failed.");
    }
  }

  const hasCompletedSetup = localStorage.getItem("vaultwiseSetupComplete") === "true";

  if (username || hasCompletedSetup) {
    if (username) {
      setUserUI(username, savedAvatar || getDefaultAvatar(username));
    }
    showDashboard();
  } else {
    showLanding();
  }

  if (startAppBtn) {
    startAppBtn.addEventListener("click", () => {
      if (landingPage) landingPage.style.display = "none";
      usernameModal.classList.remove("hidden");
    });
  }

  connectWalletBtns.forEach((btn) => btn.addEventListener("click", connectWallet));

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
    saveUsernameBtn.addEventListener("click", async () => {
      const name = usernameInput.value.trim();

      if (!name) {
        alert("Please enter a username.");
        return;
      }

      if (!connectedWallet) {
        alert("Please connect your wallet first.");
        return;
      }

      saveUsernameBtn.disabled = true;
      saveUsernameBtn.innerText = "Saving...";

      try {
        username = name;
        localStorage.setItem("vaultwiseUsername", name);
        localStorage.setItem("vaultwiseSetupComplete", "true");

        const finishSetup = async (avatarUrl) => {
          savedAvatar = avatarUrl;
          localStorage.setItem("vaultwiseAvatar", avatarUrl);

          setUserUI(name, avatarUrl);
          usernameModal.classList.add("hidden");
          if (landingPage) landingPage.style.display = "none";
          if (appContainer) appContainer.classList.remove("hidden");

          await updateWalletBalance(connectedWallet);
          await loadUserVaults();

          document.querySelectorAll(".page, .page-section").forEach((page) => {
            page.classList.add("hidden");
          });
          document.getElementById("homePage")?.classList.remove("hidden");
          document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
          document.querySelectorAll('[data-page="home"]').forEach((item) => item.classList.add("active"));

          lucide.createIcons();
        };

        const file = avatarInput.files[0];

        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            await finishSetup(reader.result);
            saveUsernameBtn.disabled = false;
            saveUsernameBtn.innerText = "Continue";
          };
          reader.onerror = () => {
            saveUsernameBtn.disabled = false;
            saveUsernameBtn.innerText = "Continue";
            alert("Avatar upload failed. Please try again.");
          };
          reader.readAsDataURL(file);
        } else {
          await finishSetup(getDefaultAvatar(name));
          saveUsernameBtn.disabled = false;
          saveUsernameBtn.innerText = "Continue";
        }
      } catch (error) {
        console.error(error);
        saveUsernameBtn.disabled = false;
        saveUsernameBtn.innerText = "Continue";
        alert(error?.shortMessage || error?.message || "Profile setup failed.");
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
      navLinks.forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(`[data-page="${selectedPage}"]`).forEach((item) => item.classList.add("active"));
      Object.values(pages).forEach((page) => page && page.classList.add("hidden"));
      if (pages[selectedPage]) pages[selectedPage].classList.remove("hidden");
      lucide.createIcons();
    });
  });

  if (openCreateVaultModal) openCreateVaultModal.addEventListener("click", openCreateVault);
  if (closeCreateVaultModal) closeCreateVaultModal.addEventListener("click", closeCreateVault);
  if (cancelCreateVaultBtn) cancelCreateVaultBtn.addEventListener("click", closeCreateVault);
  if (createVaultModal) {
    createVaultModal.addEventListener("click", (event) => {
      if (event.target === createVaultModal) closeCreateVault();
    });
  }
  if (createVaultBtn) createVaultBtn.addEventListener("click", createVaultOnChain);

  renderVaults();

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
    { symbol: "USDC", name: "USD Coin", coinClass: "usdt", icon: "$", balance: "Live", value: "Polygon Amoy" },
    { symbol: "POL", name: "Polygon", coinClass: "eth", icon: "◆", balance: "Live", value: "Gas token" },
    { symbol: "ETH", name: "Ethereum", coinClass: "eth", icon: "◆", balance: "Demo", value: "$0.00" },
    { symbol: "BTC", name: "Bitcoin", coinClass: "btc", icon: "₿", balance: "Demo", value: "$0.00" },
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
        <div class="token-meta"><h3>${token.symbol}</h3><p>${token.name}</p></div>
        <div class="token-right"><h4>${token.balance}</h4><p>${token.value}</p></div>
      </button>
    `;
  }

  function renderTransferTokens(filter = "") {
    const cleanFilter = filter.toLowerCase().trim();
    const filteredTokens = tokenAssets.filter((token) => token.symbol.toLowerCase().includes(cleanFilter) || token.name.toLowerCase().includes(cleanFilter));

    if (filteredTokens.length === 0) {
      transferTokenList.innerHTML = "";
      transferEmptyState.classList.remove("hidden");
      return;
    }

    transferEmptyState.classList.add("hidden");
    transferTokenList.innerHTML = filteredTokens.map(fullTokenItemHTML).join("");
    document.querySelectorAll(".transfer-token-item").forEach((item) => {
      item.addEventListener("click", () => selectTransferToken(tokenAssets.find((asset) => asset.symbol === item.dataset.symbol)));
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
    if (!connectedWallet) {
      connectWallet();
      return;
    }

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
    sendNextBtn.disabled = !(ethers.isAddress(address) && amount > 0);
  }

  document.getElementById("sendActionBtn")?.addEventListener("click", () => openTransfer("send"));
  document.getElementById("receiveActionBtn")?.addEventListener("click", () => openTransfer("receive"));
  transferCloseBtn?.addEventListener("click", closeTransfer);

  transferBackBtn?.addEventListener("click", () => {
    if (!tokenSelectScreen.classList.contains("hidden")) return closeTransfer();
    transferTitle.innerText = transferMode === "send" ? "Send" : "Receive";
    showTransferScreen(tokenSelectScreen);
  });

  tokenSearchInput?.addEventListener("input", () => renderTransferTokens(tokenSearchInput.value));
  sendAddressInput?.addEventListener("input", validateSendForm);
  sendAmountInput?.addEventListener("input", validateSendForm);

  sendNextBtn?.addEventListener("click", async () => {
    if (!selectedTransferToken) return;

    try {
      await ensureReady();
      const to = sendAddressInput.value.trim();
      const amount = sendAmountInput.value;

      if (selectedTransferToken.symbol === "USDC") {
        const tx = await usdc.transfer(to, parseUSDC(amount));
        await tx.wait();
        alert("USDC sent successfully.");
      } else if (selectedTransferToken.symbol === "POL") {
        const tx = await signer.sendTransaction({ to, value: ethers.parseEther(amount) });
        await tx.wait();
        alert("POL sent successfully.");
      } else {
        alert("Only USDC and POL transfers are enabled on this testnet build.");
      }

      await updateWalletBalance(connectedWallet);
      closeTransfer();
    } catch (error) {
      console.error(error);
      alert(error?.shortMessage || error?.reason || error?.message || "Transfer failed.");
    }
  });

  copyReceiveAddressBtn?.addEventListener("click", async () => {
    if (!connectedWallet) return alert("Connect wallet first.");
    await navigator.clipboard.writeText(connectedWallet);
    copyReceiveAddressBtn.innerHTML = `<i data-lucide="check"></i>`;
    lucide.createIcons();
    setTimeout(() => {
      copyReceiveAddressBtn.innerHTML = `<i data-lucide="copy"></i>`;
      lucide.createIcons();
    }, 1200);
  });

  async function fetchCryptoPrices() {
    const demoHoldings = { ethereum: 0.5, bitcoin: 0.02 };
    const coinIds = Object.keys(demoHoldings).join(",");
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch crypto prices");
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
        priceEl.textContent = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 4 : 2 })}`;
        changeEl.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
        changeEl.classList.remove("positive", "negative");
        changeEl.classList.add(change >= 0 ? "positive" : "negative");
        valueEl.textContent = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        await initContracts();
        await showConnectedUI(accounts[0]);
      } catch (error) {
        console.error(error);
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
});

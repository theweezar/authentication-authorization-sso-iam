const copyButton = document.getElementById("copy-password-button");
const passwordElement = document.getElementById("generated-password");
const statusElement = document.getElementById("copy-status");

if (copyButton && passwordElement && statusElement) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(passwordElement.textContent ?? "");
      statusElement.textContent = "Password copied to clipboard.";
    } catch (error) {
      statusElement.textContent = "Unable to copy password automatically.";
      console.error(error);
    }
  });
}

import { expect, test } from "@playwright/test";

test.describe("PAM release smoke", () => {
  test("publieke pagina's laden rustig", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "PAM", exact: true })).toBeVisible();
    await expect(page.getByText(/your personal asset manager/i)).toBeVisible();

    await page.goto("/intro");
    await expect(page.getByText(/waarom pam bestaat/i)).toBeVisible();
    await expect(page.getByText(/grip op wat waarde heeft/i)).toBeVisible();
  });

  test("operationele routes zijn beschermd zonder login", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/veilig verder met je persoonlijke overzicht/i)).toBeVisible();

    await page.goto("/start");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/legacy");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("debugroute is niet publiek beschikbaar in productiepreview", async ({ page }) => {
    await page.goto("/debug-asset-register");
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/asset register/i)).toHaveCount(0);
  });

  test("account aanmaken opent de workspace local-first", async ({ page }) => {
    const uniqueEmail = `release-${Date.now()}@example.test`;

    await page.goto("/login");
    await page.getByLabel("Naam").fill("Release Tester");
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByLabel("Wachtwoord").fill("testwachtwoord123");
    await page.getByRole("button", { name: /maak mijn pam-account/i }).click();

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("button", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator(".tabs").getByRole("button", { name: "Assets", exact: true })).toBeVisible();
    await expect(page.locator(".tabs").getByRole("button", { name: "Security", exact: true })).toBeVisible();
  });
});

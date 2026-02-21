import { test, expect } from '@playwright/test';

test.describe('DailySummary Supplementary Record', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming the app is running on localhost:5173
    await page.goto('http://localhost:5173');
    
    // Ensure we are on Daily Summary page
    await expect(page.locator('h2')).toContainText(/月.*日/);
  });

  test('should open supplementary modal and add a record', async ({ page }) => {
    // 1. Find and click the supplementary button
    const button = page.locator('button:has-text("补录")');
    await expect(button).toBeVisible();
    await button.click();

    // 2. Fill the form
    const modal = page.locator('.ant-modal-content');
    await expect(modal).toBeVisible();

    // Tag input (Label "标签")
    const tagInput = page.locator('input[id="tag"]'); // Ant Design usually generates id from name
    await tagInput.fill('E2E测试记录');

    // Duration input (Label "时长(分钟)")
    const durationInput = page.locator('input[id="duration"]');
    await durationInput.fill('45');

    // Date and Time pickers are tricky in E2E, we might just use defaults or simplified selection if possible
    // Assuming defaults (today, current time) are valid for testing
    // Or we can interact with them if needed.

    // 3. Submit
    const submitButton = page.locator('button:has-text("确 定")');
    await submitButton.click();

    // 4. Verify success message
    await expect(page.locator('.ant-message-success')).toContainText('学习记录补录成功！');

    // 5. Verify list update
    // The list item should appear in the Today's Focus list
    const listItem = page.locator('.ant-list-item').filter({ hasText: 'E2E测试记录' });
    await expect(listItem).toBeVisible();
    await expect(listItem).toContainText('45m');
  });

  test('should validate input fields', async ({ page }) => {
    const button = page.locator('button:has-text("补录")');
    await button.click();

    // Clear tag input (if it has default value)
    const tagInput = page.locator('input[id="tag"]');
    await tagInput.clear();

    const submitButton = page.locator('button:has-text("确 定")');
    await submitButton.click();

    // Expect validation error
    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
  });
});

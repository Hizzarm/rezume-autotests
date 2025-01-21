import { type Page } from '@playwright/test';

export class BasePage {
    constructor(protected page: Page) {}
    
    async goto(path: string = '/') {
        await this.page.goto(path);
        await this.handlePossibleCaptcha();
    }
    
    private async handlePossibleCaptcha() {
        // Ждем немного, чтобы увидеть, появится ли капча
        await this.page.waitForTimeout(2000);
        
        // Здесь будет логика обработки капчи, когда мы с ней столкнемся
    }
} 
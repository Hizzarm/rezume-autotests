import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BasketPage extends BasePage {
    // Локаторы элементов корзины
    readonly plusButton: Locator;
    readonly minusButton: Locator;
    readonly deleteButton: Locator;
    readonly firstProduct: Locator;
    readonly secondProduct: Locator;
    readonly basketLink: Locator;
    readonly emptyBasketButton: Locator;

    constructor(page: Page) {
        super(page);
        
        // Инициализируем локаторы
        this.plusButton = page.locator('.count__plus').first();
        this.minusButton = page.locator('.count__minus').first();
        this.deleteButton = page.locator('.btn__del');
        this.firstProduct = page.locator('.list-item__wrap').first();
        this.secondProduct = page.locator('.list-item__wrap').last();
        // Уточняем локатор корзины
        this.basketLink = page.locator('.navbar-pc__item.j-item-basket .navbar-pc__link');
        this.emptyBasketButton = page.locator('.basket-empty__btn');
    }

    /**
     * Переход в корзину
     */
    async openBasket(): Promise<void> {
        await this.basketLink.click();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Удалить второй товар из корзины
     */
    async deleteSecondProduct(): Promise<void> {
        await this.deleteButton.last().click();
        await this.page.waitForSelector('.list-item__wrap', { state: 'attached' }); // Ждём, пока товар исчезнет
    }
    
    async increaseFirstProductQuantity(): Promise<void> {
        await this.plusButton.click();
        await this.page.waitForSelector('.count__plus', { state: 'visible' }); // Ждём обновления количества
    }
    
    async decreaseFirstProductQuantity(): Promise<void> {
        await this.minusButton.click();
        await this.page.waitForSelector('.count__minus', { state: 'visible' }); // Ждём обновления количества
    }

    /**
     * Удалить первый товар из корзины
     */
    async deleteFirstProduct(): Promise<void> {
        await this.deleteButton.first().click();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Вернуться на главную страницу из пустой корзины
     */
    async returnToMain(): Promise<void> {
        await this.emptyBasketButton.waitFor({ state: 'visible' });
        await this.emptyBasketButton.click();
        await this.page.waitForLoadState('networkidle');
    }
} 
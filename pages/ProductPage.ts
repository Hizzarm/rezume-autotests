import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
    // Основные элементы карточки товара
    readonly productBrand: Locator;
    readonly productTitle: Locator;
    readonly productRating: Locator;
    readonly productReviewsCount: Locator;
    readonly priceWithWallet: Locator;
    readonly priceRegular: Locator;
    readonly priceOld: Locator;
    readonly addToCartButton: Locator;
    readonly sizeSelector: Locator;
    readonly productImages: Locator;
    readonly nextImageButton: Locator;
    readonly mainImage: Locator;
    readonly sizePopup: Locator;
    readonly firstAvailableSize: Locator;
    readonly addToCartSuccess: Locator;
    readonly articleNumber: Locator;
    readonly backButton: Locator;

    constructor(page: Page) {
        super(page);
        
        // Инициализируем локаторы
        this.productBrand = page.locator('span.product-page__brand');
        this.productTitle = page.locator('h1.product-page__title');
        this.productRating = page.locator('.address-rate-mini--sm');
        this.productReviewsCount = page.locator('.product-review');
        this.priceWithWallet = page.locator('.price-block__wallet-price');
        this.priceRegular = page.locator('.price-block__final-price');
        this.priceOld = page.locator('.price-block__old-price');
        this.addToCartButton = page.locator('.product-page__order-buttons button.order__button.btn-main').first();
        this.sizeSelector = page.locator('.sizes-list__button:not(.disabled)');
        this.productImages = page.locator('.swiper-wrapper .slide__content img');
        this.nextImageButton = page.locator('button.mix-block__slider-btn.mix-block__slider-btn--next');
        this.mainImage = page.locator('.photo-zoom__preview');
        this.sizePopup = page.locator('.popup.popup-list-of-sizes');
        this.firstAvailableSize = page.locator('.sizes-list__button:not(.disabled)').first();
        this.addToCartSuccess = page.locator('.product-page__order-buttons .j-go-to-basket').first();
        this.articleNumber = page.locator('#productNmId');
        this.backButton = page.locator('button.breadcrumbs__back');
    }

    async addToCart(): Promise<void> {
        // Нажимаем кнопку "Добавить в корзину"
        await this.addToCartButton.click();
        
        // Ждем появления окна выбора размера
        await this.sizePopup.waitFor({ state: 'visible' });
        
        // Выбираем первый доступный размер
        await this.firstAvailableSize.click();
        
        // Ждем подтверждения добавления в корзину
        await this.addToCartSuccess.waitFor({ state: 'visible', timeout: 5000 });
    }

    async browseProductImages(count: number = 3, delay: number = 2000): Promise<void> {
        // Пролистываем указанное количество раз
        for (let i = 0; i < count; i++) {
            // Задержка перед следующим слайдом
            await this.page.waitForTimeout(delay);
            
            // Кликаем на кнопку следующего слайда
            await this.nextImageButton.click();
        }
    }

    async checkReviews(delay: number): Promise<void> {
        // Нажимаем на отзывы
        await this.productReviewsCount.click();
        
        // Ждем появления и исчезновения лоадера
        const loader = this.page.locator('.general-preloader');
        await loader.waitFor({ state: 'visible' });
        await loader.waitFor({ state: 'hidden', timeout: 30000 });
        
        // Ждем появления списка отзывов
        const sortByRatingButton = this.page.locator('.sorting__list li:nth-child(2) a');
        await sortByRatingButton.waitFor({ state: 'visible' });
        
        // Сортируем по оценке
        await sortByRatingButton.click();
        await this.page.waitForLoadState('networkidle');
        
        // Задержка для просмотра отсортированных отзывов
        await this.page.waitForTimeout(delay);
        
        // Возвращаемся к карточке товара
        await this.page.locator('.product-feedbacks__back').click();
        await this.page.waitForLoadState('networkidle');
    }

    async getArticleNumber(): Promise<string> {
        // Получаем артикул товара
        const article = await this.articleNumber.textContent();
        return article?.trim() || '';
    }

    async goBack(): Promise<void> {
        // Возвращаемся на предыдущую страницу
        await this.backButton.click();
        // Ждем загрузки страницы
        await this.page.waitForLoadState('networkidle');
    }

    // Другие методы для работы с карточкой товара будем добавлять по мере необходимости
} 
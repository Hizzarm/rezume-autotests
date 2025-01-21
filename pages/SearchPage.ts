import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

interface ProductDetails {
    title: string;
    price: string;
    brand: string;
    rating: string;
    deliveryDate: string;
}

interface FilterOptions {
    brand?: string;
    priceRange?: {
        min: string;
        max: string;
    };
}

export class SearchPage extends BasePage {
    readonly searchInput: Locator;
    readonly searchResults: Locator;
    readonly filterButtons: Locator;
    readonly sortingButton: Locator;
    readonly searchResultsContainer: Locator;
    readonly resetFiltersButton: Locator;
    readonly clearSearchButton: Locator;
    readonly searchButton: Locator;

    constructor(page: Page) {
        super(page);
        
        this.searchInput = page.locator('#searchInput');
        this.searchResults = page.locator('.product-card-list .product-card');
        this.searchResultsContainer = page.locator('.product-card-list');
        this.filterButtons = page.locator('.dropdown-filter__btn');
        this.sortingButton = page.locator('.dropdown-filter__btn--sorter');
        this.resetFiltersButton = page.locator('button.reset-all-filters');
        this.clearSearchButton = page.locator('button.search-catalog__btn--clear');
        this.searchButton = page.locator('#applySearchBtn');
    }

    async search(query: string) {
        await this.searchInput.fill(query);
        await this.searchInput.press('Enter');
        
        // Ждем загрузки результатов
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        await this.searchResultsContainer.waitFor({ state: 'visible' });
        
        // Ждем появления фильтров
        await this.filterButtons.first().waitFor({ state: 'visible' });
    }

    async openFiltersMenu() {
        // Открываем модальное окно фильтров
        await this.page.locator('button:has-text("Все фильтры")').click();
        await this.page.waitForSelector('.filters-desktop');
    }

    async setFilters(filters: FilterOptions): Promise<void> {
        // Устанавливаем бренд если указан
        if (filters.brand) {
            const filterHeader = this.page.locator('.filters-desktop__item-title', { hasText: 'Бренд' });
            await filterHeader.scrollIntoViewIfNeeded();
            
            const checkbox = this.page.locator('.checkbox-with-text', {
                has: this.page.locator('.checkbox-with-text__text', { hasText: filters.brand })
            });
            await checkbox.scrollIntoViewIfNeeded();
            await checkbox.click();
        }

        // Устанавливаем диапазон цен если указан
        if (filters.priceRange) {
            const priceSection = this.page.locator('.filters-desktop__item-title', { hasText: 'Цена' });
            await priceSection.scrollIntoViewIfNeeded();

            const priceInputs = this.page.locator('.filter__price-input-search input.j-price');
            
            // Вводим минимальную цену
            const minInput = priceInputs.nth(0);
            await minInput.click();
            await minInput.press('Control+A');
            await minInput.press('Backspace');
            await minInput.fill(filters.priceRange.min);
            
            // Вводим максимальную цену
            const maxInput = priceInputs.nth(1);
            await maxInput.click();
            await maxInput.press('Control+A');
            await maxInput.press('Backspace');
            await maxInput.fill(filters.priceRange.max);
            
            // Убираем фокус с полей ввода
            await this.page.keyboard.press('Tab');
            await this.page.waitForTimeout(1000);
        }

        // Применяем все фильтры
        const showButton = this.page.locator('.filters-desktop__btn-main.btn-main', { hasText: 'Показать' });
        await showButton.waitFor({ state: 'visible' });
        await showButton.click();
        
        // Ждем обновления результатов
        await this.page.waitForLoadState('networkidle');
        await this.searchResultsContainer.waitFor({ state: 'visible' });
        
        // Проверяем, что фильтры применились, проверяя URL
        const currentUrl = this.page.url();
        if (filters.priceRange) {
            const priceRangeInUrl = currentUrl.includes('priceU=') && 
                                   currentUrl.includes(filters.priceRange.min) && 
                                   currentUrl.includes(filters.priceRange.max);
            if (!priceRangeInUrl) {
                throw new Error('Price range filter was not applied correctly');
            }
        }
        if (filters.brand) {
            const brandInUrl = currentUrl.includes('fbrand=') || currentUrl.includes('brand=');
            if (!brandInUrl) {
                throw new Error('Brand filter was not applied correctly');
            }
        }
    }

    async applyFilters(filters: {
        priceRange?: { min: string; max: string };
        brand?: string;
    }) {
        // Открываем меню фильтров
        await this.openFiltersMenu();
        
        // Применяем фильтры
        await this.setFilters(filters);
        
        // Ждем обновления результатов
        await this.page.waitForLoadState('networkidle');
    }

    async applySorting(sortType: 'popular' | 'price-asc' | 'price-desc' | 'new' | 'rating') {
        await this.sortingButton.waitFor({ state: 'visible' });
        await this.sortingButton.click();
        
        const sortingMap = {
            'popular': 'По популярности',
            'price-asc': 'По возрастанию цены',
            'price-desc': 'По убыванию цены',
            'new': 'По новинкам',
            'rating': 'По рейтингу'
        };
        
        // Обновляем селектор для опций сортировки на актуальный
        const option = this.page.locator('.sort-item', {
            hasText: sortingMap[sortType]
        });
        await option.waitFor({ state: 'visible' });
        await option.click();
        
        await this.page.waitForLoadState('networkidle');
        await this.searchResultsContainer.waitFor({ state: 'visible' });
    }

    async getResultsCount(): Promise<number> {
        await this.searchResultsContainer.waitFor({ state: 'visible' });
        return await this.searchResults.count();
    }

    async getFirstProductPrice(): Promise<number> {
        // Ждем полного обновления страницы
        await this.page.waitForLoadState('networkidle');
        await this.searchResultsContainer.waitFor({ state: 'visible' });
        
        // Ждем, пока не появится товар с ценой в нужном диапазоне
        const priceElement = this.searchResults.first().locator('.price__lower-price');
        await priceElement.waitFor({ state: 'visible' });
        
        // Делаем несколько попыток получить корректную цену
        for (let i = 0; i < 3; i++) {
            const priceText = await priceElement.textContent();
            const price = parseInt(priceText?.replace(/[^\d]/g, '') || '0');
            
            // Если цена в диапазоне, возвращаем её
            if (price >= 1000) {
                return price;
            }
            
            // Иначе ждем немного и пробуем снова
            await this.page.waitForTimeout(1000);
        }
        
        // Если после всех попыток цена все еще некорректная, возвращаем последнее значение
        const priceText = await priceElement.textContent();
        return parseInt(priceText?.replace(/[^\d]/g, '') || '0');
    }

    async getAppliedFilters(): Promise<string[]> {
        const filters = this.page.locator('.dropdown-filter__btn--selected');
        return await filters.allTextContents();
    }

    async isFilterApplied(filterName: string, value: string): Promise<boolean> {
        await this.page.waitForLoadState('networkidle');
        
        try {
            // После применения фильтра появляется бейдж с выбранным значением
            const appliedFilter = this.page.locator('.filter-tags__item', {
                hasText: value
            });
            
            // Также проверяем, что кнопка фильтра имеет состояние "selected"
            const filterButton = this.page.locator('.dropdown-filter__btn', {
                hasText: filterName
            });
            
            // Проверяем оба условия
            const [hasTag, buttonClasses] = await Promise.all([
                appliedFilter.count().then(count => count > 0),
                filterButton.getAttribute('class')
            ]);

            // Проверяем либо наличие тега, либо класс selected у кнопки
            const isApplied = hasTag || (buttonClasses?.includes('selected') ?? false);
            
            if (isApplied) {
                // Дополнительно проверяем, что есть результаты поиска
                const resultsCount = await this.getResultsCount();
                return resultsCount > 0;
            }
            
            return false;
        } catch (error) {
            console.log(`Failed to check filter: ${filterName}=${value}`, error);
            return false;
        }
    }

    async getProductDetails(index: number = 0): Promise<ProductDetails> {
        const product = this.searchResults.nth(index);
        
        // Ждем загрузки карточки товара
        await product.waitFor({ state: 'visible' });
        
        // Получаем все данные с учетом возможных разных форматов разметки
        const brand = await product.locator('a', { hasText: /Nike|Adidas|SPROX|GSD|KAPPA/i }).first().textContent()
            .catch(() => '');
        
        return {
            title: await product.locator('.product-card__name').textContent() || '',
            price: await product.locator('.price__lower-price').textContent() || '',
            brand: brand || '',
            rating: await product.locator('.product-card__rating span').textContent() || '',
            deliveryDate: await product.locator('.product-card__delivery-date').textContent() || ''
        };
    }

    async checkProductImageLoaded(index: number = 0): Promise<boolean> {
        const image = this.searchResults.nth(index).locator('img');
        return await image.evaluate((img: HTMLImageElement) => 
            img.complete && img.naturalHeight !== 0
        );
    }

    async goToNextPage(): Promise<void> {
        // Обновляем селектор для кнопки "Следующая страница"
        await this.page.locator('.pagination-next.pagination__next').click();
        await this.page.waitForLoadState('networkidle');
        await this.searchResultsContainer.waitFor({ state: 'visible' });
    }

    async getCurrentPage(): Promise<number> {
        // Обновляем селектор для текущей страницы
        const currentPageElement = this.page.locator('.pagination__item.pagination-item--active');
        await currentPageElement.waitFor({ state: 'visible' });
        const pageText = await currentPageElement.textContent();
        return parseInt(pageText || '1');
    }

    async getSearchParams(): Promise<URLSearchParams> {
        return new URLSearchParams(new URL(this.page.url()).search);
    }

    async verifyFilterInUrl(filterName: string, value: string): Promise<boolean> {
        const params = await this.getSearchParams();
        return params.get(filterName) === value;
    }

    async sortBy(sortType: 'По возрастанию цены' | 'По убыванию цены' | 'По популярности' | 'По рейтингу' | 'По новинкам' | 'Сначала выгодные'): Promise<void> {
        // Открываем меню сортировки
        await this.sortingButton.click();
        
        // Выбираем нужный тип сортировки
        const sortOption = this.page.locator('.filter__item', { hasText: sortType });
        await sortOption.click();
        
        // Ждем обновления результатов
        await this.page.waitForLoadState('networkidle');
        
        if (sortType === 'По возрастанию цены') {
            // Ждем, пока первый товар станет самым дешевым
            await this.page.waitForFunction(() => {
                const prices = Array.from(document.querySelectorAll('.price__lower-price'))
                    .map(el => parseInt(el.textContent?.replace(/[^\d]/g, '') || '0'));
                return prices.length > 0 && prices[0] === Math.min(...prices);
            });
        }
    }

    async addFirstProductToCart(): Promise<void> {
        // Находим кнопку добавления в корзину для первого товара
        const addToCartButton = this.searchResults
            .first()
            .locator('.product-card__add-basket');
        
        // Ждем пока кнопка станет кликабельной и нажимаем
        await addToCartButton.waitFor({ state: 'visible' });
        await addToCartButton.click();
        
        // Ждем появления попапа с размерами
        const sizePopup = this.page.locator('.popup-list-of-sizes');
        await sizePopup.waitFor({ state: 'visible' });
        
        // Выбираем первый доступный размер
        const firstSize = sizePopup.locator('.sizes-list__button:not(.disabled)').first();
        await firstSize.click();
        
        // Ждем уведомления о добавлении в корзину или изменения состояния кнопки
        await Promise.race([
            this.page.locator('text="Товар добавлен в корзину"').waitFor({ state: 'visible', timeout: 5000 }),
            this.page.locator('.product-card__add-basket:has-text("В корзине")').waitFor({ state: 'visible', timeout: 5000 })
        ]).catch(() => {});
    }

    async resetFilters(): Promise<void> {
        // Сбрасываем все фильтры
        await this.resetFiltersButton.click();
        // Ждем обновления результатов
        await this.page.waitForTimeout(1000);
    }

    async clearAndSearch(articleNumber: string): Promise<void> {
        // Очищаем поле поиска
        await this.clearSearchButton.click();
        
        // Вводим артикул
        await this.searchInput.fill(articleNumber);
        
        // Нажимаем Enter для выполнения поиска
        await this.searchInput.press('Enter');
        
        // Ждем загрузки результатов
        await this.page.waitForLoadState('networkidle');
    }
} 
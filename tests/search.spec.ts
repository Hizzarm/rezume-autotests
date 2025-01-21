import { test, type Page } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { ProductPage } from '../pages/ProductPage';
import { BasketPage } from '../pages/BasketPage';

test.describe('Product Flow', () => {
    test.setTimeout(60000);

    let page: Page;
    let searchPage: SearchPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        searchPage = new SearchPage(page);
    });

    test('search and add first product to cart', async () => {
        await searchPage.goto();
        await searchPage.search('кроссовки');
        
        await searchPage.applyFilters({
            priceRange: {
                min: '1000',
                max: '3000'
            },
            brand: 'Nike'
        });
        
        await searchPage.sortBy('По возрастанию цены');
        await searchPage.addFirstProductToCart();
        
        // Открываем второй товар для получения артикула
        const secondProduct = searchPage.searchResults.nth(1);
        await secondProduct.click();
        
        // Получаем артикул
        const productPage = new ProductPage(page);
        const articleNumber = await productPage.getArticleNumber();
        
        // Возвращаемся к результатам поиска
        await productPage.goBack();
        
        // Сбрасываем фильтры и ищем по артикулу
        await searchPage.resetFilters();
        await searchPage.clearAndSearch(articleNumber);
    });

    test('check second product details and add to cart', async () => {
        const productPage = new ProductPage(page);
        
        // Просматриваем галерею изображений
        await productPage.browseProductImages(3, 2000);
        
        // Проверяем отзывы
        await productPage.checkReviews(2000);
        
        // Добавляем товар в корзину
        await productPage.addToCart();
    });

    test('manage products in basket', async () => {
        const basketPage = new BasketPage(page);
        
        // Переходим в корзину
        await basketPage.openBasket();
        
        // Удаляем второй товар
        await basketPage.deleteSecondProduct();
        await page.waitForTimeout(1000); // пауза 1 секунда
        
        // Увеличиваем количество первого товара
        await basketPage.increaseFirstProductQuantity();
        await page.waitForTimeout(2000); // пауза 2 секунды
        
        // Уменьшаем количество первого товара
        await basketPage.decreaseFirstProductQuantity();
        await page.waitForTimeout(1000); // пауза 1 секунда
        
        // Удаляем первый товар
        await basketPage.deleteFirstProduct();
        
        // Возвращаемся на главную
        await basketPage.returnToMain();
    });
});
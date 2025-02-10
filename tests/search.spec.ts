import { test, type Page } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { ProductPage } from '../pages/ProductPage';
import { BasketPage } from '../pages/BasketPage';

test.describe('Wildberries Product Flow', () => {
    let page: Page;
    let searchPage: SearchPage;
    let productPage: ProductPage;
    let basketPage: BasketPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        searchPage = new SearchPage(page);
        productPage = new ProductPage(page);
        basketPage = new BasketPage(page);
    });

    test.describe('Search and Add to Cart', () => {
        test('search and add first product to cart', async () => {
            await searchPage.goto();
            await page.waitForTimeout(5000);
            await searchPage.search('кроссовки');
            
            await searchPage.applyFilters({
                priceRange: { min: '1000', max: '3000' },
                brand: 'Nike'
            });
            
            await searchPage.sortBy('По возрастанию цены');
            await searchPage.addFirstProductToCart();
            
            // Открываем второй товар для получения артикула
            const secondProduct = searchPage.searchResults.nth(1);
            await secondProduct.click();
            
            // Получаем артикул
            const articleNumber = await productPage.getArticleNumber();
            
            // Возвращаемся к результатам поиска
            await productPage.goBack();
            
            // Сбрасываем фильтры и ищем по артикулу
            await searchPage.resetFilters();
            await searchPage.clearAndSearch(articleNumber);
        });
    });

    test.describe('Product Details and Cart Management', () => {
        test('check second product details and add to cart', async () => {
            // Просматриваем галерею изображений
            await productPage.browseProductImages(3, 2000);
            
            // Проверяем отзывы
            await productPage.checkReviews(2000);
            
            // Добавляем товар в корзину
            await productPage.addToCart();
        });

        test('manage products in basket', async () => {
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
});
/**
* Функция для расчета выручки
* @param purchase запись о покупке
* @param _product карточка товара
* @returns {number}
*/
function calculateSimpleRevenue(purchase, _product) {
   const discount = 1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discount;
}

/**
* Функция для расчета бонусов
* @param index порядковый номер в отсортированном массиве
* @param total общее число продавцов
* @param seller карточка продавца
* @returns {number}
*/
function calculateBonusByProfit(index, total, seller) {
   if (index === 0) {
       return seller.profit * 0.15;
   } else if (index === 1 || index === 2) {
       return seller.profit * 0.10;
   } else if (index === total - 1) {
       return 0;
   } else {
       return seller.profit * 0.05;
   }
}

/**
* Функция для анализа данных продаж
* @param data
* @param options
* @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
*/
function analyzeSalesData(data, options) {
   if (!data ||
       !Array.isArray(data.sellers) ||
       data.sellers.length === 0 ||
       !Array.isArray(data.products) ||
       data.products.length === 0 ||
       !Array.isArray(data.purchase_records) ||
       data.purchase_records.length === 0) {
       throw new Error('Некорректные входные данные');
   }
   const { calculateRevenue, calculateBonus } = options;
   if (!calculateRevenue || !calculateBonus) {
       throw new Error('Чего-то не хватает');
   }
   const sellerStats = data.sellers.map(seller => ({
       id: seller.id,
       name: `${seller.first_name} ${seller.last_name}`,
       revenue: 0,
       profit: 0,
       sales_count: 0,
       products_sold: {}
   }));
   const sellerIndex = sellerStats.reduce((acc, seller) => ({ ...acc, [seller.id]: seller }), {});
   const productIndex = data.products.reduce((acc, product) => ({ ...acc, [product.sku]: product }), {});
   data.purchase_records.forEach(record => {
       const seller = sellerIndex[record.seller_id];
       seller.sales_count += 1;
       seller.revenue += record.total_amount - record.total_discount;
       record.items.forEach(item => {
           const product = productIndex[item.sku];
           const cost = product.purchase_price * item.quantity;
           const itemRevenue = calculateRevenue(item, product);
           const itemProfit = itemRevenue - cost;
           seller.profit += itemProfit;
           if (!seller.products_sold[item.sku]) {
               seller.products_sold[item.sku] = 0;
           }
           seller.products_sold[item.sku] += item.quantity;
       });
   });
   sellerStats.sort((a, b) => b.profit - a.profit);
   sellerStats.forEach((seller, index) => {
       seller.bonus = calculateBonus(index, sellerStats.length, seller);
       const topProducts = Object.entries(seller.products_sold)
           .map(([sku, quantity]) => ({ sku, quantity }))
           .sort((a, b) => b.quantity - a.quantity)
           .slice(0, 10);
       seller.top_products = topProducts;
   });
   return sellerStats.map(seller => ({
       seller_id: seller.id,
       name: seller.name,
       revenue: +seller.revenue.toFixed(2),
       profit: +seller.profit.toFixed(2),
       sales_count: seller.sales_count,
       top_products: seller.top_products,
       bonus: +seller.bonus.toFixed(2)
   }));
}


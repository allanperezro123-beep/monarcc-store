/**
 * Use Case: FilterCatalog
 * Application business rule: Filters products by multiple criteria:
 * - Category
 * - Search query (name, category, fabric, description)
 * - Available sizes
 * - Available colors
 * - Max price
 * - Seasonal discount flag
 */
export class FilterCatalogUseCase {
  execute({
    products = [],
    category = 'TODOS',
    searchQuery = '',
    size = null,
    color = null,
    maxPrice = 220000,
    onlySeasonal = false,
    vipUnlocked = false,
    vipProduct = null
  }) {
    let list = [...products];

    // If VIP is unlocked, prepend the VIP exclusive piece
    if (vipUnlocked && vipProduct && !list.some(p => p.id === vipProduct.id)) {
      list.unshift(vipProduct);
    }

    // 1. Category filter
    if (category && category !== 'TODOS') {
      const targetCat = category.toLowerCase().trim();
      list = list.filter(p => p.category.toLowerCase().includes(targetCat) || targetCat.includes(p.category.toLowerCase()));
    }

    // 2. Search query filter
    const query = String(searchQuery || '').trim().toLowerCase();
    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.fabric.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // 3. Size filter
    if (size) {
      list = list.filter(p => p.hasSize(size));
    }

    // 4. Color filter
    if (color) {
      list = list.filter(p => p.colors.some(c => c.key === color || c.name.toLowerCase() === color.toLowerCase()));
    }

    // 5. Max price filter
    if (typeof maxPrice === 'number' && maxPrice > 0) {
      list = list.filter(p => p.price.amount <= maxPrice);
    }

    // 6. Seasonal flag
    if (onlySeasonal) {
      list = list.filter(p => p.isSeasonal());
    }

    return {
      totalFound: list.length,
      filteredProducts: list
    };
  }
}


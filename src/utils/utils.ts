export function getSearchParam(search: string, keyToFind: string): string | null {
    if (search) {
        const parseSearchParams = search.split(';');
        for (const searchParam of parseSearchParams) {
        const [key, value] = searchParam.split(':');
        if (key === keyToFind) {
            return value;
        }
        }
    }
    return null;
}

export function getType() {
    return {id: 1, slug: "borisik"}
}
const defaultValue = ''
export function applyTranslations(product: any, language: string = "en"): any {
    const translations = product.translations || {};

    // Try to get the translation for the provided language
    const translation = translations[language];

    // Validate if the translation exists for the specified language
    if (translation) {
        product.name = translation.name || translations['en']?.name || defaultValue;
        product.description = translation.description || translations['en']?.description || defaultValue;
    } else {
        // Fallback to English translation or default if English doesn't exist
        product.name = translations['en']?.name || defaultValue;
        product.description = translations['en']?.description || defaultValue;
    }

    return product;
}

export function applyCategoryTranslations(category: any, language: string = "en"): any {
    const translations = category.translations || {};
  
    // Try to get the translation for the provided language
    const translation = translations[language];
  
    // Validate if the translation exists for the specified language
    if (translation) {
      category.name = translation.name || translations['en']?.name || defaultValue;
      category.details = translation.details || translations['en']?.details || defaultValue;
    } else {
      // Fallback to English translation or default if English doesn't exist
      category.name = translations['en']?.name || defaultValue;
      category.details = translations['en']?.details || defaultValue;
    }
  
    return category;
}

export function applyOrderTranslations(order: any, language: string = "en"): any {
    return {
      ...order,  // Spread the original order properties
      products: order.products.map((product) => 
        applyTranslations(product, language)
      ),  // Create a new products array with translated products
    };
  }
  
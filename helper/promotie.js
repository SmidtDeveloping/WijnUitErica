function calculatePromoPrice(product, promo) {
  if (!promo) return null;

  let finalPrice = product.prijs;

  switch (promo.type) {
    case "percentage":
      finalPrice = product.prijs - (product.prijs * promo.value) / 100;
      break;

    case "fixed":
      finalPrice = product.prijs - promo.value
      break;

    case "fixed_price":
      finalPrice = promo.value;
      break;

    case "buy_x_get_y":
      return null;
  }

  return parseFloat(finalPrice.toFixed(2));
}

module.exports = calculatePromoPrice
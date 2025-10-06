function berekenPrijs(product, quantity, promotion) {
  const prijs = Number(product.prijs);

  if (!promotion) return prijs * quantity;

  switch (promotion.type) {
    case "buy_x_get_y":
      const x = promotion.buyQuantity; // 1
      const y = promotion.getQuantity; // 1

      const bundles = Math.floor(quantity / (x + y)); // Math.floor(5/2) = 2
      const rest = quantity % (x + y);                  // 5 % 2 = 1

      const betaalAantal = bundles * x + Math.min(rest, x); // 2*1 + 1 = 3
     return  prijs * betaalAantal; 


    case "fixed":
      return Number((promotion.value * quantity).toFixed(2));

    case "percentage":
      return Number(((prijs * (1 - promotion.value / 100)) * quantity).toFixed(2));

    case "discount":
      return Number(((prijs - promotion.value) * quantity).toFixed(2));

    default:
      return Number((prijs * quantity).toFixed(2));
  }
}

module.exports = berekenPrijs

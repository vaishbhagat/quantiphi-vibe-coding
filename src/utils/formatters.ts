/**
 * Frontend formatting utility functions.
 */

/**
 * Formats a number to standard calorie metric string
 */
export function formatCalories(kcal: number): string {
  return `${Math.round(kcal).toLocaleString()} kcal`;
}

/**
 * Formats a metric number with unit (such as 'g' for macros)
 */
export function formatGrams(grams: number): string {
  return `${Math.round(grams)}g`;
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

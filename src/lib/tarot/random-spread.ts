/** Desteden rastgele benzersiz kart kimlikleri seçer — UI katmanı */
export function pickRandomSpreadIds(
  deck: readonly { id: string }[],
  count: number
): string[] {
  const pool = [...deck];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = pool[index]!;
    pool[index] = pool[swapIndex]!;
    pool[swapIndex] = current;
  }
  return pool.slice(0, count).map((card) => card.id);
}

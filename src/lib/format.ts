const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Format whole rupiah, e.g. 30000 -> "Rp 30.000". */
export const formatRupiah = (amount: number) => rupiah.format(amount);

export const NUMERIC_ONLY_MESSAGE = "NIP harus berupa angka.";
export const LETTERS_ONLY_MESSAGE = "Nama harus berupa huruf.";
export const SCORE_NUMERIC_ONLY_MESSAGE = "Skor harus berupa angka.";
export const SORT_ORDER_NUMERIC_ONLY_MESSAGE =
  "Urutan tampil harus berupa angka.";
export const EMAIL_FORMAT_MESSAGE =
  "Alamat email harus memakai format nama@domain, contoh admin@simon.local.";

export const numericOnlyPattern = /^\d+$/;
export const lettersOnlyPattern = /^[\p{L}][\p{L}\s.'-]*$/u;
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
